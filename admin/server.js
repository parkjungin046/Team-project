/**
 * 관리자 페이지 백엔드 서버.
 *
 * 두 가지 방식으로 실행할 수 있다.
 *   1) 로컬 전용 (기본값): DATABASE_URL이 없으면 127.0.0.1에서만 열리고,
 *      데이터는 data/projects.json 파일에 저장된다.
 *   2) Render 등 온라인 배포: DATABASE_URL(PostgreSQL 연결 문자열)이 있으면
 *      0.0.0.0에서 열리고, 데이터는 PostgreSQL에 저장된다. 공개 사이트가
 *      실시간으로 읽어갈 수 있도록 인증이 필요 없는 GET /api/projects도 제공한다.
 *
 * 공통 보안 원칙은 두 방식 모두 동일하게 적용된다.
 * - 비밀번호는 절대 프론트엔드로 내려가지 않으며, bcrypt 해시와 서버 메모리 안에서만 비교된다.
 * - 로그인 세션은 "세션 쿠키"로만 관리되어, 브라우저를 완전히 닫으면 자동으로 사라진다
 *   (쿠키에 만료 시간을 주지 않음 = 브라우저 종료 시 삭제).
 * - 서버를 재시작할 때마다 세션 암호화 키를 새로 생성하므로, 이전에 남아있던 세션은
 *   모두 무효화된다 (추가 보안 계층).
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
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || process.env.ADMIN_PORT || 4300;
const HOST = process.env.HOST || (IS_PRODUCTION ? "0.0.0.0" : "127.0.0.1");

// 서버가 켜질 때마다 새로 만드는 세션 비밀키 (재시작 시 기존 세션 전부 무효화)
const SESSION_SECRET = crypto.randomBytes(32).toString("hex");

app.disable("x-powered-by");

// Render 등은 프록시(로드밸런서)가 https를 처리하고 내부적으로는 http로 전달하므로,
// "이 요청이 원래 https였는지"를 프록시가 붙인 헤더로 판단하도록 설정해야
// 세션 쿠키의 secure 옵션과 req.ip(레이트리밋)가 올바르게 동작한다.
if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

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
      secure: IS_PRODUCTION, // 로컬(http)에서는 false, Render 배포(https)에서는 true
      // maxAge를 지정하지 않음 = "세션 쿠키" = 브라우저를 닫으면 자동 삭제됨
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

async function regeneratePublicData() {
  try {
    const all = await store.readAll();
    generatePublicDataFile(all);
  } catch (err) {
    // 파일 기록 실패는 부가 기능(git 배포용 스냅샷)이므로, 이것 때문에 API 자체가
    // 실패해서는 안 된다. 로그만 남기고 넘어간다.
    console.warn("공개용 데이터 파일 생성 실패:", err.message);
  }
}

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

app.get("/api/admin/projects", requireAdmin, async (req, res) => {
  try {
    const projects = (await store.readAll()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/projects", requireAdmin, async (req, res) => {
  try {
    const project = await store.createProject(req.body || {});
    await regeneratePublicData();
    res.status(201).json({ project });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.put("/api/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    const project = await store.updateProject(req.params.id, req.body || {});
    await regeneratePublicData();
    res.json({ project });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.delete("/api/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    await store.deleteProject(req.params.id);
    await regeneratePublicData();
    res.json({ ok: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------- */
/* 중복 프로젝트 탐지 / 정리                                                */
/* -------------------------------------------------------------------- */

app.get("/api/admin/duplicates", requireAdmin, async (req, res) => {
  try {
    const projects = await store.readAll();
    const groups = findDuplicateGroups(projects);
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 중복 그룹 중 keepId만 남기고 나머지는 삭제 (= 통합)
app.post("/api/admin/duplicates/resolve", requireAdmin, async (req, res) => {
  const { keepId, removeIds } = req.body || {};
  if (!keepId || !Array.isArray(removeIds)) {
    return res.status(400).json({ error: "keepId와 removeIds가 필요합니다." });
  }
  try {
    await store.deleteMany(removeIds.filter((id) => id !== keepId));
    await regeneratePublicData();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------- */
/* 공개 API (로그인 불필요) — 실제 웹사이트가 실시간으로 가져가는 용도.       */
/* 온라인(Render 등)에 배포했을 때만 의미가 있다. 로컬 전용으로 쓸 때는       */
/* 공개 사이트가 이 주소를 모르므로 그냥 무시된다.                          */
/* -------------------------------------------------------------------- */

app.get("/api/projects", async (req, res) => {
  try {
    const all = await store.readAll();
    const published = all
      .filter((p) => p.status === "published")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map(({ id, title, role, description, date, participants, notes }) => ({
        id,
        title,
        role,
        description,
        date,
        participants,
        notes,
      }));
    // 공개 API이므로 다른 도메인(정적 사이트)에서도 호출할 수 있게 허용
    res.set("Access-Control-Allow-Origin", "*");
    res.json({ projects: published });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, storage: store.isPostgres ? "postgres" : "file" });
});

async function start() {
  await store.init();
  await regeneratePublicData(); // 서버 시작 시 최신 상태로 한 번 동기화

  app.listen(PORT, HOST, () => {
    const displayHost = HOST === "0.0.0.0" ? "0.0.0.0 (외부 접속 허용)" : "127.0.0.1 (이 컴퓨터에서만 접속 가능)";
    console.log(`\n✅ 관리자 페이지가 실행되었습니다: http://localhost:${PORT}`);
    console.log(`   바인딩: ${displayHost}`);
    console.log(`   데이터 저장소: ${store.isPostgres ? "PostgreSQL" : "로컬 파일(data/projects.json)"}\n`);
  });
}

start().catch((err) => {
  console.error("서버 시작 실패:", err);
  process.exit(1);
});
