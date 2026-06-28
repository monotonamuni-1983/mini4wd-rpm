const waveCanvas = document.getElementById("waveCanvas");
const ctx = waveCanvas.getContext("2d");

const rpmNow = document.getElementById("rpmNow");
const rpmMax = document.getElementById("rpmMax");
const rpmMin = document.getElementById("rpmMin");

const speedNow = document.getElementById("speedNow");
const speedTop = document.getElementById("speedTop");
const speedMin = document.getElementById("speedMin");

const historyList = document.getElementById("historyList");

let currentRpm = 0;
let maxRpmVal = 0;
let minRpmVal = 0;
let currentSpeed = 0;
let maxSpeedVal = 0;
let minSpeedVal = 0;

let wavePhase = 0;
let measuring = true;

function resizeCanvas() {
  waveCanvas.width = waveCanvas.clientWidth;
  waveCanvas.height = waveCanvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

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
    const t = (x / w) * Math.PI * 4 + wavePhase;
    const y = mid + Math.sin(t) * amp * 0.6 + Math.sin(t * 0.5) * amp * 0.2;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  wavePhase += 0.08;
  requestAnimationFrame(drawWave);
}
requestAnimationFrame(drawWave);

function computeSpeedFromRpm(rpm) {
  const tire = parseFloat(document.getElementById("tireRange").value); // mm
  const gearIndex = parseInt(document.getElementById("gearRange").value, 10);
  const gearRatioStr = gearOptions[gearIndex] || "3.5:1";
  const gearRatio = parseFloat(gearRatioStr.split(":")[0]); // 3.5 etc

  const rpmCal = parseFloat(document.getElementById("rpmCalRange").value);
  const loadFactor = parseFloat(document.getElementById("loadFactorRange").value) / 100;

  const adjustedRpm = rpm * rpmCal;
  const wheelRpm = adjustedRpm / gearRatio;
  const wheelRps = wheelRpm / 60;
  const circumference = Math.PI * (tire / 1000); // m
  let speed = wheelRps * circumference * 3.6; // km/h

  speed = speed * (1 + loadFactor);
  return { adjustedRpm, speed };
}

function updateRealtimeValues() {
  if (!measuring) return;

  const voltage = parseFloat(document.getElementById("voltageRange").value);
  // 単純なモデル：電圧に比例してRPMを変化させる
  currentRpm = 10000 + (voltage - 2.2) * 4000; // 2.2〜3.4V → 約11786〜18214に近い値

  const { adjustedRpm, speed } = computeSpeedFromRpm(currentRpm);
  currentSpeed = speed;

  if (maxRpmVal === 0 || adjustedRpm > maxRpmVal) maxRpmVal = adjustedRpm;
  if (minRpmVal === 0 || adjustedRpm < minRpmVal) minRpmVal = adjustedRpm;

  if (maxSpeedVal === 0 || speed > maxSpeedVal) maxSpeedVal = speed;
  if (minSpeedVal === 0 || speed < minSpeedVal) minSpeedVal = speed;

  rpmNow.textContent = Math.round(adjustedRpm);
  rpmMax.textContent = Math.round(maxRpmVal);
  rpmMin.textContent = Math.round(minRpmVal);

  speedNow.textContent = currentSpeed.toFixed(2) + " km/h";
  speedTop.textContent = maxSpeedVal.toFixed(2) + " km/h";
  speedMin.textContent = minSpeedVal.toFixed(2) + " km/h";

  setTimeout(updateRealtimeValues, 300);
}
updateRealtimeValues();

function generateComparisonTable() {
  const comparisonBody = document.getElementById("comparisonBody");
  if (!comparisonBody) return;

  comparisonBody.innerHTML = "";

  const currentVoltage = parseFloat(document.getElementById("voltageRange").value).toFixed(1);
  const tire = parseFloat(document.getElementById("tireRange").value);

  const localGearOptions = ["3.5:1", "3.7:1", "4.0:1"];
  const baseRpmAt28 = 15000; // 2.8Vで15000RPMを基準

  for (let v = 2.2; v <= 3.4; v += 0.2) {
    const voltage = v.toFixed(1);
    const tr = document.createElement("tr");

    if (voltage === currentVoltage) {
      tr.classList.add("highlight-row");
    }

    const rpm = Math.round(baseRpmAt28 * (v / 2.8));
    const tdVoltage = document.createElement("td");
    tdVoltage.textContent = voltage + " V";
    tr.appendChild(tdVoltage);

    const tdRpm = document.createElement("td");
    tdRpm.textContent = rpm;
    tr.appendChild(tdRpm);

    localGearOptions.forEach((g, idx) => {
      const gearRatio = parseFloat(g.split(":")[0]);
      const wheelRpm = rpm / gearRatio;
      const wheelRps = wheelRpm / 60;
      const circumference = Math.PI * (tire / 1000);
      const speed = wheelRps * circumference * 3.6;

      const td = document.createElement("td");
      td.textContent = speed.toFixed(2);

      const currentGearIndex = parseInt(document.getElementById("gearRange").value, 10);
      const currentGearStr = gearOptions[currentGearIndex] || "3.5:1";
      if (g === currentGearStr) {
        td.classList.add("highlight-col");
      }

      tr.appendChild(td);
    });

    comparisonBody.appendChild(tr);
  }
}

function resetMeasurement() {
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
}

function saveCurrentHistory() {
  const voltage = parseFloat(document.getElementById("voltageRange").value).toFixed(1);
  const gearIndex = parseInt(document.getElementById("gearRange").value, 10);
  const gearStr = gearOptions[gearIndex] || "3.5:1";
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
}

function renderHistory() {
  const list = JSON.parse(localStorage.getItem("rpmHistory") || "[]");
  historyList.innerHTML = "";

  list.forEach(item => {
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
