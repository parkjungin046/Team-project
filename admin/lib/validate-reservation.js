/**
 * 방문 예약(reservations) 데이터의 검증 로직.
 * 파일 저장소(db-file.js)와 PostgreSQL 저장소(db-postgres.js)가 공통으로 사용한다.
 */
const STATUSES = ["received", "confirmed", "cancelled"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_FIELDS = ["name", "email", "date", "time", "purpose"];

function normalizeReservationInput(input) {
  return {
    name: (input.name || "").trim(),
    email: (input.email || "").trim(),
    date: (input.date || "").trim(),
    time: (input.time || "").trim(),
    purpose: (input.purpose || "").trim(),
  };
}

function assertValidReservation(reservation) {
  const missing = REQUIRED_FIELDS.filter((field) => !reservation[field]);
  if (missing.length > 0) {
    const err = new Error(`다음 항목이 필요합니다: ${missing.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
  if (!EMAIL_REGEX.test(reservation.email)) {
    const err = new Error("올바른 이메일 형식이 아닙니다.");
    err.statusCode = 400;
    throw err;
  }
}

function assertValidStatus(status) {
  if (!STATUSES.includes(status)) {
    const err = new Error(`status는 ${STATUSES.join(", ")} 중 하나여야 합니다.`);
    err.statusCode = 400;
    throw err;
  }
}

function notFoundError() {
  const err = new Error("해당 예약을 찾을 수 없습니다.");
  err.statusCode = 404;
  return err;
}

module.exports = { STATUSES, normalizeReservationInput, assertValidReservation, assertValidStatus, notFoundError };
