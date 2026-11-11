import { rk45 } from '@tangent.to/ode';

export const EXPERIMENTS = [
  { id: 'early', title: 'Read product early', change: 'No intervention', sensor: 'Product P', time: 0.75, first: 1, second: 1, variable: 2, description: 'A short time-course readout, before both routes converge.' },
  { id: 'late', title: 'Read product late', change: 'No intervention', sensor: 'Product P', time: 5.25, first: 1, second: 1, variable: 2, description: 'A late product measurement after more of the pathway has run.' },
  { id: 'intermediate', title: 'Measure the hidden state', change: 'No intervention', sensor: 'Intermediate I', time: 1.4, first: 1, second: 1, variable: 1, description: 'Check whether an intermediate accumulates at all.' },
  { id: 'block-step', title: 'Slow the candidate second step', change: 'Reduce k₂ by 65%', sensor: 'Product P', time: 2.5, first: 1, second: 0.35, variable: 2, description: 'Apply an idealized perturbation to the proposed I → P conversion.' },
];

function integrate(model, rates, settings) {
  const { time, first = 1, second = 1, initial = 1 } = settings;
  const end = Math.max(time, 0.01);
  const sample = rk45(model(rates, first, second), [0, end], [initial, 0, 0], { tEval: [end] });
  return sample.y.map((series) => Math.max(0, series.at(-1) ?? 0));
}

function directModel({ directRate }, first) {
  return (_t, [substrate]) => {
    const flux = directRate * first * substrate;
    return [-flux, 0, flux];
  };
}

function stagedModel({ entryRate, exitRate }, first, second) {
  return (_t, [substrate, intermediate]) => {
    const entering = entryRate * first * substrate;
    const leaving = exitRate * second * intermediate;
    return [-entering, entering - leaving, leaving];
  };
}

export function predictPair(rates, settings) {
  return {
    direct: integrate(directModel, rates, settings),
    staged: integrate(stagedModel, rates, settings),
  };
}

export function calibrateExitRate(directRate, entryRate, anchorTime) {
  const target = 1 - Math.exp(-directRate * anchorTime);
  let low = 0.015;
  let high = Math.max(6, entryRate * 8);
  for (let index = 0; index < 42; index += 1) {
    const middle = (low + high) / 2;
    const state = integrate(stagedModel, { entryRate, exitRate: middle }, { time: anchorTime });
    if (state[2] < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function rankExperiments(rates, noise) {
  return EXPERIMENTS.map((experiment) => {
    const pair = predictPair(rates, experiment);
    const delta = Math.abs(pair.direct[experiment.variable] - pair.staged[experiment.variable]);
    const separation = delta / Math.sqrt(2 * noise ** 2);
    return { ...experiment, pair, delta, separation };
  }).sort((a, b) => b.separation - a.separation);
}

export function simulateTrajectories(rates, options = {}) {
  const end = options.time ?? 6;
  const count = options.count ?? 121;
  const tEval = Array.from({ length: count }, (_, index) => (end * index) / (count - 1));
  const initial = options.initial ?? 1;
  const direct = rk45(directModel(rates, options.first ?? 1), [0, end], [initial, 0, 0], { tEval });
  const staged = rk45(stagedModel(rates, options.first ?? 1, options.second ?? 1), [0, end], [initial, 0, 0], { tEval });
  return { times: direct.t, direct: direct.y, staged: staged.y };
}
