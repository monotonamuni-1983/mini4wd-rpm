/* ============================================================
   main.js
   - 計測ロジック
   - 履歴保存
   - 履歴フィルタ適用
   - 比較表生成
============================================================ */

/* ============================================================
   DOM
============================================================ */

const historyList = document.getElementById("historyList");

const filterMotor = document.getElementById("filterMotor");
const filterVoltage = document.getElementById("filterVoltage");
const filterGear = document.getElementById("filterGear");
const filterTire = document.getElementById("filterTire");

const topRpm = document.getElementById("topRpm");
const maxRpm = document.getElementById("maxRpm");
const avgRpm = document.getElementById("avgRpm");

/* ============================================================
   履歴保存
============================================================ */

function saveHistory(data) {
  const list = JSON.parse(localStorage.getItem("rpmHistory") || "[]");
  list.unshift(data);
  localStorage.setItem("rpmHistory", JSON.stringify(list));
  renderHistory();
  buildFilterOptions(); // フィルタ更新
}

/* ============================================================
   履歴フィルタ用：選択肢生成
============================================================ */

function buildFilterOptions() {
  const list = JSON.parse(localStorage.getItem("rpmHistory") || "[]");

  const motors = new Set();
  const voltages = new Set();
  const gears = new Set();
  const tires = new Set();

  list.forEach(item => {
    motors.add(item.motor);
    voltages.add(item.voltage);
    gears.add(item.gear);
    tires.add(item.tire);
  });

  function fillSelect(select, values, label) {
    const current = select.value;
    select.innerHTML = `<option value="">${label}</option>`;
    [...values].forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
    select.value = current;
  }

  fillSelect(filterMotor, motors, "モーター指定なし");
  fillSelect(filterVoltage, voltages, "電圧指定なし");
  fillSelect(filterGear, gears, "ギヤ比指定なし");
  fillSelect(filterTire, tires, "タイヤ指定なし");
}

/* ============================================================
   履歴フィルタ適用
============================================================ */

function applyHistoryFilter(list) {
  return list.filter(item => {
    if (filterMotor.value && item.motor !== filterMotor.value) return false;
    if (filterVoltage.value && item.voltage !== filterVoltage.value) return false;
    if (filterGear.value && item.gear !== filterGear.value) return false;
    if (filterTire.value && item.tire !== filterTire.value) return false;
    return true;
  });
}

/* ============================================================
   履歴描画
============================================================ */

function renderHistory() {
  const list = JSON.parse(localStorage.getItem("rpmHistory") || "[]");
  const filtered = applyHistoryFilter(list);

  historyList.innerHTML = "";

  filtered.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-row";

    row.innerHTML = `
      <span>${item.date}</span>
      <span>${item.motor}</span>
      <span>${item.voltage}</span>
      <span>${item.gear}</span>
      <span>${item.tire}</span>
      <span>${item.top}</span>
      <span>${item.max}</span>
      <span>${item.avg}</span>
    `;

    historyList.appendChild(row);
  });
}

/* ============================================================
   フィルタ変更 → 再描画
============================================================ */

[filterMotor, filterVoltage, filterGear, filterTire].forEach(sel => {
  sel.addEventListener("change", () => {
    renderHistory();
  });
});

/* ============================================================
   比較表生成（電圧行・ギヤ比列ハイライト）
============================================================ */

function generateComparisonTable() {
  const comparisonBody = document.getElementById("comparisonBody");
  if (!comparisonBody) return;

  comparisonBody.innerHTML = "";

  const currentVoltage = parseFloat(document.getElementById("voltageRange").value).toFixed(1);
  const gearOptions = ["3.5:1", "3.7:1", "4.0:1", "4.2:1", "4.5:1"];
  const selectedGear = gearOptions[0]; // 必要ならギヤ選択UIと連動

  for (let v = 2.2; v <= 3.4; v += 0.1) {
    const voltage = v.toFixed(1);

    const tr = document.createElement("tr");

    if (voltage === currentVoltage) {
      tr.classList.add("highlight-row");
    }

    let html = `<td>${voltage}</td>`;

    gearOptions.forEach(g => {
      const td = document.createElement("td");
      td.textContent = "-";

      if (g === selectedGear) {
        td.classList.add("highlight-col");
      }

      tr.appendChild(td);
    });

    tr.innerHTML = html + tr.innerHTML;
    comparisonBody.appendChild(tr);
  }
}

/* ============================================================
   速度計算（走行負荷係数を反映）
============================================================ */

function applyLoadFactor(speed) {
  const loadFactor = parseFloat(document.getElementById("loadFactorRange").value) / 100;
  return speed * (1 + loadFactor);
}

/* ============================================================
   計測処理（ダミー）
============================================================ */

function updateRpmDisplay(rpm) {
  const cal = parseFloat(document.getElementById("rpmCalRange").value);
  const adjusted = rpm * cal;

  topRpm.textContent = adjusted.toFixed(0);
  maxRpm.textContent = adjusted.toFixed(0);
  avgRpm.textContent = adjusted.toFixed(0);
}

/* ============================================================
   初期化
============================================================ */

buildFilterOptions();
renderHistory();
generateComparisonTable();
