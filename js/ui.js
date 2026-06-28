/* ============================================================
   ui.js
   - モーダル開閉
   - 説明ボタン（？）開閉
   - フィルタ操作
   - UI 再描画トリガー
============================================================ */

/* ============================================================
   DOM 取得
============================================================ */

const UI = {
  historyBtn: document.getElementById("historyBtn"),
  settingsBtn: document.getElementById("settingsBtn"),

  historyModal: document.getElementById("historyModalBackdrop"),
  settingsModal: document.getElementById("settingsModalBackdrop"),

  closeHistory: document.getElementById("closeHistory"),
  closeSettings: document.getElementById("closeSettings"),

  helpButton: document.getElementById("helpButton"),
  helpText: document.getElementById("helpText"),

  voltageRange: document.getElementById("voltageRange"),

  filterMotor: document.getElementById("filterMotor"),
  filterVoltage: document.getElementById("filterVoltage"),
  filterGear: document.getElementById("filterGear"),
  filterTire: document.getElementById("filterTire"),
};

/* ============================================================
   モーダル開閉
============================================================ */

UI.historyBtn.addEventListener("click", () => {
  UI.historyModal.classList.remove("hidden");
});

UI.settingsBtn.addEventListener("click", () => {
  UI.settingsModal.classList.remove("hidden");
});

UI.closeHistory.addEventListener("click", () => {
  UI.historyModal.classList.add("hidden");
});

UI.closeSettings.addEventListener("click", () => {
  UI.settingsModal.classList.add("hidden");
});

/* ============================================================
   説明ボタン（？）開閉
============================================================ */

UI.helpButton.addEventListener("click", () => {
  UI.helpText.classList.toggle("hidden");
});

/* ============================================================
   電圧変更 → 比較表再描画
============================================================ */

UI.voltageRange.addEventListener("input", () => {
  if (typeof generateComparisonTable === "function") {
    generateComparisonTable();
  }
});

/* ============================================================
   フィルタ変更 → 履歴再描画
============================================================ */

[
  UI.filterMotor,
  UI.filterVoltage,
  UI.filterGear,
  UI.filterTire
].forEach(sel => {
  sel.addEventListener("change", () => {
    if (typeof renderHistory === "function") {
      renderHistory();
    }
  });
});

/* ============================================================
   初期化
============================================================ */

function initUI() {
  UI.helpText.classList.add("hidden");
}

initUI();
