/**
 * ==========================================================================
 * RESERVATION PAGE - 캘린더 예약 폼
 * 평일(공휴일 제외) 날짜 선택 + 30분 단위 시간 선택 + 방문자 정보 입력 +
 * 최종 확인 팝업 + (현재 단계) 브라우저 로컬 저장까지 처리한다.
 * ==========================================================================
 */

// 2026년 대한민국 법정공휴일·대체공휴일 (공개된 공휴일 정보를 종합해 수기로 반영).
// 연도가 바뀌면 이 목록을 갱신해야 한다.
const KOREAN_HOLIDAYS = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "삼일절 대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "부처님오신날 대체공휴일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "광복절 대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "개천절 대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  "2027-01-01": "신정",
};

const MAX_MONTHS_AHEAD = 2; // 오늘이 속한 달 포함, 최대 3개월 뒤까지 탐색 가능
const RESERVATION_STORAGE_KEY = "parkJunginPortfolioReservations";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resState = {
  viewYear: null,
  viewMonth: null, // 0-11
  selectedDate: null, // "YYYY-MM-DD"
  selectedDateLabel: "",
};

document.addEventListener("DOMContentLoaded", () => {
  const calendarGrid = document.getElementById("calendar-grid");
  if (!calendarGrid) return; // 예약 페이지가 아니면 아무 것도 하지 않음

  const today = new Date();
  resState.viewYear = today.getFullYear();
  resState.viewMonth = today.getMonth();

  renderCalendar();
  populateTimeOptions(null);
  validateReservationForm();

  document.getElementById("cal-prev-btn").addEventListener("click", () => shiftMonth(-1));
  document.getElementById("cal-next-btn").addEventListener("click", () => shiftMonth(1));

  document.getElementById("time-select").addEventListener("change", validateReservationForm);

  const nameInput = document.getElementById("res-name");
  const emailInput = document.getElementById("res-email");
  const purposeInput = document.getElementById("res-purpose");

  nameInput.addEventListener("input", validateReservationForm);
  purposeInput.addEventListener("input", validateReservationForm);
  emailInput.addEventListener("input", validateReservationForm);

  document.getElementById("agree-checkbox").addEventListener("change", validateReservationForm);

  document.getElementById("reservation-submit-btn").addEventListener("click", openConfirmModal);
  document.getElementById("confirm-modal-close-btn").addEventListener("click", closeConfirmModal);
  document.getElementById("confirm-edit-btn").addEventListener("click", closeConfirmModal);
  document.getElementById("confirm-submit-btn").addEventListener("click", finalizeReservation);

  const modalBackdrop = document.getElementById("reservation-confirm-modal");
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeConfirmModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("open")) closeConfirmModal();
  });
});

/* ==========================================================================
   CALENDAR
   ========================================================================== */
function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateStr(y, m, d) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function isPastDate(y, m, d) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(y, m, d);
  return target < today;
}

function isWeekend(y, m, d) {
  const day = new Date(y, m, d).getDay();
  return day === 0 || day === 6;
}

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const title = document.getElementById("calendar-title");
  const { viewYear, viewMonth } = resState;

  title.textContent = `${viewYear}년 ${viewMonth + 1}월`;

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  grid.innerHTML = "";

  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-cell-empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateStr(viewYear, viewMonth, d);
    const holidayName = KOREAN_HOLIDAYS[dateStr];
    const weekend = isWeekend(viewYear, viewMonth, d);
    const past = isPastDate(viewYear, viewMonth, d);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day";
    btn.textContent = String(d);

    if (dateStr === todayStr) btn.classList.add("is-today");
    if (dateStr === resState.selectedDate) btn.classList.add("is-selected");

    if (weekend || holidayName || past) {
      btn.disabled = true;
      btn.title = holidayName ? `공휴일: ${holidayName}` : weekend ? "주말" : "지난 날짜";
      btn.setAttribute("aria-label", `${viewYear}년 ${viewMonth + 1}월 ${d}일, 선택 불가 (${btn.title})`);
    } else {
      btn.setAttribute("aria-label", `${viewYear}년 ${viewMonth + 1}월 ${d}일 선택`);
      btn.addEventListener("click", () => selectDate(viewYear, viewMonth, d));
    }

    grid.appendChild(btn);
  }

  updateNavButtonState();
}

function updateNavButtonState() {
  const today = new Date();
  const minYear = today.getFullYear();
  const minMonth = today.getMonth();

  const maxDate = new Date(minYear, minMonth + MAX_MONTHS_AHEAD, 1);

  document.getElementById("cal-prev-btn").disabled =
    resState.viewYear === minYear && resState.viewMonth === minMonth;
  document.getElementById("cal-next-btn").disabled =
    resState.viewYear === maxDate.getFullYear() && resState.viewMonth === maxDate.getMonth();
}

function shiftMonth(delta) {
  let m = resState.viewMonth + delta;
  let y = resState.viewYear;
  if (m < 0) {
    m = 11;
    y -= 1;
  }
  if (m > 11) {
    m = 0;
    y += 1;
  }
  resState.viewYear = y;
  resState.viewMonth = m;
  renderCalendar();
}

function selectDate(y, m, d) {
  resState.selectedDate = toDateStr(y, m, d);

  const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdayNames[new Date(y, m, d).getDay()];
  resState.selectedDateLabel = `${y}년 ${m + 1}월 ${d}일 (${weekday})`;

  const box = document.getElementById("selected-date-text");
  box.textContent = resState.selectedDateLabel;
  box.classList.remove("placeholder");

  renderCalendar();
  populateTimeOptions(resState.selectedDate);
  validateReservationForm();
}

/* ==========================================================================
   TIME SELECT (13:00 ~ 18:00, 30분 단위)
   ========================================================================== */
function getTimeSlots() {
  const slots = [];
  for (let h = 13; h <= 18; h++) {
    slots.push(`${pad2(h)}:00`);
    if (h !== 18) slots.push(`${pad2(h)}:30`);
  }
  return slots;
}

function populateTimeOptions(dateStr) {
  const select = document.getElementById("time-select");
  const timeGroup = select.closest(".form-group");
  const previousValue = select.value;

  select.innerHTML = '<option value="">선택해 주세요</option>';

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const isToday = dateStr === todayStr;
  const nowMinutes = today.getHours() * 60 + today.getMinutes();

  let anyAvailable = false;

  getTimeSlots().forEach((slot) => {
    const [h, m] = slot.split(":").map(Number);
    if (isToday && h * 60 + m <= nowMinutes) return; // 오늘 날짜면 이미 지난 시간은 제외
    anyAvailable = true;
    const opt = document.createElement("option");
    opt.value = slot;
    opt.textContent = slot;
    select.appendChild(opt);
  });

  if (dateStr && !anyAvailable) {
    timeGroup.classList.add("has-error");
    select.disabled = true;
  } else {
    timeGroup.classList.remove("has-error");
    select.disabled = false;
    const stillValid = Array.from(select.options).some((o) => o.value === previousValue);
    select.value = stillValid ? previousValue : "";
  }
}

/* ==========================================================================
   VALIDATION
   ========================================================================== */
function validateEmailField() {
  const input = document.getElementById("res-email");
  const group = document.getElementById("email-group");
  const value = input.value.trim();
  const valid = EMAIL_REGEX.test(value);
  group.classList.toggle("has-error", value.length > 0 && !valid);
  return valid;
}

function validateReservationForm() {
  const name = document.getElementById("res-name").value.trim();
  const purpose = document.getElementById("res-purpose").value.trim();
  const time = document.getElementById("time-select").value;
  const agreed = document.getElementById("agree-checkbox").checked;
  const emailValid = validateEmailField();

  const allValid =
    Boolean(resState.selectedDate) && Boolean(time) && name.length > 0 && emailValid && purpose.length > 0 && agreed;

  document.getElementById("reservation-submit-btn").disabled = !allValid;
  return allValid;
}

/* ==========================================================================
   CONFIRM MODAL
   ========================================================================== */
function openConfirmModal() {
  if (!validateReservationForm()) return;

  document.getElementById("confirm-date").textContent = resState.selectedDateLabel;
  document.getElementById("confirm-time").textContent = document.getElementById("time-select").value;
  document.getElementById("confirm-name").textContent = document.getElementById("res-name").value.trim();
  document.getElementById("confirm-email").textContent = document.getElementById("res-email").value.trim();
  document.getElementById("confirm-purpose").textContent = document.getElementById("res-purpose").value.trim();

  const modal = document.getElementById("reservation-confirm-modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeConfirmModal() {
  const modal = document.getElementById("reservation-confirm-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function finalizeReservation() {
  const reservation = {
    id: `res_${Date.now()}`,
    date: resState.selectedDate,
    dateLabel: resState.selectedDateLabel,
    time: document.getElementById("time-select").value,
    name: document.getElementById("res-name").value.trim(),
    email: document.getElementById("res-email").value.trim(),
    purpose: document.getElementById("res-purpose").value.trim(),
    submittedAt: new Date().toISOString(),
  };

  saveReservationLocally(reservation);
  closeConfirmModal();
  resetReservationForm();

  if (typeof showToast === "function") {
    showToast("🗓️ 예약 신청이 저장되었습니다. (현재는 이 브라우저에 임시 저장되는 테스트 단계입니다)");
  }
}

// 현재는 백엔드 연동 전이라, 제출 내용을 방문자의 브라우저(localStorage)에만 남겨 둔다.
// 추후 운영자에게 실제로 전달되게 하려면 서버 API 연동이 필요하다.
function saveReservationLocally(reservation) {
  try {
    const existing = JSON.parse(localStorage.getItem(RESERVATION_STORAGE_KEY) || "[]");
    existing.push(reservation);
    localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn("예약 정보를 로컬에 저장하지 못했습니다.", err);
  }
}

function resetReservationForm() {
  resState.selectedDate = null;
  resState.selectedDateLabel = "";

  const box = document.getElementById("selected-date-text");
  box.textContent = "아직 선택한 날짜가 없습니다.";
  box.classList.add("placeholder");

  document.getElementById("res-name").value = "";
  document.getElementById("res-email").value = "";
  document.getElementById("res-purpose").value = "";
  document.getElementById("agree-checkbox").checked = false;
  document.getElementById("email-group").classList.remove("has-error");

  renderCalendar();
  populateTimeOptions(null);
  validateReservationForm();
}
