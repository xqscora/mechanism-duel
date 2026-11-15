import { doseResponse, simulateLac } from './cell-model.js';

const $ = (id) => document.getElementById(id);
const controls = {
  lactose: $('cell-lactose'),
  lacI: $('cell-laci'),
  glucose: $('cell-glucose'),
  growth: $('cell-growth'),
};
const timeCanvas = $('cell-time-chart');
const doseCanvas = $('cell-dose-chart');
let activeView = 'dose';
let currentRun = null;
let protocolSteps = [];
let nextProtocolId = 1;
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
    ctx.fillStyle = '#708078'; ctx.fillText(value.toFixed(1), pad.left - 8, py);
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
