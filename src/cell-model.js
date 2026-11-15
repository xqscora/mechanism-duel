import { rk45 } from '@tangent.to/ode';

const BASE = {
  uptake: 1.15,
  importHalf: 0.65,
  metabolism: 0.72,
  lactoseHalf: 0.32,
  inducerFraction: 0.26,
  allolactoseUse: 0.28,
  allolactoseHalf: 0.22,
  leak: 0.11,
  basalGrowth: 0.025,
  basalExpression: 0.018,
  maxExpression: 0.92,
  inductionHalf: 0.18,
  time: 18,
};

function ratesFor([lactoseIn, allolactose, enzyme], input, options) {
  const { growthCoupling, lacI, glucose } = options;
  const external = input.lactose / 2;
  const importRate = BASE.uptake * enzyme * external
    / (BASE.importHalf + external * (1 + lactoseIn / 0.7))
    / (1 + glucose * 0.8);
  const lactoseUse = BASE.metabolism * enzyme * lactoseIn / (BASE.lactoseHalf + lactoseIn);
  const allolactoseUse = BASE.allolactoseUse * enzyme * allolactose / (BASE.allolactoseHalf + allolactose);
  const growth = BASE.basalGrowth + growthCoupling * Math.max(0, importRate - BASE.leak * (lactoseIn + allolactose));
  const hill = 2.4;
  const inductionThreshold = BASE.inductionHalf * lacI;
  const induced = allolactose ** hill / (inductionThreshold ** hill + allolactose ** hill + 1e-12);
  const transcription = (BASE.basalExpression + BASE.maxExpression * induced) / (1 + glucose * 0.9);

  return { growth, derivative: [
    importRate - lactoseUse - BASE.leak * lactoseIn - growth * lactoseIn,
    BASE.inducerFraction * lactoseUse - allolactoseUse - BASE.leak * allolactose - growth * allolactose,
    transcription - growth * enzyme,
  ] };
}

function derivatives(_time, state, input, options) {
  return ratesFor(state, input, options).derivative;
}

export function simulateLac(input, options = {}) {
  const settings = {
    growthCoupling: options.growthCoupling ?? 1,
    lacI: options.lacI ?? 1,
    glucose: options.glucose ?? 0,
  };
  const end = options.time ?? BASE.time;
  const count = options.count ?? 91;
  const tEval = Array.from({ length: count }, (_, index) => (end * index) / (count - 1));
  const protocol = options.protocol ?? [{ time: 0, lactose: input.lactose, glucose: settings.glucose }];
  if (protocol.some((event) => ['time', 'lactose', 'glucose'].some((key) => event[key] == null || String(event[key]).trim() === ''))) {
    throw new RangeError('Every protocol condition needs a time, lactose value, and glucose value.');
  }
  const events = protocol.map((event) => ({
    time: Number(event.time),
    lactose: Number(event.lactose),
    glucose: Number(event.glucose),
  })).sort((left, right) => left.time - right.time);
  if (!events.length || events[0].time > 0) {
    events.unshift({ time: 0, lactose: input.lactose, glucose: settings.glucose });
  }
  for (const event of events) {
    if (!Number.isFinite(event.time) || event.time < 0 || event.time > end) throw new RangeError('Protocol time must be within the simulation window.');
    if (!Number.isFinite(event.lactose) || event.lactose < 0 || event.lactose > 2) throw new RangeError('Lactose must be between 0 and 2 mM.');
    if (!Number.isFinite(event.glucose) || event.glucose < 0 || event.glucose > 2) throw new RangeError('Glucose context must be between 0 and 2.');
  }
  if (events.some((event, index) => index > 0 && event.time === events[index - 1].time)) {
    throw new RangeError('Protocol events need distinct times.');
  }

  let state = [0, 0, 0.035];
  let success = true;
  const times = [];
  const intracellularLactose = [];
  const allolactose = [];
  const enzyme = [];
  const growth = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.time === end && index < events.length - 1) continue;
    const stop = events[index + 1]?.time ?? end;
    if (stop === event.time) continue;
    const intervalTimes = [event.time, ...tEval.filter((time) => time > event.time && time < stop), stop];
    const result = rk45((time, current) => derivatives(time, current, { lactose: event.lactose }, { ...settings, glucose: event.glucose }), [event.time, stop], state, { tEval: intervalTimes });
    success &&= result.success;
    const isFinalInterval = index === events.length - 1 || stop === end;
    const sampleLimit = isFinalInterval ? result.t.length : result.t.length - 1;
    for (let sample = 0; sample < sampleLimit; sample += 1) {
      const current = result.y.map((series) => series[sample]);
      times.push(result.t[sample]);
      intracellularLactose.push(current[0]);
      allolactose.push(current[1]);
      enzyme.push(current[2]);
      growth.push(ratesFor(current, { lactose: event.lactose }, { ...settings, glucose: event.glucose }).growth);
    }
    state = result.y.map((series) => series.at(-1));
  }
  return {
    times,
    intracellularLactose,
    allolactose,
    enzyme,
    growth,
    success,
  };
}

export function doseResponse(options = {}) {
  const points = options.points ?? 31;
  return Array.from({ length: points }, (_, index) => {
    const lactose = (2 * index) / (points - 1);
    const curve = simulateLac({ lactose }, { ...options, count: 31 });
    return { lactose, enzyme: curve.enzyme.at(-1), allolactose: curve.allolactose.at(-1), growth: curve.growth.at(-1) };
  });
}

export function calibrateLacIForGrowthCoupling(input, options = {}) {
  const reference = {
    growthCoupling: options.referenceGrowthCoupling ?? 1,
    lacI: options.referenceLacI ?? 1,
    glucose: options.glucose ?? 0,
  };
  const alternativeGrowthCoupling = options.alternativeGrowthCoupling ?? 1.5;
  const time = options.time ?? 6;
  const minimumLacI = options.minimumLacI ?? 0.05;
  const maximumLacI = options.maximumLacI ?? 5;
  const target = simulateLac(input, { ...reference, time }).enzyme.at(-1);
  const enzymeAt = (lacI) => simulateLac(input, {
    growthCoupling: alternativeGrowthCoupling,
    lacI,
    glucose: reference.glucose,
    time,
  }).enzyme.at(-1);
  let low = minimumLacI;
  let high = maximumLacI;
  if (enzymeAt(low) < target || enzymeAt(high) > target) return null;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const middle = (low + high) / 2;
    if (enzymeAt(middle) > target) low = middle;
    else high = middle;
  }
  const lacI = (low + high) / 2;
  const alternativeEndpoint = enzymeAt(lacI);
  return {
    reference,
    alternative: { growthCoupling: alternativeGrowthCoupling, lacI, glucose: reference.glucose },
    target,
    alternativeEndpoint,
    absoluteError: Math.abs(target - alternativeEndpoint),
    time,
  };
}

export function rankLacMeasurements(reference, alternative, options = {}) {
  const noise = options.assumedNoise ?? 0.01;
  if (!Number.isFinite(noise) || noise <= 0) throw new RangeError('Assumed readout noise must be a positive finite value.');
  if (!reference?.times?.length || reference.times.length !== alternative?.times?.length) {
    throw new RangeError('Both runs need matching time samples.');
  }
  if (!reference.times.every((time, index) => Number.isFinite(time) && time === alternative.times[index]
    && (index === 0 || time > reference.times[index - 1]))) {
    throw new RangeError('Both runs need identical, increasing time samples.');
  }

  const readouts = [
    ['intracellularLactose', 'Intracellular lactose proxy'],
    ['allolactose', 'Allolactose proxy'],
    ['enzyme', 'Lac-enzyme proxy'],
    ['growth', 'Growth-rate proxy'],
  ];
  const times = options.times ?? [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
  const interpolate = (run, key, time) => {
    if (time < run.times[0] || time > run.times.at(-1)) throw new RangeError('Measurement time must be inside both runs.');
    const right = run.times.findIndex((sample) => sample >= time);
    if (right === 0 || run.times[right] === time) return run[key][right];
    const left = right - 1;
    const fraction = (time - run.times[left]) / (run.times[right] - run.times[left]);
    return run[key][left] + (run[key][right] - run[key][left]) * fraction;
  };

  return times.flatMap((time) => readouts.map(([key, label]) => {
    const referenceValue = interpolate(reference, key, time);
    const alternativeValue = interpolate(alternative, key, time);
    const difference = alternativeValue - referenceValue;
    return {
      key, label, time, referenceValue, alternativeValue, difference,
      separation: Math.abs(difference) / noise,
      assumedNoise: noise,
    };
  })).sort((left, right) => right.separation - left.separation || left.time - right.time || left.key.localeCompare(right.key));
}
