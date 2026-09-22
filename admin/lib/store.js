/**
 * 프로젝트 데이터 저장소.
 * data/projects.json 파일 하나를 단일 기준(source of truth)으로 사용하며
 * (초안 draft + 공개 published 모두 포함), 이 파일은 .gitignore에 등록되어
 * GitHub에는 올라가지 않습니다.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "projects.json");

const REQUIRED_FIELDS_FOR_PUBLISH = ["title", "role", "description", "date", "participants"];

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]\n", "utf-8");
  }
}

function readAll() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeAll(projects) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2) + "\n", "utf-8");
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

function createProject(input) {
  const projects = readAll();
  const now = new Date().toISOString();
  const project = {
    id: crypto_randomUUID(),
    title: (input.title || "").trim(),
    role: (input.role || "").trim(),
    description: (input.description || "").trim(),
    date: (input.date || "").trim(),
    participants: (input.participants || "").toString().trim(),
    notes: (input.notes || "").trim(),
    status: input.status === "published" ? "published" : "draft",
    createdAt: now,
    updatedAt: now,
  };

  const validationError = validateForStatus(project, project.status);
  if (validationError) {
    const err = new Error(validationError);
    err.statusCode = 400;
    throw err;
  }

  projects.push(project);
  writeAll(projects);
  return project;
}

function updateProject(id, input) {
  const projects = readAll();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    const err = new Error("해당 프로젝트를 찾을 수 없습니다.");
    err.statusCode = 404;
    throw err;
  }

  const updated = {
    ...projects[idx],
    title: (input.title || "").trim(),
    role: (input.role || "").trim(),
    description: (input.description || "").trim(),
    date: (input.date || "").trim(),
    participants: (input.participants || "").toString().trim(),
    notes: (input.notes || "").trim(),
    status: input.status === "published" ? "published" : "draft",
    updatedAt: new Date().toISOString(),
  };

  const validationError = validateForStatus(updated, updated.status);
  if (validationError) {
    const err = new Error(validationError);
    err.statusCode = 400;
    throw err;
  }

  projects[idx] = updated;
  writeAll(projects);
  return updated;
}

function deleteProject(id) {
  const projects = readAll();
  const next = projects.filter((p) => p.id !== id);
  if (next.length === projects.length) {
    const err = new Error("해당 프로젝트를 찾을 수 없습니다.");
    err.statusCode = 404;
    throw err;
  }
  writeAll(next);
  return true;
}

function deleteMany(ids) {
  const idSet = new Set(ids);
  const projects = readAll();
  const next = projects.filter((p) => !idSet.has(p.id));
  writeAll(next);
  return next;
}

// Node 14.17+ 에는 crypto.randomUUID가 전역이 아니라 require가 필요합니다.
function crypto_randomUUID() {
  return require("crypto").randomUUID();
}

module.exports = {
  DATA_FILE,
  readAll,
  writeAll,
  createProject,
  updateProject,
  deleteProject,
  deleteMany,
  validateForStatus,
};
