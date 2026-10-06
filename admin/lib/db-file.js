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
} = require("./validate-reservation");

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

  reservations.push(reservation);
  writeAllReservationsSync(reservations);
  return reservation;
}

async function updateReservationStatus(id, status) {
  assertValidStatus(status);
  const reservations = readAllReservationsSync();
  const idx = reservations.findIndex((r) => r.id === id);
  if (idx === -1) throw reservationNotFoundError();

  const updated = { ...reservations[idx], status, updatedAt: new Date().toISOString() };
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
  createReservation,
  updateReservationStatus,
};
