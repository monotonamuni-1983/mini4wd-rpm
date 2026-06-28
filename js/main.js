/* =========================================================
   main.js
   - ① 初期設定・定数
   - ② Audio + FFT 初期化
   - ③ FFT → RPM / SPEED 計算
   - ④ mainLoop（リアルタイム更新）
   - ⑤ 計測開始 / 停止 / ロック / リセット
   - ⑥ 保存・履歴管理
   - ⑦ 比較表生成
========================================================= */

import { getCurrentSettings } from "./preset.js";
import { setLockState, bindMainEvents } from "./ui.js";

/* ① 初期設定・定数 -------------------------------------- */

let isRunning = false;
let isLocked = false;

let audioContext = null;
let analyser = null;
let fftArray = null;
let sourceNode = null;

const FFT_SIZE = 2048;
const SAMPLE_RATE = 48000;
const NOISE_THRESHOLD = 10;

const POLE_COUNT = 2;
const RPM_CORRECTION = 1.00;

const GEAR_LIST = [3.5, 3.7, 4.0, 4.2, 5.0, 6.4, 8.75, 11.2];

function getSettings() {
    const s = getCurrentSettings();
    return {
        voltage: parseFloat(s.voltage),
        gear: GEAR_LIST[parseInt(s.gearIndex)],
        tire: parseFloat(s.tire)
    };
}

setLockState(false);

/* ② Audio + FFT 初期化 ----------------------------------- */

async function initAudio() {
    if (audioContext) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE
    });

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        }
    });

    sourceNode = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.0;

    fftArray = new Uint8Array(analyser.frequencyBinCount);
    sourceNode.connect(analyser);
}

function getFFT() {
    if (!analyser) return null;
    analyser.getByteFrequencyData(fftArray);
    return fftArray;
}

/* ③ FFT → RPM / SPEED 計算 ------------------------------- */

function getPeakFrequency(fftData) {
    if (!fftData) return 0;

    let maxAmp = 0;
    let maxIndex = 0;

    for (let i = 1; i < fftData.length; i++) {
        if (fftData[i] > maxAmp) {
            maxAmp = fftData[i];
            maxIndex = i;
        }
    }

    if (maxAmp < NOISE_THRESHOLD) return 0;

    const freq = (maxIndex * SAMPLE_RATE) / FFT_SIZE;
    return freq;
}

function freqToRPM(freq) {
    if (freq <= 0) return 0;
    const rpm = (freq / POLE_COUNT) * 60;
    return rpm * RPM_CORRECTION;
}

function rpmToSpeed(rpm, gear, tire) {
    if (rpm <= 0) return 0;

    const circumference = tire * Math.PI;
    const tireRPM = rpm / gear;
    const speed = (tireRPM * circumference * 60) / 1_000_000;

    return speed;
}

function analyzeFFT() {
    const fftData = getFFT();
    const freq = getPeakFrequency(fftData);
    const rpm = freqToRPM(freq);

    const s = getSettings();
    const speed = rpmToSpeed(rpm, s.gear, s.tire);

    return { freq, rpm, speed, fftData };
}

/* ④ mainLoop（リアルタイム更新） ------------------------ */

let maxRPM = 0;
let minRPM = Infinity;
let maxSpeed = 0;
let minSpeed = Infinity;

function drawFFT(fftData) {
    const canvas = document.getElementById("spectrum");
    const ctx = canvas.getContext("2d");

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!fftData) return;

    const barWidth = w / fftData.length;

    for (let i = 0; i < fftData.length; i++) {
        const amp = fftData[i];
        const barHeight = (amp / 255) * h;

        ctx.fillStyle = "#00c8ff";
        ctx.fillRect(i * barWidth, h - barHeight, barWidth, barHeight);
    }
}

function updateUI(rpm, speed) {
    document.getElementById("avgRpm").textContent = rpm.toFixed(0);
    document.getElementById("avgSpeed").textContent = speed.toFixed(2) + " km/h";

    document.getElementById("maxRpm").textContent = maxRPM.toFixed(0);
    document.getElementById("minRpm").textContent = minRPM === Infinity ? 0 : minRPM.toFixed(0);

    document.getElementById("maxSpeed").textContent = maxSpeed.toFixed(2) + " km/h";
    document.getElementById("minSpeed").textContent = minSpeed === Infinity ? 0 : minSpeed.toFixed(2) + " km/h";
}

function mainLoop() {
    if (!isRunning) return;

    const { rpm, speed, fftData } = analyzeFFT();

    drawFFT(fftData);

    if (!isLocked) {
        if (rpm > maxRPM) maxRPM = rpm;
        if (rpm < minRPM) minRPM = rpm;

        if (speed > maxSpeed) maxSpeed = speed;
        if (speed < minSpeed) minSpeed = speed;
    }

    updateUI(rpm, speed);

    requestAnimationFrame(mainLoop);
}

/* ⑤ 計測開始 / 停止 / ロック / リセット ----------------- */

async function startMeasurement() {
    if (isRunning) return;

    await initAudio();

    maxRPM = 0;
    minRPM = Infinity;
    maxSpeed = 0;
    minSpeed = Infinity;

    isRunning = true;
    isLocked = false;
    setLockState(false);

    document.getElementById("fftStatusLabel").textContent = "RUNNING";
    document.getElementById("standbyText").style.display = "none";

    mainLoop();
}

function stopMeasurement() {
    isRunning = false;
    document.getElementById("fftStatusLabel").textContent = "STANDBY";
    document.getElementById("standbyText").style.display = "block";
}

function toggleLock() {
    isLocked = !isLocked;
    setLockState(isLocked);
}

function resetMeasurement() {
    stopMeasurement();

    maxRPM = 0;
    minRPM = Infinity;
    maxSpeed = 0;
    minSpeed = Infinity;

    updateUI(0, 0);

    const canvas = document.getElementById("spectrum");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* ⑥ 保存・履歴管理 -------------------------------------- */

const HISTORY_KEY = "rpm_history";

function loadHistory() {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
}

function saveHistory(list) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function renderHistory() {
    const list = loadHistory();
    const container = document.getElementById("historyList");
    container.innerHTML = "";

    list.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "history-row";

        div.innerHTML = `
            <div class="history-row-top">
                <span>${item.name}</span>
                <button class="delete-btn" data-index="${index}">✕</button>
            </div>
            <div class="history-row-bottom">
                <span>${item.avg.toFixed(0)} rpm</span>
                <span>${item.max.toFixed(0)} / ${item.min.toFixed(0)}</span>
                <span>${item.avgS.toFixed(2)} km/h</span>
            </div>
        `;

        container.appendChild(div);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = btn.dataset.index;
            deleteHistory(idx);
        });
    });
}

function deleteHistory(index) {
    const list = loadHistory();
    list.splice(index, 1);
    saveHistory(list);
    renderHistory();
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
}

function saveCurrentResult() {
    const s = getSettings();

    const avg = parseFloat(document.getElementById("avgRpm").textContent);
    const max = parseFloat(document.getElementById("maxRpm").textContent);
    const min = parseFloat(document.getElementById("minRpm").textContent);

    const avgS = parseFloat(document.getElementById("avgSpeed").textContent);
    const maxS = parseFloat(document.getElementById("maxSpeed").textContent);
    const minS = parseFloat(document.getElementById("minSpeed").textContent);

    const name = document.getElementById("saveNameInput").value || "No Name";

    const entry = {
        name,
        voltage: s.voltage,
        gear: s.gear,
        tire: s.tire,
        avg, max, min,
        avgS, maxS, minS,
        time: Date.now()
    };

    const list = loadHistory();
    list.unshift(entry);
    saveHistory(list);

    document.getElementById("saveNameInput").value = "";
    document.getElementById("saveModalBackdrop").style.display = "none";

    renderHistory();
    generateComparisonTable();
}

/* ⑦ 比較表生成 ------------------------------------------ */

function generateComparisonTable() {
    const tbody = document.getElementById("comparisonBody");
    tbody.innerHTML = "";

    const s = getSettings();
    const baseVoltage = s.voltage;

    const voltages = [
        (baseVoltage - 0.4).toFixed(1),
        (baseVoltage - 0.2).toFixed(1),
        baseVoltage.toFixed(1),
        (baseVoltage + 0.2).toFixed(1),
        (baseVoltage + 0.4).toFixed(1)
    ];

    const rpm = parseFloat(document.getElementById("avgRpm").textContent);

    voltages.forEach(v => {
        const voltage = parseFloat(v);
        const scaledRPM = rpm * (voltage / baseVoltage);

        const row = document.createElement("tr");

        let html = `
            <td>${voltage.toFixed(1)} V</td>
            <td>${scaledRPM.toFixed(0)}</td>
        `;

        GEAR_LIST.forEach(g => {
            const speed = rpmToSpeed(scaledRPM, g, s.tire);
            html += `<td>${speed.toFixed(2)}</td>`;
        });

        row.innerHTML = html;
        tbody.appendChild(row);
    });
}

/* イベント結線 ------------------------------------------ */

bindMainEvents(
    startMeasurement,
    toggleLock,
    saveCurrentResult,
    resetMeasurement,
    clearHistory,
    generateComparisonTable
);

/* 初期表示 */
renderHistory();
document.getElementById("fftStatusLabel").textContent = "STANDBY";
document.getElementById("standbyText").style.display = "block";
