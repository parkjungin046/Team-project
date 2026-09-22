/**
 * 파일 저장소(db-file.js)와 PostgreSQL 저장소(db-postgres.js)가 공통으로 쓰는
 * 검증 로직. 두 백엔드가 서로 다른 기준으로 어긋나지 않도록 한 곳에서만 관리한다.
 */
const REQUIRED_FIELDS_FOR_PUBLISH = ["title", "role", "description", "date", "participants"];

function normalizeInput(input) {
  return {
    title: (input.title || "").trim(),
    role: (input.role || "").trim(),
    description: (input.description || "").trim(),
    date: (input.date || "").trim(),
    participants: (input.participants || "").toString().trim(),
    notes: (input.notes || "").trim(),
    status: input.status === "published" ? "published" : "draft",
  };
}

function validateForStatus(project, status) {
  if (status !== "published") return null;
  const missing = REQUIRED_FIELDS_FOR_PUBLISH.filter((field) => {
    const value = project[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
  if (missing.length > 0) {
    return `공개하려면 다음 항목을 모두 입력해야 합니다: ${missing.join(", ")}`;
  }
  return null;
}

function assertValid(project, status) {
  const error = validateForStatus(project, status);
  if (error) {
    const err = new Error(error);
    err.statusCode = 400;
    throw err;
  }
}

function notFoundError() {
  const err = new Error("해당 프로젝트를 찾을 수 없습니다.");
  err.statusCode = 404;
  return err;
}

module.exports = { REQUIRED_FIELDS_FOR_PUBLISH, normalizeInput, validateForStatus, assertValid, notFoundError };
