const waveCanvas = document.getElementById("waveCanvas");
const ctx = waveCanvas.getContext("2d");

const rpmNow = document.getElementById("rpmNow");
const rpmMax = document.getElementById("rpmMax");
const rpmMin = document.getElementById("rpmMin");

const speedNow = document.getElementById("speedNow");
const speedTop = document.getElementById("speedTop");
const speedMin = document.getElementById("speedMin");

const historyList = document.getElementById("historyList");

let measuring = false;

let currentRpm = 0;
let maxRpmVal = 0;
let minRpmVal = 0;
let currentSpeed = 0;
let maxSpeedVal = 0;
let minSpeedVal = 0;

let wavePhase = 0;

/* キャンバスサイズ調整 */
function resizeCanvas() {
  waveCanvas.width = waveCanvas.clientWidth;
  waveCanvas.height = waveCanvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* FFT風波形（あなたのUIに合わせて調整済み） */
function drawWave() {
  ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);

  ctx.beginPath();
  const w = waveCanvas.width;
  const h = waveCanvas.height;
  const amp = h * 0.35;
  const mid = h * 0.5;

  ctx.strokeStyle = "#ff4fa3";
  ctx.lineWidth = 2;

  for (let x = 0; x < w; x++) {
    const t = (x / w) * Math.PI * 6 + wavePhase;
    const y =
      mid +
      Math.sin(t) * amp * 0.55 +
      Math.sin(t * 0.35) * amp * 0.25 +
      Math.sin(t * 0.12) * amp * 0.15;

    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
  wavePhase += 0.06;

  requestAnimationFrame(drawWave);
}
requestAnimationFrame(drawWave);

/* RPM → SPEED 計算 */
function computeSpeedFromRpm(rpm) {
  const tire = parseFloat(document.getElementById("tireRange").value);
  const gearIndex = parseInt(document.getElementById("gearRange").value, 10);
  const gearRatio = parseFloat(gearOptions[gearIndex].split(":")[0]);

  const rpmCal = parseFloat(document.getElementById("rpmCalRange").value);
  const loadFactor = parseFloat(document.getElementById("loadFactorRange").value) / 100;

  const adjustedRpm = rpm * rpmCal;
  const wheelRpm = adjustedRpm / gearRatio;
  const wheelRps = wheelRpm / 60;
  const circumference = Math.PI * (tire / 1000);

  let speed = wheelRps * circumference * 3.6;
  speed *= 1 + loadFactor;

  return { adjustedRpm, speed };
}

/* リアルタイム更新 */
function updateRealtimeValues() {
  if (!measuring) {
    setTimeout(updateRealtimeValues, 300);
    return;
  }

  const voltage = parseFloat(document.getElementById("voltageRange").value);
  currentRpm = 10000 + (voltage - 2.2) * 4000;

  const { adjustedRpm, speed } = computeSpeedFromRpm(currentRpm);
  currentSpeed = speed;

  if (maxRpmVal === 0 || adjustedRpm > maxRpmVal) maxRpmVal = adjustedRpm;
  if (minRpmVal === 0 || adjustedRpm < minRpmVal) minRpmVal = adjustedRpm;

  if (maxSpeedVal === 0 || speed > maxSpeedVal) maxSpeedVal = speed;
  if (minSpeedVal === 0 || speed < minSpeedVal) minSpeedVal = speed;

  rpmNow.textContent = Math.round(adjustedRpm);
  rpmMax.textContent = Math.round(maxRpmVal);
  rpmMin.textContent = Math.round(minRpmVal);

  speedNow.textContent = speed.toFixed(2) + " km/h";
  speedTop.textContent = maxSpeedVal.toFixed(2) + " km/h";
  speedMin.textContent = minSpeedVal.toFixed(2) + " km/h";

  setTimeout(updateRealtimeValues, 300);
}
updateRealtimeValues();

/* 比較表（0.1V刻み） */
function generateComparisonTable() {
  const comparisonBody = document.getElementById("comparisonBody");
  comparisonBody.innerHTML = "";

  const tire = parseFloat(document.getElementById("tireRange").value);
  const currentVoltage = parseFloat(document.getElementById("voltageRange").value).toFixed(1);

  const baseRpmAt28 = 15000;

  for (let v = 2.2; v <= 3.4; v += 0.1) {
    const voltage = v.toFixed(1);
    const tr = document.createElement("tr");

    if (voltage === currentVoltage) tr.classList.add("highlight-row");

    const rpm = Math.round(baseRpmAt28 * (v / 2.8));

    const tdV = document.createElement("td");
    tdV.textContent = voltage + " V";
    tr.appendChild(tdV);

    const tdR = document.createElement("td");
    tdR.textContent = rpm;
    tr.appendChild(tdR);

    ["3.5:1", "3.7:1", "4.0:1"].forEach(g => {
      const gearRatio = parseFloat(g.split(":")[0]);
      const wheelRpm = rpm / gearRatio;
      const wheelRps = wheelRpm / 60;
      const circumference = Math.PI * (tire / 1000);
      const speed = wheelRps * circumference * 3.6;

      const td = document.createElement("td");
      td.textContent = speed.toFixed(2);

      const currentGear = gearOptions[parseInt(document.getElementById("gearRange").value)];
      if (g === currentGear) td.classList.add("highlight-col");

      tr.appendChild(td);
    });

    comparisonBody.appendChild(tr);
  }
}

/* リセット */
function resetMeasurement() {
  measuring = false;

  currentRpm = 0;
  maxRpmVal = 0;
  minRpmVal = 0;
  currentSpeed = 0;
  maxSpeedVal = 0;
  minSpeedVal = 0;

  rpmNow.textContent = "0";
  rpmMax.textContent = "0";
  rpmMin.textContent = "0";

  speedNow.textContent = "0.00 km/h";
  speedTop.textContent = "0.00 km/h";
  speedMin.textContent = "0.00 km/h";

  document.getElementById("startBtn").textContent = "計測開始";
}

/* 保存 */
function saveCurrentHistory() {
  const voltage = parseFloat(document.getElementById("voltageRange").value).toFixed(1);
  const gearIndex = parseInt(document.getElementById("gearRange").value, 10);
  const gearStr = gearOptions[gearIndex];
  const tire = parseFloat(document.getElementById("tireRange").value).toFixed(1);

  const entry = {
    date: new Date().toLocaleString(),
    voltage,
    gear: gearStr,
    tire,
    rpm: Math.round(currentRpm),
    speed: currentSpeed.toFixed(2),
  };

  const list = JSON.parse(localStorage.getItem("rpmHistory") || "[]");
  list.unshift(entry);
  localStorage.setItem("rpmHistory", JSON.stringify(list));

  renderHistory();
  buildFilterOptions();
}

/* 履歴フィルター */
function buildFilterOptions() {
  const list = JSON.parse(localStorage.getItem("rpmHistory") || "[]");

  const voltages = new Set();
  const gears = new Set();
  const tires = new Set();

  list.forEach(item => {
    voltages.add(item.voltage);
    gears.add(item.gear);
    tires.add(item.tire);
  });

  fillSelect(filterVoltage, voltages, "電圧指定なし");
  fillSelect(filterGear, gears, "ギヤ比指定なし");
  fillSelect(filterTire, tires, "タイヤ径指定なし");
}

function fillSelect(select, values, label) {
  const current = select.value;
  select.innerHTML = `<option value="">${label}</option>`;
  [...values].forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
  select.value = current;
}

function applyHistoryFilter(list) {
  return list.filter(item => {
    if (filterVoltage.value && item.voltage !== filterVoltage.value) return false;
    if (filterGear.value && item.gear !== filterGear.value) return false;
    if (filterTire.value && item.tire !== filterTire.value) return false;
    return true;
  });
}

/* 履歴表示 */
function renderHistory() {
  const list = JSON.parse(localStorage.getItem("rpmHistory") || "[]");
  const filtered = applyHistoryFilter(list);

  historyList.innerHTML = "";

  filtered.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <span>${item.date}</span>
      <span>${item.voltage}</span>
      <span>${item.gear}</span>
      <span>${item.tire}</span>
      <span>${item.rpm}</span>
      <span>${item.speed}</span>
    `;
    historyList.appendChild(row);
  });
}

generateComparisonTable();
renderHistory();
buildFilterOptions();
