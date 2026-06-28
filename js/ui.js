const UI = {
  historyBtn: document.getElementById("historyBtn"),
  settingsBtn: document.getElementById("settingsBtn"),

  historyModal: document.getElementById("historyModalBackdrop"),
  settingsModal: document.getElementById("settingsModalBackdrop"),

  closeHistory: document.getElementById("closeHistory"),
  closeSettings: document.getElementById("closeSettings"),

  helpButton: document.getElementById("helpButton"),
  helpText: document.getElementById("helpText"),

  startBtn: document.getElementById("startBtn"),
  lockBtn: document.getElementById("lockBtn"),
  saveBtn: document.getElementById("saveBtn"),
  resetBtn: document.getElementById("resetBtn"),

  statusLine: document.getElementById("statusLine"),
};

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

UI.helpButton.addEventListener("click", () => {
  UI.helpText.classList.toggle("hidden");
});

/* 計測開始 / 停止 */
UI.startBtn.addEventListener("click", () => {
  measuring = !measuring;

  if (measuring) {
    UI.startBtn.textContent = "計測停止";
    UI.statusLine.textContent = "MEASURING — 計測中";
  } else {
    UI.startBtn.textContent = "計測開始";
    UI.statusLine.textContent = "MEASURING — 計測待機中";
  }
});

/* ロック */
UI.lockBtn.addEventListener("click", () => {
  UI.statusLine.textContent = "LOCKED — ロック中";
});

/* 保存 */
UI.saveBtn.addEventListener("click", () => {
  saveCurrentHistory();
  UI.statusLine.textContent = "SAVED — 保存しました";
});

/* リセット */
UI.resetBtn.addEventListener("click", () => {
  resetMeasurement();
  UI.statusLine.textContent = "MEASURING — 計測待機中";
});
