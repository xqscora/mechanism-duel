import assert from 'node:assert/strict';
import test from 'node:test';
import { calibrateExitRate, predictPair, rankExperiments, simulateTrajectories } from '../src/model.js';
import { calibrateLacIForGrowthCoupling, doseResponse, rankLacMeasurements, simulateLac } from '../src/cell-model.js';

test('calibrates the staged mechanism to the same reference product reading', () => {
  const rates = { directRate: 0.9, entryRate: 1.2, exitRate: calibrateExitRate(0.9, 1.2, 2.5) };
  const pair = predictPair(rates, { time: 2.5 });
  assert.ok(Math.abs(pair.direct[2] - pair.staged[2]) < 0.001);
  assert.ok(rates.exitRate > 0.1 && rates.exitRate < 8);
});

test('the hidden intermediate is absent in the direct model and appears in the staged model', () => {
  const rates = { directRate: 0.9, entryRate: 1.2, exitRate: calibrateExitRate(0.9, 1.2, 2.5) };
  const pair = predictPair(rates, { time: 1.4 });
  assert.equal(pair.direct[1], 0);
  assert.ok(pair.staged[1] > 0.1);
});

test('candidate tests rank by noise-normalized model separation', () => {
  const rates = { directRate: 0.9, entryRate: 1.2, exitRate: calibrateExitRate(0.9, 1.2, 2.5) };
  const ranked = rankExperiments(rates, 0.06);
  assert.equal(ranked.length, 4);
  assert.ok(ranked.every((item, index) => index === 0 || ranked[index - 1].separation >= item.separation));
  assert.ok(ranked[0].separation > 0);
});

test('trajectory output is finite, ordered, and respects the time range', () => {
  const rates = { directRate: 0.9, entryRate: 1.2, exitRate: calibrateExitRate(0.9, 1.2, 2.5) };
  const trajectories = simulateTrajectories(rates, { time: 6, count: 31 });
  assert.equal(trajectories.times.length, 31);
  assert.equal(trajectories.times[0], 0);
  assert.equal(trajectories.times.at(-1), 6);
  for (const series of [...trajectories.direct, ...trajectories.staged]) {
    assert.ok(series.every(Number.isFinite));
    assert.ok(series.every((value) => value >= 0));
  }
});

test('lac case returns finite nonnegative state trajectories with variable inputs', () => {
  const result = simulateLac({ lactose: 0.7 }, { lacI: 1.3, glucose: 0.4, growthCoupling: 1.2, count: 41 });
  assert.equal(result.times.length, 41);
  assert.equal(result.success, true);
  for (const series of [result.intracellularLactose, result.allolactose, result.enzyme, result.growth]) {
    assert.equal(series.length, 41);
    assert.ok(series.every((value) => Number.isFinite(value) && value >= 0));
  }
});

test('lac dose response spans the input range and produces a ranked simulation curve', () => {
  const curve = doseResponse({ points: 9, growthCoupling: 1, lacI: 1, glucose: 0 });
  assert.equal(curve.length, 9);
  assert.equal(curve[0].lactose, 0);
  assert.equal(curve.at(-1).lactose, 2);
  assert.ok(curve.every((point) => Number.isFinite(point.enzyme) && point.enzyme >= 0));
  assert.ok(curve.every((point) => Number.isFinite(point.growth) && point.growth >= 0));
});

test('lac interventions change the simulated state instead of only changing labels', () => {
  const baseline = simulateLac({ lactose: 1.1 }, { count: 31 });
  const moreRepression = simulateLac({ lactose: 1.1 }, { lacI: 1.8, count: 31 });
  const glucose = simulateLac({ lactose: 1.1 }, { glucose: 1, count: 31 });
  const noGrowthCoupling = simulateLac({ lactose: 1.1 }, { growthCoupling: 0, count: 31 });
  assert.notEqual(baseline.enzyme.at(-1), moreRepression.enzyme.at(-1));
  assert.notEqual(baseline.enzyme.at(-1), glucose.enzyme.at(-1));
  assert.ok(baseline.growth.at(-1) > noGrowthCoupling.growth.at(-1));
});

test('scheduled medium changes preserve cell state and alter later trajectories', () => {
  const input = { lactose: 0.55 };
  const baseline = simulateLac(input, { count: 19 });
  const protocol = simulateLac(input, {
    count: 19,
    protocol: [
      { time: 0, lactose: 0.55, glucose: 0 },
      { time: 5, lactose: 1.4, glucose: 1.2 },
      { time: 11, lactose: 0.2, glucose: 0.1 },
    ],
  });
  assert.equal(protocol.success, true);
  assert.equal(protocol.times.at(-1), 18);
  assert.ok(protocol.times.every((time, index) => index === 0 || time > protocol.times[index - 1]));
  const switchIndex = protocol.times.indexOf(5);
  assert.notEqual(switchIndex, -1);
  assert.ok(Math.abs(protocol.intracellularLactose[switchIndex] - baseline.intracellularLactose[5]) < 1e-8);
  assert.ok(Math.abs(protocol.enzyme[switchIndex] - baseline.enzyme[5]) < 1e-8);
  assert.notEqual(protocol.enzyme.at(-1), baseline.enzyme.at(-1));
});

test('same-endpoint histories can produce different modeled cell states', () => {
  const finalCondition = { lactose: 0.55, glucose: 0 };
  const steady = simulateLac({ lactose: finalCondition.lactose }, {
    time: 6,
    protocol: [{ time: 0, ...finalCondition }],
  });
  const pulse = simulateLac({ lactose: finalCondition.lactose }, {
    time: 6,
    protocol: [
      { time: 0, ...finalCondition },
      { time: 2, lactose: 1.5, glucose: finalCondition.glucose },
      { time: 5, ...finalCondition },
    ],
  });
  assert.equal(steady.times.at(-1), 6);
  assert.equal(pulse.times.at(-1), 6);
  assert.equal(steady.intracellularLactose[0], pulse.intracellularLactose[0]);
  assert.equal(steady.enzyme[0], pulse.enzyme[0]);
  for (const key of ['intracellularLactose', 'allolactose', 'enzyme', 'growth']) {
    assert.ok(Math.abs(steady[key].at(-1) - pulse[key].at(-1)) > 1e-8, `${key} should reflect the different path`);
  }
});

test('parameter calibration matches one readout while a shared pulse separates trajectories', () => {
  const input = { lactose: 1.1 };
  const match = calibrateLacIForGrowthCoupling(input, {
    referenceGrowthCoupling: 1,
    referenceLacI: 1,
    alternativeGrowthCoupling: 1.5,
    glucose: 0,
    time: 6,
  });
  assert.ok(match);
  assert.ok(match.absoluteError < 1e-8);
  assert.notEqual(match.alternative.lacI, match.reference.lacI);

  const protocol = [
    { time: 0, lactose: 1.1, glucose: 0 },
    { time: 2, lactose: 1.8, glucose: 0 },
    { time: 5, lactose: 1.1, glucose: 0 },
  ];
  const reference = simulateLac(input, { ...match.reference, time: 6, protocol });
  const alternative = simulateLac(input, { ...match.alternative, time: 6, protocol });
  assert.ok(Math.abs(reference.enzyme.at(-1) - alternative.enzyme.at(-1)) < 0.01);
  assert.ok(Math.abs(reference.growth.at(-1) - alternative.growth.at(-1)) > 0.01);
  assert.ok(Math.abs(reference.intracellularLactose.at(-1) - alternative.intracellularLactose.at(-1)) > 0.003);
});

test('parameter calibration reports when the alternative cannot match within the allowed range', () => {
  const match = calibrateLacIForGrowthCoupling({ lactose: 1.1 }, {
    referenceGrowthCoupling: 1,
    referenceLacI: 1,
    alternativeGrowthCoupling: 1.8,
    glucose: 0,
    time: 6,
    minimumLacI: 1,
    maximumLacI: 1.1,
  });
  assert.equal(match, null);
});

test('follow-up measurements rank model separation across readouts and times', () => {
  const input = { lactose: 1.1 };
  const match = calibrateLacIForGrowthCoupling(input, {
    referenceGrowthCoupling: 1,
    referenceLacI: 1,
    alternativeGrowthCoupling: 1.5,
    glucose: 0,
    time: 6,
  });
  const protocol = [
    { time: 0, lactose: 1.1, glucose: 0 },
    { time: 2, lactose: 1.8, glucose: 0 },
    { time: 5, lactose: 1.1, glucose: 0 },
  ];
  const reference = simulateLac(input, { ...match.reference, time: 6, count: 121, protocol });
  const alternative = simulateLac(input, { ...match.alternative, time: 6, count: 121, protocol });
  const ranked = rankLacMeasurements(reference, alternative, { assumedNoise: 0.01 });
  assert.equal(ranked.length, 32);
  assert.ok(ranked[0].separation > 0);
  assert.ok(ranked.every((item, index) => index === 0 || ranked[index - 1].separation >= item.separation));
  assert.ok(ranked.every((item) => item.time >= 2.5 && item.time <= 6));
  const noisier = rankLacMeasurements(reference, alternative, { assumedNoise: 0.02 });
  assert.ok(Math.abs(noisier[0].separation * 2 - ranked[0].separation) < 1e-9);
});

test('follow-up ranking rejects invalid noise and mismatched runs', () => {
  const run = simulateLac({ lactose: 0.8 }, { time: 6, count: 31 });
  assert.throws(() => rankLacMeasurements(run, run, { assumedNoise: 0 }), RangeError);
  assert.throws(() => rankLacMeasurements(run, { ...run, times: run.times.slice(1) }), RangeError);
});

test('history comparison stays discriminating across slider endpoints', () => {
  for (const lactose of [0, 0.55, 1.5, 2]) {
    const glucose = 0.5;
    const finalCondition = { lactose, glucose };
    const steady = simulateLac({ lactose }, {
      time: 6,
      protocol: [{ time: 0, ...finalCondition }],
    });
    const pulseLactose = lactose <= 1 ? 1.5 : 0.1;
    const pulse = simulateLac({ lactose }, {
      time: 6,
      protocol: [
        { time: 0, ...finalCondition },
        { time: 2, lactose: pulseLactose, glucose },
        { time: 5, ...finalCondition },
      ],
    });
    const differences = ['intracellularLactose', 'allolactose', 'enzyme', 'growth']
      .map((key) => Math.abs(steady[key].at(-1) - pulse[key].at(-1)));
    assert.ok(Math.max(...differences) > 1e-5, `lactose=${lactose} should retain a measurable modeled difference`);
  }
});

test('protocol rejects out-of-range conditions and duplicate event times', () => {
  assert.throws(() => simulateLac({ lactose: 0.5 }, {
    protocol: [{ time: 0, lactose: 0.5, glucose: 0 }, { time: 4, lactose: 2.1, glucose: 0 }],
  }), RangeError);
  assert.throws(() => simulateLac({ lactose: 0.5 }, {
    protocol: [{ time: 4, lactose: 0.5, glucose: 0 }, { time: 4, lactose: 1, glucose: 0 }],
  }), RangeError);
  assert.throws(() => simulateLac({ lactose: 0.5 }, {
    protocol: [{ time: 0, lactose: 0.5, glucose: 0 }, { time: '', lactose: 1, glucose: 0 }],
  }), RangeError);
});
