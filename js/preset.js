/* =========================================================
   preset.js
   - スライダーのラベル更新
   - 設定値の保存・読み込み
   - プリセット管理（8スロット）
========================================================= */

/* -----------------------------
   スライダー → ラベル更新
----------------------------- */
export function updateSliderLabels() {
    const voltage = document.getElementById("voltageRange").value;
    const gearIndex = document.getElementById("gearRange").value;
    const tire = document.getElementById("tireRange").value;

    const gearList = ["3.5:1","3.7:1","4.0:1","4.2:1","5.0:1","6.4:1","8.75:1","11.2:1"];

    document.getElementById("voltageLabel").textContent = `${voltage} V`;
    document.getElementById("gearLabel").textContent = gearList[gearIndex];
    document.getElementById("tireLabel").textContent = `${tire} mm`;
}

/* -----------------------------
   設定値の取得
----------------------------- */
export function getCurrentSettings() {
    return {
        voltage: document.getElementById("voltageRange").value,
        gearIndex: document.getElementById("gearRange").value,
        tire: document.getElementById("tireRange").value
    };
}

/* -----------------------------
   設定値の反映
----------------------------- */
export function applySettings(data) {
    document.getElementById("voltageRange").value = data.voltage;
    document.getElementById("gearRange").value = data.gearIndex;
    document.getElementById("tireRange").value = data.tire;

    updateSliderLabels();
}

/* =========================================================
   プリセット管理（8スロット）
========================================================= */

const PRESET_KEY = "rpm_presets";

/* -----------------------------
   保存されているプリセットを取得
----------------------------- */
function loadPresets() {
    const data = localStorage.getItem(PRESET_KEY);
    return data ? JSON.parse(data) : Array(8).fill(null);
}

/* -----------------------------
   プリセットを保存
----------------------------- */
function savePresets(list) {
    localStorage.setItem(PRESET_KEY, JSON.stringify(list));
}

/* -----------------------------
   プリセット登録（長押し）
----------------------------- */
export function registerPreset(slot) {
    const presets = loadPresets();
    presets[slot] = getCurrentSettings();
    savePresets(presets);
}

/* -----------------------------
   プリセット読込（短押し）
----------------------------- */
export function loadPreset(slot) {
    const presets = loadPresets();
    if (presets[slot]) {
        applySettings(presets[slot]);
        return true;
    }
    return false;
}

/* -----------------------------
   プリセットの使用状況を返す
----------------------------- */
export function getPresetStatus() {
    return loadPresets().map(p => p !== null);
}
