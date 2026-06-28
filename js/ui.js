/* =========================================================
   ui.js
   - モーダル開閉
   - ボタンイベント
   - UI状態更新
   - preset.js の関数を呼ぶ
========================================================= */

import { updateSliderLabels } from "./preset.js";

/* =========================================================
   モーダル制御
========================================================= */

function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

/* -----------------------------
   保存モーダル
----------------------------- */
document.getElementById("saveBtn").addEventListener("click", () => {
    openModal("saveModalBackdrop");
});

document.getElementById("saveClose").addEventListener("click", () => {
    closeModal("saveModalBackdrop");
});

document.getElementById("saveCancelBtn").addEventListener("click", () => {
    closeModal("saveModalBackdrop");
});

/* -----------------------------
   履歴モーダル
----------------------------- */
document.getElementById("historyIcon").addEventListener("click", () => {
    openModal("historyModalBackdrop");
});

document.getElementById("historyClose").addEventListener("click", () => {
    closeModal("historyModalBackdrop");
});

/* -----------------------------
   設定モーダル
----------------------------- */
document.getElementById("settingsIcon").addEventListener("click", () => {
    openModal("settingsModalBackdrop");
});

document.getElementById("settingsClose").addEventListener("click", () => {
    closeModal("settingsModalBackdrop");
});

/* =========================================================
   スライダー → ラベル更新
========================================================= */

document.getElementById("voltageRange").addEventListener("input", updateSliderLabels);
document.getElementById("gearRange").addEventListener("input", updateSliderLabels);
document.getElementById("tireRange").addEventListener("input", updateSliderLabels);

/* =========================================================
   UI 状態更新（ロックボタンなど）
========================================================= */

export function setLockState(isLocked) {
    const lockBtn = document.getElementById("lockBtn");
    lockBtn.textContent = isLocked ? "解除" : "ロック";
    lockBtn.style.background = isLocked ? "#ff4444" : "#444";
}

/* =========================================================
   計測ボタン（main.js が処理を担当）
========================================================= */

export function bindMainEvents(startFn, lockFn, saveFn, resetFn) {
    document.getElementById("startBtn").addEventListener("click", startFn);
    document.getElementById("lockBtn").addEventListener("click", lockFn);
    document.getElementById("saveConfirmBtn").addEventListener("click", saveFn);
    document.getElementById("resetBtn").addEventListener("click", resetFn);
}

/* =========================================================
   初期化
========================================================= */

updateSliderLabels();
