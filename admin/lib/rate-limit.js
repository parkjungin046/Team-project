/**
 * 로그인 시도 횟수를 제한하는 아주 단순한 메모리 기반 레이트 리미터.
 * (외부 접속이 없는 로컬 전용 서버지만, 무차별 대입 시도에 대한 최소한의 방어)
 */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10분

const attempts = new Map(); // ip -> { count, firstAttemptAt }

function isLocked(ip) {
  const record = attempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.firstAttemptAt > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const record = attempts.get(ip);
  if (!record || Date.now() - record.firstAttemptAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttemptAt: Date.now() });
  } else {
    record.count += 1;
  }
}

function recordSuccess(ip) {
  attempts.delete(ip);
}

/**
 * 공개 예약 제출(POST /api/reservations)용 레이트 리미터.
 * 로그인 시도 제한과 별도의 맵을 사용한다 (용도가 다르므로 섞이지 않게).
 */
const RESERVATION_MAX = 5;
const RESERVATION_WINDOW_MS = 10 * 60 * 1000; // 10분
const reservationAttempts = new Map();

function isReservationLimited(ip) {
  const record = reservationAttempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.firstAttemptAt > RESERVATION_WINDOW_MS) {
    reservationAttempts.delete(ip);
    return false;
  }
  return record.count >= RESERVATION_MAX;
}

function recordReservationSubmission(ip) {
  const record = reservationAttempts.get(ip);
  if (!record || Date.now() - record.firstAttemptAt > RESERVATION_WINDOW_MS) {
    reservationAttempts.set(ip, { count: 1, firstAttemptAt: Date.now() });
  } else {
    record.count += 1;
  }
}

module.exports = {
  isLocked,
  recordFailure,
  recordSuccess,
  MAX_ATTEMPTS,
  isReservationLimited,
  recordReservationSubmission,
  RESERVATION_MAX,
};
