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
function generateComparisonTable() { /* ...（中身省略）... */ }
function resetMeasurement() { measuring = false; /* ...（中身省略）... */ }
function saveCurrentHistory(name, motorType) { /* ...（中身省略）... */ }
function buildFilterOptions() { /* ...（中身省略）... */ }
function fillSelect(select, values, label) { /* ...（中身省略）... */ }
function applyHistoryFilter(list) { /* ...（中身省略）... */ }
function renderHistory() { /* ...（中身省略）... */ }

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
