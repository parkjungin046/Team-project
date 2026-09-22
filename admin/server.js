/**
 * 관리자 페이지 전용 로컬 백엔드 서버.
 *
 * - 반드시 로컬(127.0.0.1)에서만 열립니다. 외부(다른 컴퓨터)에서는 접속할 수 없습니다.
 * - 비밀번호는 절대 프론트엔드로 내려가지 않으며, bcrypt 해시와 서버 메모리 안에서만 비교됩니다.
 * - 로그인 세션은 "세션 쿠키"로만 관리되어, 브라우저를 완전히 닫으면 자동으로 사라집니다
 *   (쿠키에 만료 시간을 주지 않음 = 브라우저 종료 시 삭제).
 * - 서버를 재시작할 때마다 세션 암호화 키를 새로 생성하므로, 이전에 남아있던 세션은
 *   모두 무효화됩니다 (추가 보안 계층).
 */
require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");

const { verifyPassword, requireAdmin } = require("./lib/auth");
const { isLocked, recordFailure, recordSuccess, MAX_ATTEMPTS } = require("./lib/rate-limit");
const store = require("./lib/store");
const { findDuplicateGroups } = require("./lib/dedupe");
const { generatePublicDataFile } = require("./lib/generate-public-data");

const app = express();
const PORT = process.env.ADMIN_PORT || 4300;

// 서버가 켜질 때마다 새로 만드는 세션 비밀키 (재시작 시 기존 세션 전부 무효화)
const SESSION_SECRET = crypto.randomBytes(32).toString("hex");

app.disable("x-powered-by");
app.use(express.json());

app.use(
  session({
    name: "admin_sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // 자바스크립트에서 쿠키 값을 읽을 수 없음
      sameSite: "lax",
      secure: false, // 로컬 http 환경이므로 false (배포 시 https라면 true로)
      // maxAge를 지정하지 않음 = "세션 쿠키" = 브라우저를 닫으면 자동 삭제됨
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

function regeneratePublicData() {
  const all = store.readAll();
  generatePublicDataFile(all);
}

// 서버 시작 시 최신 상태로 한 번 동기화
regeneratePublicData();

/* -------------------------------------------------------------------- */
/* 인증                                                                    */
/* -------------------------------------------------------------------- */

app.post("/api/admin/login", (req, res) => {
  const ip = req.ip;

  if (isLocked(ip)) {
    return res
      .status(429)
      .json({ error: `로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요. (최대 ${MAX_ATTEMPTS}회)` });
  }

  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: "비밀번호를 입력하세요." });
  }

  let ok = false;
  try {
    ok = verifyPassword(password);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  if (!ok) {
    recordFailure(ip);
    return res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
  }

  recordSuccess(ip);
  req.session.isAdmin = true;
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("admin_sid");
    res.json({ ok: true });
  });
});

app.get("/api/admin/session", (req, res) => {
  res.json({ loggedIn: Boolean(req.session && req.session.isAdmin) });
});

/* -------------------------------------------------------------------- */
/* 프로젝트 CRUD (모두 로그인 필요)                                        */
/* -------------------------------------------------------------------- */

app.get("/api/admin/projects", requireAdmin, (req, res) => {
  const projects = store.readAll().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ projects });
});

app.post("/api/admin/projects", requireAdmin, (req, res) => {
  try {
    const project = store.createProject(req.body || {});
    regeneratePublicData();
    res.status(201).json({ project });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.put("/api/admin/projects/:id", requireAdmin, (req, res) => {
  try {
    const project = store.updateProject(req.params.id, req.body || {});
    regeneratePublicData();
    res.json({ project });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.delete("/api/admin/projects/:id", requireAdmin, (req, res) => {
  try {
    store.deleteProject(req.params.id);
    regeneratePublicData();
    res.json({ ok: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------- */
/* 중복 프로젝트 탐지 / 정리                                                */
/* -------------------------------------------------------------------- */

app.get("/api/admin/duplicates", requireAdmin, (req, res) => {
  const projects = store.readAll();
  const groups = findDuplicateGroups(projects);
  res.json({ groups });
});

// 중복 그룹 중 keepId만 남기고 나머지는 삭제 (= 통합)
app.post("/api/admin/duplicates/resolve", requireAdmin, (req, res) => {
  const { keepId, removeIds } = req.body || {};
  if (!keepId || !Array.isArray(removeIds)) {
    return res.status(400).json({ error: "keepId와 removeIds가 필요합니다." });
  }
  store.deleteMany(removeIds.filter((id) => id !== keepId));
  regeneratePublicData();
  res.json({ ok: true });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`\n✅ 관리자 페이지가 실행되었습니다: http://localhost:${PORT}`);
  console.log("   (이 컴퓨터에서만 접속 가능하며, 외부에는 노출되지 않습니다)\n");
});
