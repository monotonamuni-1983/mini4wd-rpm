/* =========================================================
   ui.js
   - モーダル開閉
   - ボタンイベントの受け皿
   - UI状態更新（ロックボタン）
   - スライダー → ラベル更新
========================================================= */

import { updateSliderLabels } from "./preset.js";

/* -----------------------------
   モーダル制御
----------------------------- */
function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

/* 保存モーダル */
document.getElementById("saveBtn").addEventListener("click", () => {
    openModal("saveModalBackdrop");
});
document.getElementById("saveClose").addEventListener("click", () => {
    closeModal("saveModalBackdrop");
});
document.getElementById("saveCancelBtn").addEventListener("click", () => {
    closeModal("saveModalBackdrop");
});

/* 履歴モーダル */
document.getElementById("historyIcon").addEventListener("click", () => {
    openModal("historyModalBackdrop");
});
document.getElementById("historyClose").addEventListener("click", () => {
    closeModal("historyModalBackdrop");
});

/* 設定モーダル */
document.getElementById("settingsIcon").addEventListener("click", () => {
    openModal("settingsModalBackdrop");
});
document.getElementById("settingsClose").addEventListener("click", () => {
    closeModal("settingsModalBackdrop");
});

/* -----------------------------
   スライダー → ラベル更新
----------------------------- */
document.getElementById("voltageRange").addEventListener("input", updateSliderLabels);
document.getElementById("gearRange").addEventListener("input", updateSliderLabels);
document.getElementById("tireRange").addEventListener("input", updateSliderLabels);

/* -----------------------------
   ロックボタンの表示状態
----------------------------- */
export function setLockState(isLocked) {
    const lockBtn = document.getElementById("lockBtn");
    lockBtn.textContent = isLocked ? "解除" : "ロック";
    lockBtn.style.background = isLocked ? "#ff4444" : "#444";
}

/* -----------------------------
   main.js からイベントを渡すための窓口
----------------------------- */
export function bindMainEvents(startFn, lockFn, saveFn, resetFn, clearHistoryFn, comparisonFn) {
    document.getElementById("startBtn").addEventListener("click", startFn);
    document.getElementById("lockBtn").addEventListener("click", lockFn);
    document.getElementById("saveConfirmBtn").addEventListener("click", saveFn);
    document.getElementById("resetBtn").addEventListener("click", resetFn);
    document.getElementById("clearHistoryBtn").addEventListener("click", clearHistoryFn);

    // 比較表は保存後にも使うので、必要ならボタン追加して紐付ける想定
    // 今は saveCurrentResult 内から comparisonFn を呼ぶ形にしている
}

/* 初期ラベル更新 */
updateSliderLabels();
