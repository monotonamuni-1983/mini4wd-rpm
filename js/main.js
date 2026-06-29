/* === グローバル変数（ここに配置） === */
let audioCtx;
let analyser;
let dataArray;
let measuring = false; // ここで1回だけ宣言します

// DOM要素の取得
const waveCanvas = document.getElementById("waveCanvas");
const ctx = waveCanvas.getContext("2d");
const rpmNow = document.getElementById("rpmNow");
const rpmMax = document.getElementById("rpmMax");
const rpmMin = document.getElementById("rpmMin");
const speedNow = document.getElementById("speedNow");
const speedTop = document.getElementById("speedTop");
const speedMin = document.getElementById("speedMin");
const historyList = document.getElementById("historyList");

let currentRpm = 0, maxRpmVal = 0, minRpmVal = 0;
let currentSpeed = 0, maxSpeedVal = 0, minSpeedVal = 0;
let wavePhase = 0;

/* キャンバスサイズ調整 */
function resizeCanvas() {
  waveCanvas.width = waveCanvas.clientWidth;
  waveCanvas.height = waveCanvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

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

/* FFT解析エンジン */
function getPrecisePeak(data, fftSize, sampleRate) {
    const minFreq = parseInt(document.getElementById("minSlider").value) / 60;
    const maxFreq = parseInt(document.getElementById("maxSlider").value) / 60;
    const minBin = Math.floor(minFreq * fftSize / sampleRate);
    const maxBin = Math.floor(maxFreq * fftSize / sampleRate);
    
    let maxVal = -Infinity, maxIdx = -1;
    for (let i = minBin; i < maxBin; i++) {
        if (data[i] > maxVal) { maxVal = data[i]; maxIdx = i; }
    }
    if (maxIdx <= minBin || maxIdx >= maxBin - 1) return 0;
    
    const y1 = data[maxIdx - 1], y2 = data[maxIdx], y3 = data[maxIdx + 1];
    const offset = (y1 - y3) / (2 * (y1 - 2 * y2 + y3));
    return ((maxIdx + offset) * sampleRate) / fftSize;
}

/* 新しい計測ループ */
function loop() {
    if (!measuring) return; 
    requestAnimationFrame(loop);

    analyser.getFloatFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
    ctx.beginPath();
    ctx.strokeStyle = "#ff4fa3";
    for (let i = 0; i < waveCanvas.width; i++) {
        const val = (dataArray[i * 5] + 100) * 2;
        ctx.lineTo(i, waveCanvas.height - val);
    }
    ctx.stroke();

    const freq = getPrecisePeak(dataArray, 16384, audioCtx.sampleRate);
    if (freq > 0) {
        updateAppValues(freq * 60 * 0.9924);
    }
}

/* 画面更新 */
function updateAppValues(rawRpm) {
    const { adjustedRpm, speed } = computeSpeedFromRpm(rawRpm);
    currentRpm = adjustedRpm; currentSpeed = speed;

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
}

/* 比較表・保存・履歴関数（既存のコードをそのまま配置） */
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
function saveCurrentHistory(name, motorType) {
  const voltage = parseFloat(document.getElementById("voltageRange").value).toFixed(1);
  const gearIndex = parseInt(document.getElementById("gearRange").value, 10);
  const gearStr = gearOptions[gearIndex];
  const tire = parseFloat(document.getElementById("tireRange").value).toFixed(1);

  const entry = {
    date: new Date().toLocaleString(),
    name,
    motor: motorType,
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
  const motors = new Set();
  const names = new Set();

  list.forEach(item => {
    voltages.add(item.voltage);
    gears.add(item.gear);
    tires.add(item.tire);
    motors.add(item.motor);
    names.add(item.name);
  });

  fillSelect(filterVoltage, voltages, "電圧指定なし");
  fillSelect(filterGear, gears, "ギヤ比指定なし");
  fillSelect(filterTire, tires, "タイヤ径指定なし");
  fillSelect(filterMotor, motors, "モーター指定なし");
  fillSelect(filterName, names, "名前指定なし");
}

function fillSelect(select, values, label) {
  const current = select.value;
  select.innerHTML = `<option value="">${label}</option>`;
  [...values].forEach(v => {
    if (!v) return;
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
    if (filterMotor.value && item.motor !== filterMotor.value) return false;
    if (filterName.value && item.name !== filterName.value) return false;
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
      <span>${item.name}</span>
      <span>${item.motor}</span>
      <span>${item.voltage}</span>
      <span>${item.gear}</span>
      <span>${item.tire}</span>
      <span>${item.rpm}</span>
      <span>${item.speed}</span>
    `;
    historyList.appendChild(row);
  });
}

/* オーディオ初期化 */
async function startAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 16384;
    dataArray = new Float32Array(analyser.frequencyBinCount);
    audioCtx.createMediaStreamSource(stream).connect(analyser);
}

/* 初期化実行 */
generateComparisonTable();
renderHistory();
buildFilterOptions();

/* === ここの下に付け足してね！ === */

/* スライダーを動かしたときに数字をかえる魔法の命令 */

// 1. ノートから「数字を表示する箱」を見つけてくるよ
const minValText = document.getElementById("minVal");
const maxValText = document.getElementById("maxVal");
const minShowText = document.getElementById("minValShow"); // 追加
const maxShowText = document.getElementById("maxValShow"); // 追加

document.getElementById("minSlider").addEventListener("input", (e) => {
  minValText.textContent = e.target.value;
  minShowText.textContent = e.target.value; // 両方書き換える
});

document.getElementById("maxSlider").addEventListener("input", (e) => {
  maxValText.textContent = e.target.value;
  maxShowText.textContent = e.target.value; // 両方書き換える
});