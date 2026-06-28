const UI = {
  historyBtn: document.getElementById("historyBtn"),
  settingsBtn: document.getElementById("settingsBtn"),

  historyModal: document.getElementById("historyModalBackdrop"),
  settingsModal: document.getElementById("settingsModalBackdrop"),

  closeHistory: document.getElementById("closeHistory"),
  closeSettings: document.getElementById("closeSettings"),

  helpButton: document.getElementById("helpButton"),
  helpText: document.getElementById("helpText"),

  statusLine: document.getElementById("statusLine"),

  stopBtn: document.getElementById("stopBtn"),
  lockBtn: document.getElementById("lockBtn"),
  saveBtn: document.getElementById("saveBtn"),
  resetBtn: document.getElementById("resetBtn"),
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

UI.stopBtn.addEventListener("click", () => {
  UI.statusLine.textContent = "MEASURING — 計測停止中";
});

UI.resetBtn.addEventListener("click", () => {
  UI.statusLine.textContent = "MEASURING — 計測待機中";
  if (typeof resetMeasurement === "function") resetMeasurement();
});

UI.lockBtn.addEventListener("click", () => {
  UI.statusLine.textContent = "LOCKED — ロック中";
});

UI.saveBtn.addEventListener("click", () => {
  UI.statusLine.textContent = "SAVED — 保存しました";
  if (typeof saveCurrentHistory === "function") saveCurrentHistory();
});
