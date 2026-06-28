/* =========================================================
   main.js — ① 初期設定・定数
   - 状態管理
   - ギヤ比リスト
   - 設定値の取得
   - FFT / Audio の準備に必要な定数
========================================================= */

import { getCurrentSettings } from "./preset.js";
import { setLockState, bindMainEvents } from "./ui.js";

/* -----------------------------
   状態管理
----------------------------- */
let isRunning = false;   // 計測中か
let isLocked = false;    // ロック中か

let audioContext = null;
let analyser = null;
let fftArray = null;
let sourceNode = null;

/* -----------------------------
   FFT 設定
----------------------------- */
const FFT_SIZE = 2048;          // Safari でも安定
const SAMPLE_RATE = 48000;      // iPhone 標準
const NOISE_THRESHOLD = 10;     // ノイズ除去の最低振幅

/* -----------------------------
   RPM 計算用
----------------------------- */
const POLE_COUNT = 2;           // 極数2固定
const RPM_CORRECTION = 1.00;    // 補正係数（後で調整可能）

/* -----------------------------
   ギヤ比リスト（preset.js と同期）
----------------------------- */
const GEAR_LIST = [
    3.5, 3.7, 4.0, 4.2, 5.0, 6.4, 8.75, 11.2
];

/* -----------------------------
   設定値の取得（電圧・ギヤ比・タイヤ径）
----------------------------- */
function getSettings() {
    const s = getCurrentSettings();
    return {
        voltage: parseFloat(s.voltage),
        gear: GEAR_LIST[parseInt(s.gearIndex)],
        tire: parseFloat(s.tire)
    };
}

/* -----------------------------
   UI の初期ロック状態
----------------------------- */
setLockState(false);
/* =========================================================
   main.js — ② Audio + FFT 初期化
   - マイク取得
   - AudioContext 初期化
   - AnalyserNode 設定
   - FFT配列準備
========================================================= */

/* -----------------------------
   マイクの初期化
----------------------------- */
async function initAudio() {
    if (audioContext) return; // 二重初期化防止

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

/* -----------------------------
   FFTデータ取得
----------------------------- */
function getFFT() {
    if (!analyser) return null;
    analyser.getByteFrequencyData(fftArray);
    return fftArray;
}
/* =========================================================
   main.js — ③ FFT → RPM 計算
   - FFTからピーク周波数を抽出
   - 極数2固定でRPM計算
   - 補正係数適用
   - SPEED計算（ギヤ比 × タイヤ径）
========================================================= */

/* -----------------------------
   FFT → ピーク周波数を取得
----------------------------- */
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

    // ノイズ閾値以下なら無効
    if (maxAmp < NOISE_THRESHOLD) return 0;

    const freq = (maxIndex * SAMPLE_RATE) / FFT_SIZE;
    return freq;
}

/* -----------------------------
   周波数 → RPM（極数2固定）
----------------------------- */
function freqToRPM(freq) {
    if (freq <= 0) return 0;

    // 極数2 → 1回転あたり2パルス
    const rpm = (freq / POLE_COUNT) * 60;

    return rpm * RPM_CORRECTION;
}

/* -----------------------------
   RPM → SPEED（km/h）
----------------------------- */
function rpmToSpeed(rpm, gear, tire) {
    if (rpm <= 0) return 0;

    // タイヤ外周（mm）
    const circumference = tire * Math.PI;

    // モーターRPM → タイヤRPM
    const tireRPM = rpm / gear;

    // mm/min → km/h
    const speed = (tireRPM * circumference * 60) / 1_000_000;

    return speed;
}

/* -----------------------------
   FFT → RPM → SPEED 一括処理
----------------------------- */
function analyzeFFT() {
    const fftData = getFFT();
    const freq = getPeakFrequency(fftData);
    const rpm = freqToRPM(freq);

    const s = getSettings();
    const speed = rpmToSpeed(rpm, s.gear, s.tire);

    return { freq, rpm, speed };
}
/* =========================================================
   main.js — ④ mainLoop（リアルタイム更新）
   - FFT描画
   - RPM/SPEED更新
   - MAX/MIN更新
   - UI反映
   - ロック時の動作
========================================================= */

let maxRPM = 0;
let minRPM = Infinity;
let maxSpeed = 0;
let minSpeed = Infinity;

/* -----------------------------
   FFT描画
----------------------------- */
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

/* -----------------------------
   UIへ値を反映
----------------------------- */
function updateUI(rpm, speed) {
    document.getElementById("avgRpm").textContent = rpm.toFixed(0);
    document.getElementById("avgSpeed").textContent = speed.toFixed(2) + " km/h";

    document.getElementById("maxRpm").textContent = maxRPM.toFixed(0);
    document.getElementById("minRpm").textContent = minRPM === Infinity ? 0 : minRPM.toFixed(0);

    document.getElementById("maxSpeed").textContent = maxSpeed.toFixed(2) + " km/h";
    document.getElementById("minSpeed").textContent = minSpeed === Infinity ? 0 : minSpeed.toFixed(2) + " km/h";
}

/* -----------------------------
   メインループ
----------------------------- */
function mainLoop() {
    if (!isRunning) return;

    const fftData = getFFT();
    drawFFT(fftData);

    const { rpm, speed } = analyzeFFT();

    if (!isLocked) {
        // MAX/MIN更新
        if (rpm > maxRPM) maxRPM = rpm;
        if (rpm < minRPM) minRPM = rpm;

        if (speed > maxSpeed) maxSpeed = speed;
        if (speed < minSpeed) minSpeed = speed;
    }

    updateUI(rpm, speed);

    requestAnimationFrame(mainLoop);
}
/* =========================================================
   main.js — ⑤ 計測開始 / 停止 / ロック
========================================================= */

/* -----------------------------
   計測開始
----------------------------- */
async function startMeasurement() {
    if (isRunning) return;

    await initAudio(); // ②で作ったマイク初期化

    // 初期化
    maxRPM = 0;
    minRPM = Infinity;
    maxSpeed = 0;
    minSpeed = Infinity;

    isRunning = true;
    isLocked = false;
    setLockState(false);

    document.getElementById("fftStatusLabel").textContent = "RUNNING";
    document.getElementById("standbyText").style.display = "none";

    mainLoop(); // ④で作ったループ開始
}

/* -----------------------------
   計測停止
----------------------------- */
function stopMeasurement() {
    isRunning = false;

    document.getElementById("fftStatusLabel").textContent = "STANDBY";
    document.getElementById("standbyText").style.display = "block";
}

/* -----------------------------
   ロック / 解除
----------------------------- */
function toggleLock() {
    isLocked = !isLocked;
    setLockState(isLocked);
}
/* =========================================================
   main.js — ⑥ 保存・履歴管理
========================================================= */

const HISTORY_KEY = "rpm_history";

/* -----------------------------
   履歴を取得
----------------------------- */
function loadHistory() {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
}

/* -----------------------------
   履歴を保存
----------------------------- */
function saveHistory(list) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

/* -----------------------------
   計測結果を保存
----------------------------- */
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
}

/* -----------------------------
   履歴一覧を描画
----------------------------- */
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

    // 削除ボタン
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = btn.dataset.index;
            deleteHistory(idx);
        });
    });
}

/* -----------------------------
   履歴削除
----------------------------- */
function deleteHistory(index) {
    const list = loadHistory();
    list.splice(index, 1);
    saveHistory(list);
    renderHistory();
}

/* -----------------------------
   全削除
----------------------------- */
function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
}
/* =========================================================
   main.js — ⑦ 比較表生成（最終ブロック）
========================================================= */

/* -----------------------------
   比較表を生成
----------------------------- */
function generateComparisonTable() {
    const tbody = document.getElementById("comparisonBody");
    tbody.innerHTML = "";

    const s = getSettings();
    const baseVoltage = s.voltage;

    // 電圧を ±0.4V の範囲で比較
    const voltages = [
        (baseVoltage - 0.4).toFixed(1),
        (baseVoltage - 0.2).toFixed(1),
        baseVoltage.toFixed(1),
        (baseVoltage + 0.2).toFixed(1),
        (baseVoltage + 0.4).toFixed(1)
    ];

    voltages.forEach(v => {
        const voltage = parseFloat(v);

        // モーターRPMは電圧に比例すると仮定
        const rpm = parseFloat(document.getElementById("avgRpm").textContent);
        const scaledRPM = rpm * (voltage / baseVoltage);

        const row = document.createElement("tr");

        let html = `
            <td>${voltage.toFixed(1)} V</td>
            <td>${scaledRPM.toFixed(0)}</td>
        `;

        // ギヤ比ごとに速度を計算
        GEAR_LIST.forEach(g => {
            const speed = rpmToSpeed(scaledRPM, g, s.tire);
            html += `<td>${speed.toFixed(2)}</td>`;
        });

        row.innerHTML = html;
        tbody.appendChild(row);
    });
}
