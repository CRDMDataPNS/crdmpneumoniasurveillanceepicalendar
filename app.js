// --- Date helpers ---
const MS_DAY = 24 * 60 * 60 * 1000;
const FRIDAY = 5; // JS: 0 Sun ... 5 Fri ... 6 Sat

function startOfDay(d){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d, n){
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function sameDay(a,b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function colIndexFriFirst(date){
  // Friday should be column 0, Thursday column 6
  return (date.getDay() - FRIDAY + 7) % 7;
}

// Anchor: 6–12 February 2026 is Epi Week 7
const EPI_ANCHOR_START = new Date(2026, 1, 6); // 6 Feb 2026 (Friday)
const EPI_ANCHOR_YEAR = 2026;
const EPI_ANCHOR_WEEK = 7;

function epiInfo(date){
  const d = startOfDay(date);

  const diffDays = Math.floor((d - EPI_ANCHOR_START) / MS_DAY);
  const weekOffset = Math.floor(diffDays / 7);

  let epiWeek = EPI_ANCHOR_WEEK + weekOffset;
  let epiYear = EPI_ANCHOR_YEAR;

  // Adjust forward across years
  while (epiWeek > 53){
    epiWeek -= 53;
    epiYear += 1;
  }

  // Adjust backward across years
  while (epiWeek < 1){
    epiYear -= 1;
    epiWeek += 53;
  }

  const weekStart = addDays(EPI_ANCHOR_START, weekOffset * 7);
  const weekEnd = addDays(weekStart, 6); // Thu

  return { epiYear, epiWeek, weekStart, weekEnd };
}

// --- UI state ---
let viewDate = startOfDay(new Date()); // month we are viewing

const gridEl = document.getElementById("grid");
const monthLabelEl = document.getElementById("monthLabel");
const subTitleEl = document.getElementById("subTitle");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
const yearSelect = document.getElementById("yearSelect");

// Modal
const backdrop = document.getElementById("modalBackdrop");
const modalText = document.getElementById("modalText");
const modalCloseBtn = document.getElementById("modalCloseBtn");

function openModal(text){
  modalText.textContent = text;
  backdrop.classList.remove("hidden");
}
function closeModal(){
  backdrop.classList.add("hidden");
}
modalCloseBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });

// Populate years (default: 2026–2027; you can extend anytime)
function populateYearSelect(startYear=2026, endYear=2027){
  yearSelect.innerHTML = "";
  for(let y = startYear; y <= endYear; y++){
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearSelect.appendChild(opt);
  }
}

function setViewToMonth(year, monthIndex){
  viewDate = new Date(year, monthIndex, 1);
  render();
}

function render(){
  const today = startOfDay(new Date());
  const infoToday = epiInfo(today);
  subTitleEl.textContent =
    `Today: Epi Week ${infoToday.epiWeek} (Epi Year ${infoToday.epiYear}) • Week runs ${infoToday.weekStart.toDateString()} → ${infoToday.weekEnd.toDateString()}`;

  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const firstOfMonth = new Date(y, m, 1);
  const monthName = firstOfMonth.toLocaleString(undefined, { month: "long", year: "numeric" });
  monthLabelEl.textContent = monthName;

  yearSelect.value = String(y);

  // Find first visible cell (start grid on a Friday)
  const start = addDays(firstOfMonth, -colIndexFriFirst(firstOfMonth));

  // Build 6 weeks (42 cells)
  gridEl.innerHTML = "";
  for(let i=0; i<42; i++){
    const d = addDays(start, i);
    const inMonth = d.getMonth() === m;

    const epi = epiInfo(d);

    const cell = document.createElement("div");
    cell.className = "day" + (inMonth ? "" : " muted") + (sameDay(d, today) ? " today" : "");

    const top = document.createElement("div");
    top.className = "topRow";

    const dateNum = document.createElement("div");
    dateNum.className = "dateNum";
    dateNum.textContent = String(d.getDate());

    const weekBadge = document.createElement("div");
    weekBadge.className = "badge week";
    weekBadge.textContent = `W${epi.epiWeek}`;

    top.appendChild(dateNum);
    top.appendChild(weekBadge);

    if (d.getDay() === 4){ // Thu
      const endBadge = document.createElement("div");
      endBadge.className = "badge end";
      endBadge.textContent = "End";
      top.appendChild(endBadge);
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `Epi Year ${epi.epiYear}`;

    cell.appendChild(top);
    cell.appendChild(meta);

    gridEl.appendChild(cell);
  }
}

// Navigation
prevBtn.addEventListener("click", () => {
  setViewToMonth(viewDate.getFullYear(), viewDate.getMonth() - 1);
});
nextBtn.addEventListener("click", () => {
  setViewToMonth(viewDate.getFullYear(), viewDate.getMonth() + 1);
});
todayBtn.addEventListener("click", () => {
  const t = new Date();
  setViewToMonth(t.getFullYear(), t.getMonth());
});
yearSelect.addEventListener("change", () => {
  const y = Number(yearSelect.value);
  setViewToMonth(y, viewDate.getMonth());
});

// Friday/Thursday popups
function showPopupIfNeeded(){
  const d = startOfDay(new Date());
  const epi = epiInfo(d);

  if (d.getDay() === 5){
    openModal(`Happy Friday!! Today is the beginning of week ${epi.epiWeek} of the year! Please check and resolve any outstanding queries.`);
  } else if (d.getDay() === 4){
    openModal(`Today is the last day of week ${epi.epiWeek}. Please make sure that all queries for the week are resolved and that all enrolled cases for the week, that are fully completed, are marked as complete. Please also make sure that all admissions and enrollments are entered on REDCap.`);
  }
}

// Init
populateYearSelect(2026, 2027);
render();
showPopupIfNeeded();
