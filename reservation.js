/**
 * ==========================================================================
 * RESERVATION PAGE - 캘린더 예약 폼
 * 평일(공휴일 제외) 날짜 선택 + 30분 단위 시간 선택 + 방문자 정보 입력 +
 * 최종 확인 팝업 + Formspree를 통한 운영자 이메일 전달까지 처리한다.
 * ==========================================================================
 */

// Formspree 폼 엔드포인트. 이 폼이 운영자(박정인) 이메일로 제출 내용을 전달하도록
// formspree.io 대시보드에서 이미 설정되어 있다.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mgaovvav";

// 관리자 백엔드(Render)가 연결되어 있으면, 관리자 페이지의 "예약 관리" 탭에서도
// 볼 수 있도록 같은 내용을 그쪽에도 함께 저장한다. index.html과 동일하게
// window.PORTFOLIO_API_BASE가 비어 있으면 건너뛴다.
const ADMIN_API_BASE = window.PORTFOLIO_API_BASE || "";

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

// 이미 예약된(취소 제외) 날짜·시간을 "YYYY-MM-DD" -> Set("HH:mm") 형태로 들고 있는다.
// 예약 폼 로딩 시 한 번 불러오고, 충돌(409) 발생 시 다시 갱신한다.
let bookedSlotsByDate = new Map();

document.addEventListener("DOMContentLoaded", () => {
  const calendarGrid = document.getElementById("calendar-grid");
  if (!calendarGrid) return; // 예약 페이지가 아니면 아무 것도 하지 않음

  const today = new Date();
  resState.viewYear = today.getFullYear();
  resState.viewMonth = today.getMonth();

  renderCalendar();
  populateTimeOptions(null);
  validateReservationForm();
  loadBookedSlots(); // 백그라운드에서 불러오고, 끝나면 필요 시 드롭다운을 다시 그린다

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
  const bookedTimes = (dateStr && bookedSlotsByDate.get(dateStr)) || new Set();

  let anyAvailable = false;

  getTimeSlots().forEach((slot) => {
    const [h, m] = slot.split(":").map(Number);
    if (isToday && h * 60 + m <= nowMinutes) return; // 오늘 날짜면 이미 지난 시간은 제외

    const isBooked = bookedTimes.has(slot);
    const opt = document.createElement("option");
    opt.value = slot;
    opt.textContent = isBooked ? `${slot} (완료)` : slot;
    if (isBooked) {
      opt.disabled = true; // 이미 예약된 시간 — 선택 불가
    } else {
      anyAvailable = true;
    }
    select.appendChild(opt);
  });

  if (dateStr && !anyAvailable) {
    timeGroup.classList.add("has-error");
    select.disabled = true;
  } else {
    timeGroup.classList.remove("has-error");
    select.disabled = false;
    const stillValid = Array.from(select.options).some((o) => o.value === previousValue && !o.disabled);
    select.value = stillValid ? previousValue : "";
  }
}

/* ==========================================================================
   예약 가능 시간 조회 (중복 예약 방지)
   ========================================================================== */

// 관리자 백엔드에서 "취소되지 않은" 예약들의 날짜·시간만 불러온다 (개인정보 없음).
// 연결이 안 돼 있거나 느려도(Render 슬립 등) 예약 폼 자체는 계속 쓸 수 있어야 하므로,
// 일정 시간 안에 응답이 없으면 조용히 포기하고 "알 수 없음"으로 둔다.
async function loadBookedSlots() {
  if (!ADMIN_API_BASE) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${ADMIN_API_BASE.replace(/\/$/, "")}/api/reservations/booked`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return;

    const data = await res.json();
    const map = new Map();
    (data.booked || []).forEach(({ date, time }) => {
      if (!map.has(date)) map.set(date, new Set());
      map.get(date).add(time);
    });
    bookedSlotsByDate = map;

    if (resState.selectedDate) populateTimeOptions(resState.selectedDate); // 이미 날짜를 고른 상태였다면 반영
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("예약 가능 시간 정보를 불러오지 못했습니다. (전체 시간이 선택 가능하게 표시됩니다)", err);
  }
}

function markSlotBooked(dateStr, time) {
  if (!bookedSlotsByDate.has(dateStr)) bookedSlotsByDate.set(dateStr, new Set());
  bookedSlotsByDate.get(dateStr).add(time);
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
  document.getElementById("confirm-modal-error").hidden = true;

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

async function finalizeReservation() {
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

  const confirmBtn = document.getElementById("confirm-submit-btn");
  const confirmBtnLabel = document.getElementById("confirm-submit-btn-label");
  const errorMsg = document.getElementById("confirm-modal-error");
  const errorMsgText = document.getElementById("confirm-modal-error-text");
  const originalLabel = confirmBtnLabel.textContent;

  confirmBtn.disabled = true;
  confirmBtnLabel.textContent = "확인 중...";
  errorMsg.hidden = true;

  saveReservationLocally(reservation); // 항상 방문자 브라우저에도 백업

  // 1) 먼저 관리자 백엔드에 "진짜" 예약을 만든다. 같은 날짜·시간이 그 사이 다른 사람에게
  //    먼저 배정됐다면 여기서 409(conflict)로 막힌다 — 이게 중복 예약을 막는 최종 관문이다.
  const backendResult = await submitToAdminBackend(reservation);

  if (backendResult.outcome === "conflict") {
    confirmBtn.disabled = false;
    confirmBtnLabel.textContent = originalLabel;
    errorMsgText.textContent = "죄송합니다. 방금 다른 분이 이 시간을 먼저 예약했습니다. 다른 시간을 선택해 주세요.";
    errorMsg.hidden = false;
    markSlotBooked(reservation.date, reservation.time);
    populateTimeOptions(resState.selectedDate); // 드롭다운에 즉시 "(완료)"로 반영
    await loadBookedSlots(); // 최신 전체 목록도 다시 받아온다
    return;
  }

  // 2) 이메일 전송(Formspree). 백엔드에 이미 안전하게 저장됐다면(outcome === "created"),
  //    이메일이 실패하더라도 예약 자체는 "예약 관리" 탭에 남아 있으므로 전체 성공으로 간주한다.
  confirmBtnLabel.textContent = "전송 중...";
  let emailSent = false;
  try {
    emailSent = await sendReservationEmail(reservation);
  } catch (err) {
    console.warn("Formspree 전송 중 오류가 발생했습니다.", err);
  }

  confirmBtn.disabled = false;
  confirmBtnLabel.textContent = originalLabel;

  if (emailSent || backendResult.outcome === "created") {
    if (backendResult.outcome === "created") markSlotBooked(reservation.date, reservation.time);
    closeConfirmModal();
    resetReservationForm();
    if (typeof showToast === "function") {
      showToast("🗓️ 예약 신청이 접수되었습니다!");
    }
  } else {
    errorMsgText.textContent = "전송에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.";
    errorMsg.hidden = false;
  }
}

// Formspree로 예약 내용을 전송한다. res-email 입력값을 "email" 키로 보내면
// Formspree가 이를 Reply-To로 인식해, 운영자가 받은 이메일에서 바로 답장할 수 있다.
async function sendReservationEmail(reservation) {
  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: reservation.name,
      email: reservation.email,
      date: reservation.dateLabel,
      time: reservation.time,
      purpose: reservation.purpose,
      _subject: `[포트폴리오 방문 예약] ${reservation.name}님 - ${reservation.dateLabel} ${reservation.time}`,
    }),
  });
  return response.ok;
}

// 관리자 백엔드(연결되어 있다면)에 예약을 생성한다. 같은 날짜·시간이 이미 취소되지 않은
// 상태로 존재하면 서버가 409를 돌려주므로, 그 경우를 명확히 구분해서 반환한다.
// 백엔드가 느리거나(Render 슬립) 연결이 안 되어 있으면 일정 시간 후 포기하고, 이번 건은
// 중복 방지 없이 Formspree 이메일 전송만으로 진행한다("skipped").
async function submitToAdminBackend(reservation) {
  if (!ADMIN_API_BASE) return { outcome: "skipped" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${ADMIN_API_BASE.replace(/\/$/, "")}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: reservation.name,
        email: reservation.email,
        date: reservation.date,
        time: reservation.time,
        purpose: reservation.purpose,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 409) return { outcome: "conflict" };
    if (!response.ok) {
      console.warn("관리자 백엔드 저장에 실패했습니다. (이메일 전송은 계속 진행합니다)", response.status);
      return { outcome: "skipped" };
    }
    return { outcome: "created" };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("관리자 백엔드에 연결하지 못했습니다. (이메일 전송은 계속 진행합니다)", err);
    return { outcome: "skipped" };
  }
}

// 이메일 전송 성공 여부와 무관하게, 제출 내용을 방문자의 브라우저(localStorage)에도 남겨 둔다.
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
