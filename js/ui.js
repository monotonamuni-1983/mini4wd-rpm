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

UI.voltageRange.addEventListener("input", () => {
  if (typeof generateComparisonTable === "function") {
    generateComparisonTable();
  }
});

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

function initUI() {
  UI.helpText.classList.add("hidden");
}

initUI();
