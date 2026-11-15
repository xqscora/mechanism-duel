import { calibrateLacIForGrowthCoupling, doseResponse, rankLacMeasurements, simulateLac } from './cell-model.js';

const $ = (id) => document.getElementById(id);
const controls = {
  lactose: $('cell-lactose'),
  lacI: $('cell-laci'),
  glucose: $('cell-glucose'),
  growth: $('cell-growth'),
};
const timeCanvas = $('cell-time-chart');
const doseCanvas = $('cell-dose-chart');
const historyCanvas = $('history-chart');
const hypothesisCanvas = $('hypothesis-chart');
let activeView = 'dose';
let currentRun = null;
let protocolSteps = [];
let nextProtocolId = 1;
let hypothesisRuns = null;
const fmt = (value, digits = 2) => Number(value).toFixed(digits);

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function axes(ctx, width, height, maxY, xMax, xLabel) {
  const pad = { left: 44, right: 14, top: 18, bottom: 35 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const x = (value) => pad.left + (value / xMax) * plotW;
  const y = (value) => pad.top + plotH - (value / maxY) * plotH;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  for (let tick = 0; tick <= 4; tick += 1) {
    const value = (maxY * tick) / 4;
    const py = y(value);
    ctx.strokeStyle = '#e9efeb';
    ctx.beginPath(); ctx.moveTo(pad.left, py); ctx.lineTo(width - pad.right, py); ctx.stroke();
    ctx.fillStyle = '#708078'; ctx.fillText(value.toFixed(maxY < 0.2 ? 2 : 1), pad.left - 8, py);
  }
  ctx.textAlign = 'center';
  for (let tick = 0; tick <= 4; tick += 1) {
    const value = (xMax * tick) / 4;
    const px = x(value);
    ctx.strokeStyle = '#f1f4f2';
    ctx.beginPath(); ctx.moveTo(px, pad.top); ctx.lineTo(px, pad.top + plotH); ctx.stroke();
    ctx.fillStyle = '#708078'; ctx.fillText(`${fmt(value, 1)}${xLabel}`, px, height - 16);
  }
  return { x, y, pad, plotH };
}

function drawDoseCurve() {
  const { ctx, width, height } = prepareCanvas(doseCanvas);
  const options = {
    growthCoupling: Number(controls.growth.value),
    lacI: Number(controls.lacI.value),
    glucose: Number(controls.glucose.value),
  };
  const curve = doseResponse(options);
  const top = Math.max(0.1, ...curve.map((point) => point.enzyme)) * 1.12;
  const { x, y } = axes(ctx, width, height, top, 2, ' mM');
  const current = Number(controls.lactose.value);
  const baseCurve = options.growthCoupling === 0 ? curve : doseResponse({ ...options, growthCoupling: 0 });

  const line = (points, color, dashed = false) => {
    ctx.beginPath();
    points.forEach((point, index) => {
      const px = x(point.lactose);
      const py = y(point.enzyme);
      if (index === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.setLineDash(dashed ? [6, 4] : []); ctx.stroke(); ctx.setLineDash([]);
  };
  line(baseCurve, '#aab5b0', true);
  line(curve, '#167d69');
  const selected = simulateLac({ lactose: current }, options).enzyme.at(-1);
  ctx.beginPath(); ctx.arc(x(current), y(selected), 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#167d69'; ctx.stroke();
  const comparison = baseCurve.reduce((best, point) => Math.abs(point.lactose - current) < Math.abs(best.lactose - current) ? point : best);
  $('cell-dose-readout').textContent = `At ${fmt(current, 2)} mM: expression proxy ${fmt(selected, 3)}; growth-coupled component off ${fmt(comparison.enzyme, 3)}.`;
}

function drawTimeCourse() {
  const { ctx, width, height } = prepareCanvas(timeCanvas);
  const curve = currentRun;
  const maxY = Math.max(0.1, ...curve.enzyme, ...curve.allolactose, ...curve.intracellularLactose, ...curve.growth) * 1.12;
  const { x, y } = axes(ctx, width, height, maxY, curve.times.at(-1), ' h');
  const series = [
    [curve.enzyme, '#167d69'],
    [curve.allolactose, '#c96f3e'],
    [curve.intracellularLactose, '#6078b8'],
    [curve.growth, '#a77b24'],
  ];
  for (const [values, color] of series) {
    ctx.beginPath();
    values.forEach((value, index) => index === 0 ? ctx.moveTo(x(curve.times[index]), y(value)) : ctx.lineTo(x(curve.times[index]), y(value)));
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.stroke();
  }
}

function renderReadout(run) {
  $('cell-lactose-state').textContent = fmt(run.intracellularLactose.at(-1), 3);
  $('cell-allolactose-state').textContent = fmt(run.allolactose.at(-1), 3);
  $('cell-enzyme-state').textContent = fmt(run.enzyme.at(-1), 3);
  $('cell-lactose-state-copy').textContent = fmt(run.intracellularLactose.at(-1), 3);
  $('cell-allolactose-state-copy').textContent = fmt(run.allolactose.at(-1), 3);
  $('cell-enzyme-state-copy').textContent = fmt(run.enzyme.at(-1), 3);
  $('cell-growth-state-copy').textContent = fmt(run.growth.at(-1), 3);
  if (activeView === 'time') drawTimeCourse();
}

function renderProtocolSteps() {
  const list = $('protocol-steps');
  list.replaceChildren();
  if (!protocolSteps.length) {
    const empty = document.createElement('p');
    empty.className = 'protocol-empty';
    empty.textContent = 'No scheduled changes. The starting condition stays constant for 18 h.';
    list.append(empty);
    return;
  }
  for (const step of protocolSteps) {
    const row = document.createElement('div');
    row.className = 'protocol-step';
    const fields = [
      ['time', 'Time (h)', '0.5', '18', '0.5'],
      ['lactose', 'External lactose (mM)', '0', '2', '0.05'],
      ['glucose', 'Glucose context', '0', '2', '0.1'],
    ];
    for (const [key, label, min, max, stepSize] of fields) {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = min;
      input.max = max;
      input.step = stepSize;
      input.value = String(step[key]);
      input.setAttribute('aria-label', label);
      input.addEventListener('input', () => { step[key] = Number(input.value); });
      row.append(input);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-step';
    remove.setAttribute('aria-label', 'Remove scheduled condition');
    remove.title = 'Remove condition';
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      protocolSteps = protocolSteps.filter((item) => item.id !== step.id);
      renderProtocolSteps();
    });
    row.append(remove);
    list.append(row);
  }
}

function render() {
  $('cell-lactose-value').textContent = `${fmt(controls.lactose.value, 2)} mM`;
  $('cell-laci-value').textContent = `${fmt(controls.lacI.value, 1)}×`;
  $('cell-glucose-value').textContent = `${fmt(controls.glucose.value, 1)}×`;
  $('cell-growth-value').textContent = `${fmt(controls.growth.value, 1)}×`;
  currentRun = simulateLac({ lactose: Number(controls.lactose.value) }, {
    lacI: Number(controls.lacI.value), glucose: Number(controls.glucose.value), growthCoupling: Number(controls.growth.value),
  });
  $('protocol-status').textContent = `Starting condition: ${fmt(controls.lactose.value, 2)} mM lactose · glucose ${fmt(controls.glucose.value, 1)}×. Run the protocol to apply scheduled conditions.`;
  renderReadout(currentRun);
  drawDoseCurve();
}

Object.values(controls).forEach((control) => control.addEventListener('input', render));
$('add-protocol-step').addEventListener('click', () => {
  const lastTime = protocolSteps.at(-1)?.time ?? 0;
  const time = Math.min(18, lastTime + (lastTime === 0 ? 4 : 2));
  if (time <= lastTime) {
    $('protocol-status').textContent = 'The protocol already reaches the 18 h endpoint.';
    return;
  }
  protocolSteps.push({
    id: nextProtocolId++, time,
    lactose: Number(controls.lactose.value), glucose: Number(controls.glucose.value),
  });
  renderProtocolSteps();
  $('protocol-status').textContent = 'Condition added. Set its time and medium, then run the protocol.';
});
$('run-protocol').addEventListener('click', () => {
  try {
    const protocol = [
      { time: 0, lactose: Number(controls.lactose.value), glucose: Number(controls.glucose.value) },
      ...protocolSteps.map(({ time, lactose, glucose }) => ({ time, lactose, glucose })),
    ];
    currentRun = simulateLac({ lactose: Number(controls.lactose.value) }, {
      lacI: Number(controls.lacI.value), growthCoupling: Number(controls.growth.value), protocol,
    });
    renderReadout(currentRun);
    if (activeView === 'dose') {
      activeView = 'time';
      document.querySelectorAll('[data-cell-view]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.cellView === 'time')));
      $('cell-dose-view').hidden = true;
      $('cell-time-view').hidden = false;
      drawTimeCourse();
    }
    $('protocol-status').textContent = `Simulation complete: ${protocolSteps.length} scheduled condition${protocolSteps.length === 1 ? '' : 's'} applied across ${fmt(currentRun.times.at(-1), 1)} h.`;
  } catch (error) {
    $('protocol-status').textContent = error instanceof Error ? error.message : 'The protocol could not be simulated.';
  }
});
$('run-history-challenge').addEventListener('click', () => {
  const finalLactose = Number(controls.lactose.value);
  const finalGlucose = Number(controls.glucose.value);
  const settings = {
    lacI: Number(controls.lacI.value),
    growthCoupling: Number(controls.growth.value),
    time: 6,
  };
  const steady = simulateLac({ lactose: finalLactose }, {
    ...settings,
    protocol: [{ time: 0, lactose: finalLactose, glucose: finalGlucose }],
  });
  const pulseLactose = finalLactose <= 1 ? 1.5 : 0.1;
  const pulse = simulateLac({ lactose: finalLactose }, {
    ...settings,
    protocol: [
      { time: 0, lactose: finalLactose, glucose: finalGlucose },
      { time: 2, lactose: pulseLactose, glucose: finalGlucose },
      { time: 5, lactose: finalLactose, glucose: finalGlucose },
    ],
  });
  const rows = [
    ['Intracellular lactose', steady.intracellularLactose.at(-1), pulse.intracellularLactose.at(-1)],
    ['Allolactose', steady.allolactose.at(-1), pulse.allolactose.at(-1)],
    ['Lac-enzyme proxy', steady.enzyme.at(-1), pulse.enzyme.at(-1)],
    ['Growth-rate proxy', steady.growth.at(-1), pulse.growth.at(-1)],
  ];
  $('history-metrics').replaceChildren(...rows.map(([label, steadyValue, pulseValue]) => {
    const row = document.createElement('tr');
    const delta = pulseValue - steadyValue;
    for (const value of [label, fmt(steadyValue, 3), fmt(pulseValue, 3), `${delta >= 0 ? '+' : ''}${fmt(delta, 3)}`]) {
      const cell = document.createElement(value === label ? 'th' : 'td');
      if (value === label) cell.scope = 'row';
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  }));
  $('history-summary').textContent = `At 6 h, both runs have spent the last hour at ${fmt(finalLactose, 2)} mM lactose and glucose context ${fmt(finalGlucose, 1)}×. The pulse briefly used ${fmt(pulseLactose, 2)} mM lactose; compare their modeled internal states.`;
  $('history-results').hidden = false;

  const { ctx, width, height } = prepareCanvas(historyCanvas);
  const maxY = Math.max(0.1, ...steady.enzyme, ...pulse.enzyme) * 1.12;
  const { x, y } = axes(ctx, width, height, maxY, 6, ' h');
  const draw = (values, color, dashed = false) => {
    ctx.beginPath();
    values.forEach((value, index) => index === 0
      ? ctx.moveTo(x(steady.times[index]), y(value))
      : ctx.lineTo(x(steady.times[index]), y(value)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.7;
    ctx.setLineDash(dashed ? [7, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  draw(steady.enzyme, '#167d69', true);
  draw(pulse.enzyme, '#c96f3e');
  $('history-chart').setAttribute('aria-label', `Modeled enzyme proxy: steady ${fmt(steady.enzyme.at(-1), 3)}, pulse ${fmt(pulse.enzyme.at(-1), 3)} at 6 hours`);
});

function drawHypothesisComparison() {
  if (!hypothesisRuns) return;
  const { reference, alternative } = hypothesisRuns;
  const variable = $('hypothesis-readout').value;
  const labels = {
    intracellularLactose: 'Intracellular lactose proxy',
    allolactose: 'Allolactose proxy',
    enzyme: 'Lac-enzyme proxy',
    growth: 'Growth-rate proxy',
  };
  const { ctx, width, height } = prepareCanvas(hypothesisCanvas);
  const values = [...reference[variable], ...alternative[variable]];
  const maxY = Math.max(0.1, ...values) * 1.12;
  const { x, y } = axes(ctx, width, height, maxY, 6, ' h');
  for (const [run, color, dashed] of [[reference, '#167d69', true], [alternative, '#c96f3e', false]]) {
    ctx.beginPath();
    run[variable].forEach((value, index) => index === 0
      ? ctx.moveTo(x(run.times[index]), y(value))
      : ctx.lineTo(x(run.times[index]), y(value)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.7;
    ctx.setLineDash(dashed ? [7, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  hypothesisCanvas.setAttribute('aria-label', `${labels[variable]} for two parameterisations under the same pulse protocol`);
}

function renderFollowupRanking() {
  if (!hypothesisRuns) return;
  const noise = Number($('hypothesis-noise').value);
  $('hypothesis-noise-value').textContent = fmt(noise, 3);
  const ranked = rankLacMeasurements(hypothesisRuns.reference, hypothesisRuns.alternative, { assumedNoise: noise });
  const top = ranked[0];
  $('followup-status').textContent = `Top model discriminator: ${top.label} at ${fmt(top.time, 1)} h; predicted difference ${fmt(top.difference, 4)} (${fmt(top.separation, 1)} assumed noise units).`;
  $('followup-metrics').replaceChildren(...ranked.slice(0, 5).map((item, index) => {
    const row = document.createElement('tr');
    const values = [String(index + 1), item.label, `${fmt(item.time, 1)} h`, fmt(item.referenceValue, 4), fmt(item.alternativeValue, 4), `${item.difference >= 0 ? '+' : ''}${fmt(item.difference, 4)}`, fmt(item.separation, 1)];
    values.forEach((value, cellIndex) => {
      const cell = document.createElement(index === 0 && cellIndex === 1 ? 'th' : 'td');
      if (cell.tagName === 'TH') cell.scope = 'row';
      cell.textContent = value;
      row.append(cell);
    });
    return row;
  }));
}

$('run-hypothesis-challenge').addEventListener('click', () => {
  const lactose = Number(controls.lactose.value);
  const glucose = Number(controls.glucose.value);
  const growthCoupling = Number(controls.growth.value);
  const alternativeGrowthCoupling = growthCoupling <= 1.3 ? growthCoupling + 0.5 : growthCoupling - 0.5;
  const match = calibrateLacIForGrowthCoupling({ lactose }, {
    referenceGrowthCoupling: growthCoupling,
    referenceLacI: Number(controls.lacI.value),
    alternativeGrowthCoupling,
    glucose,
    time: 6,
  });
  if (!match) {
    hypothesisRuns = null;
    $('hypothesis-results').hidden = true;
    $('hypothesis-status').textContent = 'These settings did not produce a matching alternative within the calibration range. Try a different starting condition.';
    return;
  }

  const pulseLactose = lactose <= 1 ? 1.8 : 0.1;
  const protocol = [
    { time: 0, lactose, glucose },
    { time: 2, lactose: pulseLactose, glucose },
    { time: 5, lactose, glucose },
  ];
  const reference = simulateLac({ lactose }, { ...match.reference, time: 6, protocol });
  const alternative = simulateLac({ lactose }, { ...match.alternative, time: 6, protocol });
  hypothesisRuns = { reference, alternative };

  const rows = [
    ['Enzyme proxy · calibration, 6 h', match.target, match.alternativeEndpoint],
    ['Intracellular lactose · after pulse', reference.intracellularLactose.at(-1), alternative.intracellularLactose.at(-1)],
    ['Allolactose · after pulse', reference.allolactose.at(-1), alternative.allolactose.at(-1)],
    ['Enzyme proxy · after pulse', reference.enzyme.at(-1), alternative.enzyme.at(-1)],
    ['Growth-rate proxy · after pulse', reference.growth.at(-1), alternative.growth.at(-1)],
  ];
  $('hypothesis-metrics').replaceChildren(...rows.map(([label, referenceValue, alternativeValue]) => {
    const row = document.createElement('tr');
    const difference = alternativeValue - referenceValue;
    for (const value of [label, fmt(referenceValue, 5), fmt(alternativeValue, 5), `${difference >= 0 ? '+' : ''}${fmt(difference, 5)}`]) {
      const cell = document.createElement(value === label ? 'th' : 'td');
      if (value === label) cell.scope = 'row';
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  }));
  $('hypothesis-status').textContent = `Matched the 6 h enzyme proxy within ${fmt(match.absoluteError, 7)}. The same ${fmt(pulseLactose, 2)} mM pulse was applied from 2–5 h, then both returned to ${fmt(lactose, 2)} mM lactose.`;
  $('hypothesis-parameters').textContent = `Reference: growth coupling ${fmt(match.reference.growthCoupling, 2)}×, LacI ${fmt(match.reference.lacI, 3)}×. Alternative: growth coupling ${fmt(match.alternative.growthCoupling, 2)}×, calibrated LacI ${fmt(match.alternative.lacI, 3)}×.`;
  $('hypothesis-results').hidden = false;
  drawHypothesisComparison();
  renderFollowupRanking();
});
$('hypothesis-readout').addEventListener('change', drawHypothesisComparison);
$('hypothesis-noise').addEventListener('input', renderFollowupRanking);
document.querySelectorAll('[data-cell-view]').forEach((button) => button.addEventListener('click', () => {
  activeView = button.dataset.cellView;
  document.querySelectorAll('[data-cell-view]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  $('cell-dose-view').hidden = activeView !== 'dose';
  $('cell-time-view').hidden = activeView !== 'time';
  render();
}));
window.addEventListener('resize', render);
renderProtocolSteps();
render();
