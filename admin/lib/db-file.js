/**
 * 로컬 파일 기반 저장소 (DATABASE_URL이 없을 때 사용 — 지금까지 쓰던 방식 그대로).
 * data/projects.json 하나를 단일 기준으로 사용하며, .gitignore에 등록되어
 * GitHub에는 올라가지 않는다.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { normalizeInput, assertValid, notFoundError } = require("./validate");
const {
  normalizeReservationInput,
  assertValidReservation,
  assertValidStatus,
  notFoundError: reservationNotFoundError,
  conflictError,
} = require("./validate-reservation");

// 같은 날짜·시간에 취소되지 않은 예약이 이미 있는지 확인 (excludeId: 본인 수정 시 자기 자신은 제외)
function hasActiveConflict(reservations, date, time, excludeId) {
  return reservations.some(
    (r) => r.id !== excludeId && r.date === date && r.time === time && r.status !== "cancelled"
  );
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "projects.json");
const RESERVATIONS_FILE = path.join(DATA_DIR, "reservations.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]\n", "utf-8");
  }
  if (!fs.existsSync(RESERVATIONS_FILE)) {
    fs.writeFileSync(RESERVATIONS_FILE, "[]\n", "utf-8");
  }
}

function readAllSync() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeAllSync(projects) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2) + "\n", "utf-8");
}

function readAllReservationsSync() {
  ensureStore();
  const raw = fs.readFileSync(RESERVATIONS_FILE, "utf-8");
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeAllReservationsSync(reservations) {
  ensureStore();
  fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(reservations, null, 2) + "\n", "utf-8");
}

async function init() {
  ensureStore();
}

async function readAll() {
  return readAllSync();
}

async function createProject(input) {
  const projects = readAllSync();
  const now = new Date().toISOString();
  const project = {
    id: crypto.randomUUID(),
    ...normalizeInput(input),
    createdAt: now,
    updatedAt: now,
  };

  assertValid(project, project.status);

  projects.push(project);
  writeAllSync(projects);
  return project;
}

async function updateProject(id, input) {
  const projects = readAllSync();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw notFoundError();

  const updated = {
    ...projects[idx],
    ...normalizeInput(input),
    updatedAt: new Date().toISOString(),
  };

  assertValid(updated, updated.status);

  projects[idx] = updated;
  writeAllSync(projects);
  return updated;
}

async function deleteProject(id) {
  const projects = readAllSync();
  const next = projects.filter((p) => p.id !== id);
  if (next.length === projects.length) throw notFoundError();
  writeAllSync(next);
  return true;
}

async function deleteMany(ids) {
  const idSet = new Set(ids);
  const projects = readAllSync();
  const next = projects.filter((p) => !idSet.has(p.id));
  writeAllSync(next);
  return next;
}

/* -------------------------------------------------------------------- */
/* 방문 예약 (reservations)                                               */
/* -------------------------------------------------------------------- */

async function readAllReservations() {
  return readAllReservationsSync();
}

// 취소되지 않은 예약들의 날짜·시간만 추려서 돌려준다 (공개 API, 예약 폼의 중복 선택 방지용).
async function readBookedSlots() {
  return readAllReservationsSync()
    .filter((r) => r.status !== "cancelled")
    .map((r) => ({ date: r.date, time: r.time }));
}

async function createReservation(input) {
  const reservations = readAllReservationsSync();
  const now = new Date().toISOString();
  const reservation = {
    id: crypto.randomUUID(),
    ...normalizeReservationInput(input),
    status: "received",
    createdAt: now,
    updatedAt: now,
  };

  assertValidReservation(reservation);

  // 동시에 같은 날짜·시간으로 두 건이 만들어지지 않도록 저장 직전에 다시 한번 확인한다.
  // (파일 저장소는 동기 함수로만 동작하므로, 이 함수 안에서는 다른 요청이 끼어들 수 없다.)
  if (hasActiveConflict(reservations, reservation.date, reservation.time)) {
    throw conflictError();
  }

  reservations.push(reservation);
  writeAllReservationsSync(reservations);
  return reservation;
}

async function updateReservationStatus(id, status) {
  assertValidStatus(status);
  const reservations = readAllReservationsSync();
  const idx = reservations.findIndex((r) => r.id === id);
  if (idx === -1) throw reservationNotFoundError();

  const current = reservations[idx];
  // "취소"에서 "접수/확정"으로 되돌릴 때도, 그 사이 같은 시간에 다른 예약이 생겼을 수 있으므로 확인한다.
  if (status !== "cancelled" && hasActiveConflict(reservations, current.date, current.time, id)) {
    throw conflictError();
  }

  const updated = { ...current, status, updatedAt: new Date().toISOString() };
  reservations[idx] = updated;
  writeAllReservationsSync(reservations);
  return updated;
}

module.exports = {
  init,
  readAll,
  createProject,
  updateProject,
  deleteProject,
  deleteMany,
  DATA_FILE,
  readAllReservations,
  readBookedSlots,
  createReservation,
  updateReservationStatus,
};
