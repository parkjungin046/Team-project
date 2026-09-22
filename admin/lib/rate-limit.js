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

module.exports = { isLocked, recordFailure, recordSuccess, MAX_ATTEMPTS };
