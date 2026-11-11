import { EXPERIMENTS, calibrateExitRate, predictPair, rankExperiments, simulateTrajectories } from './model.js';

const $ = (id) => document.getElementById(id);
const inputs = {
  directRate: $('direct-rate'),
  entryRate: $('entry-rate'),
  noise: $('noise'),
  anchorTime: $('anchor-time'),
};
const chart = $('trajectory-chart');
const context = chart.getContext('2d');
let state = { rates: {}, ranked: [], selectedId: 'early' };
let resizeObserver;

const format = (value, digits = 3) => Number(value).toFixed(digits);

function readControls() {
  const directRate = Number(inputs.directRate.value);
  const entryRate = Number(inputs.entryRate.value);
  const anchorTime = Number(inputs.anchorTime.value);
  const exitRate = calibrateExitRate(directRate, entryRate, anchorTime);
  state.rates = { directRate, entryRate, exitRate, anchorTime };
  state.ranked = rankExperiments(state.rates, Number(inputs.noise.value));
  return state;
}

function canvasSize() {
  const bounds = chart.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(bounds.width * pixelRatio));
  const height = Math.max(1, Math.floor(bounds.height * pixelRatio));
  if (chart.width !== width || chart.height !== height) {
    chart.width = width;
    chart.height = height;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return { width: bounds.width, height: bounds.height };
}

function drawChart() {
  const { width, height } = canvasSize();
  const selected = EXPERIMENTS.find((item) => item.id === state.selectedId) ?? EXPERIMENTS[0];
  const index = selected.variable;
  const paths = simulateTrajectories(state.rates, selected.id === 'block-step'
    ? { time: 6, count: 121, second: selected.second }
    : { time: 6, count: 121 });
  const maxValue = Math.max(0.12, ...paths.direct[index], ...paths.staged[index]) * 1.16;
  const padding = { left: 42, right: 15, top: 14, bottom: 30 };
  const plotWidth = Math.max(30, width - padding.left - padding.right);
  const plotHeight = Math.max(30, height - padding.top - padding.bottom);
  const x = (time) => padding.left + (time / 6) * plotWidth;
  const y = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  context.font = '9px DM Mono, monospace';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  for (let tick = 0; tick <= 4; tick += 1) {
    const value = (maxValue * tick) / 4;
    const py = y(value);
    context.strokeStyle = '#edf1ef';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(padding.left, py);
    context.lineTo(width - padding.right, py);
    context.stroke();
    context.fillStyle = '#8b9693';
    context.fillText(value.toFixed(2), padding.left - 8, py);
  }
  context.textAlign = 'center';
  context.textBaseline = 'top';
  for (let tick = 0; tick <= 6; tick += 1) {
    const px = x(tick);
    context.strokeStyle = '#f0f3f1';
    context.beginPath();
    context.moveTo(px, padding.top);
    context.lineTo(px, padding.top + plotHeight);
    context.stroke();
    context.fillStyle = '#8b9693';
    context.fillText(String(tick), px, height - 19);
  }

  const anchorX = x(state.rates.anchorTime);
  context.save();
  context.setLineDash([3, 4]);
  context.strokeStyle = '#b5a06a';
  context.beginPath();
  context.moveTo(anchorX, padding.top);
  context.lineTo(anchorX, padding.top + plotHeight);
  context.stroke();
  context.restore();

  const selectedX = x(selected.time);
  context.save();
  context.setLineDash([2, 3]);
  context.strokeStyle = '#b1bbb7';
  context.beginPath();
  context.moveTo(selectedX, padding.top);
  context.lineTo(selectedX, padding.top + plotHeight);
  context.stroke();
  context.restore();

  const renderLine = (series, color) => {
    context.beginPath();
    series.forEach((value, indexAt) => {
      const px = x(paths.times[indexAt]);
      const py = y(value);
      if (indexAt === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    });
    context.strokeStyle = color;
    context.lineWidth = 2.2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.stroke();
  };
  renderLine(paths.direct[index], '#1c8b70');
  renderLine(paths.staged[index], '#cf674e');

  const prediction = state.ranked.find((item) => item.id === selected.id);
  if (prediction) {
    [[prediction.pair.direct[index], '#1c8b70'], [prediction.pair.staged[index], '#cf674e']].forEach(([value, color]) => {
      context.beginPath();
      context.arc(selectedX, y(value), 4.2, 0, Math.PI * 2);
      context.fillStyle = '#fff';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = color;
      context.stroke();
    });
  }
}

function updateReadouts() {
  $('direct-rate-value').value = format(state.rates.directRate, 2);
  $('entry-rate-value').value = format(state.rates.entryRate, 2);
  $('noise-value').value = format(Number(inputs.noise.value), 2);
  $('anchor-value').value = format(state.rates.anchorTime, 1);
  $('exit-rate-label').textContent = `k₂ ${format(state.rates.exitRate, 2)}`;

  const baseline = predictPair(state.rates, { time: state.rates.anchorTime });
  const baselineDelta = Math.abs(baseline.direct[2] - baseline.staged[2]);
  $('baseline-a').textContent = format(baseline.direct[2]);
  $('baseline-b').textContent = format(baseline.staged[2]);
  $('match-value').textContent = `Δ ${format(baselineDelta)}`;
  $('match-copy').textContent = `Both predict the same product amount at t = ${format(state.rates.anchorTime, 1)}.`;
  $('match-title').textContent = baselineDelta < 0.002 ? 'Same at the reference point' : 'Reference-point mismatch';
  $('match-title').style.color = baselineDelta < 0.002 ? '#146c58' : '#a54e3e';
}

function renderExperiments() {
  const rows = $('experiment-rows');
  rows.innerHTML = '';
  const maxSeparation = Math.max(0.01, state.ranked[0]?.separation ?? 0);
  state.ranked.forEach((experiment, index) => {
    const isBest = index === 0;
    const active = experiment.id === state.selectedId;
    const row = document.createElement('tr');
    if (isBest) row.classList.add('is-best');
    const aValue = experiment.pair.direct[experiment.variable];
    const bValue = experiment.pair.staged[experiment.variable];
    row.innerHTML = `<td class="test-name"><span class="test-number">${String(index + 1).padStart(2, '0')}</span>${experiment.title}</td>
      <td>${experiment.change}</td><td>${experiment.sensor} · t ${format(experiment.time, 2)}</td>
      <td class="model-value">${format(aValue)}</td><td class="model-value">${format(bValue)}</td>
      <td class="score-cell"><div class="score-wrap"><span class="score-bar"><i style="width:${Math.min(100, (experiment.separation / maxSeparation) * 100)}%"></i></span><span class="score-number">${format(experiment.separation, 1)}σ</span></div></td>
      <td><button class="select-test" type="button" data-experiment="${experiment.id}">${active ? 'Viewing' : 'Preview'}</button></td>`;
    rows.append(row);
  });
  $('experiment-count').textContent = `${state.ranked.length} candidate tests`;
  rows.querySelectorAll('[data-experiment]').forEach((button) => button.addEventListener('click', () => {
    state.selectedId = button.dataset.experiment;
    render();
  }));
}

function updateBestTest() {
  const best = state.ranked[0];
  if (!best) return;
  $('best-title').textContent = best.title;
  $('best-description').textContent = best.description;
  $('separation-value').textContent = `${format(best.separation, 1)}σ`;
  $('meter-fill').style.width = `${Math.min(100, (best.separation / 8) * 100)}%`;
  $('apply-best').dataset.experiment = best.id;
  $('chart-assay').textContent = `Preview: ${EXPERIMENTS.find((item) => item.id === state.selectedId)?.sensor ?? 'Product P'}`;
}

function render() {
  readControls();
  updateReadouts();
  updateBestTest();
  renderExperiments();
  drawChart();
}

let toastTimer;
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2100);
}

Object.values(inputs).forEach((input) => input.addEventListener('input', render));
$('apply-best').addEventListener('click', () => {
  state.selectedId = $('apply-best').dataset.experiment;
  render();
  showToast('Test preview updated. No external experiment was run.');
});
$('reset').addEventListener('click', () => {
  inputs.directRate.value = '0.90';
  inputs.entryRate.value = '1.20';
  inputs.noise.value = '0.06';
  inputs.anchorTime.value = '2.5';
  state.selectedId = 'early';
  render();
  showToast('Model controls reset.');
});

resizeObserver = new ResizeObserver(drawChart);
resizeObserver.observe(chart.parentElement);
render();
