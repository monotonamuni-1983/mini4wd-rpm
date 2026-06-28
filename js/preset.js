const PRESET = {
  voltage: document.getElementById("voltageRange"),
  noise: document.getElementById("noiseRange"),
  rpmCal: document.getElementById("rpmCalRange"),
  load: document.getElementById("loadFactorRange"),

  voltageLabel: document.getElementById("voltageLabel"),
  noiseLabel: document.getElementById("noiseLabel"),
  rpmCalLabel: document.getElementById("rpmCalLabel"),
  loadLabel: document.getElementById("loadFactorLabel"),

  poleLabel: document.getElementById("poleMotorLabel"),
};

function loadPresets() {
  const savedVoltage = localStorage.getItem("preset_voltage");
  const savedNoise = localStorage.getItem("preset_noise");
  const savedRpmCal = localStorage.getItem("preset_rpmCal");
  const savedLoad = localStorage.getItem("preset_load");

  if (savedVoltage !== null) PRESET.voltage.value = savedVoltage;
  if (savedNoise !== null) PRESET.noise.value = savedNoise;
  if (savedRpmCal !== null) PRESET.rpmCal.value = savedRpmCal;
  if (savedLoad !== null) PRESET.load.value = savedLoad;

  updatePresetLabels();
}

function updatePresetLabels() {
  PRESET.voltageLabel.textContent = PRESET.voltage.value + "V";
  PRESET.noiseLabel.textContent = PRESET.noise.value + " dB";
  PRESET.rpmCalLabel.textContent = parseFloat(PRESET.rpmCal.value).toFixed(2);
  PRESET.loadLabel.textContent = PRESET.load.value + "%";
  PRESET.poleLabel.textContent = "2";
}

function savePresets() {
  localStorage.setItem("preset_voltage", PRESET.voltage.value);
  localStorage.setItem("preset_noise", PRESET.noise.value);
  localStorage.setItem("preset_rpmCal", PRESET.rpmCal.value);
  localStorage.setItem("preset_load", PRESET.load.value);
}

PRESET.voltage.addEventListener("input", () => {
  PRESET.voltageLabel.textContent = PRESET.voltage.value + "V";
  savePresets();
});

PRESET.noise.addEventListener("input", () => {
  PRESET.noiseLabel.textContent = PRESET.noise.value + " dB";
  savePresets();
});

PRESET.rpmCal.addEventListener("input", () => {
  PRESET.rpmCalLabel.textContent = parseFloat(PRESET.rpmCal.value).toFixed(2);
  savePresets();
});

PRESET.load.addEventListener("input", () => {
  PRESET.loadLabel.textContent = PRESET.load.value + "%";
  savePresets();
});

loadPresets();
