import assert from 'node:assert/strict';
import test from 'node:test';
import { calibrateExitRate, predictPair, rankExperiments, simulateTrajectories } from '../src/model.js';

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
