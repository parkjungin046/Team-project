/**
 * PostgreSQL 기반 저장소 (Render 등에 배포해서 DATABASE_URL 환경변수가 있을 때 사용).
 * 로컬 파일(db-file.js)과 완전히 같은 함수 이름/반환 형태를 제공해서,
 * server.js 쪽 코드는 어떤 저장소를 쓰는지 신경 쓰지 않아도 된다.
 */
const crypto = require("crypto");
const { Pool } = require("pg");
const { normalizeInput, assertValid, notFoundError } = require("./validate");
const {
  normalizeReservationInput,
  assertValidReservation,
  assertValidStatus,
  notFoundError: reservationNotFoundError,
  conflictError,
} = require("./validate-reservation");

const UNIQUE_VIOLATION = "23505"; // PostgreSQL 에러 코드: unique 제약 위반

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render의 관리형 PostgreSQL은 자체 서명 인증서를 쓰므로 rejectUnauthorized를 꺼야 접속된다.
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

const SELECT_COLUMNS = `
  id, title, role, description, date, participants, notes, status,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

const RESERVATION_COLUMNS = `
  id, name, email, date, time, purpose, status,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      participants TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      time TEXT NOT NULL DEFAULT '',
      purpose TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'received',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 취소되지 않은 예약끼리는 같은 날짜·시간을 가질 수 없도록 DB 차원에서 강제한다.
  // (동시에 두 요청이 들어와도 둘 중 하나는 반드시 이 제약에 걸려 실패하므로, 경쟁 상태로
  // 인한 중복 예약이 원천적으로 불가능하다.)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS reservations_active_date_time_idx
    ON reservations (date, time)
    WHERE status <> 'cancelled';
  `);
}

async function readAll() {
  const { rows } = await pool.query(`SELECT ${SELECT_COLUMNS} FROM projects`);
  return rows;
}

async function createProject(input) {
  const data = normalizeInput(input);
  assertValid(data, data.status);

  const id = crypto.randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO projects (id, title, role, description, date, participants, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
     RETURNING ${SELECT_COLUMNS}`,
    [id, data.title, data.role, data.description, data.date, data.participants, data.notes, data.status]
  );
  return rows[0];
}

async function updateProject(id, input) {
  const data = normalizeInput(input);
  assertValid(data, data.status);

  const { rows } = await pool.query(
    `UPDATE projects
     SET title = $2, role = $3, description = $4, date = $5, participants = $6, notes = $7, status = $8, updated_at = now()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [id, data.title, data.role, data.description, data.date, data.participants, data.notes, data.status]
  );
  if (rows.length === 0) throw notFoundError();
  return rows[0];
}

async function deleteProject(id) {
  const { rowCount } = await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
  if (rowCount === 0) throw notFoundError();
  return true;
}

async function deleteMany(ids) {
  if (ids.length > 0) {
    await pool.query(`DELETE FROM projects WHERE id = ANY($1::uuid[])`, [ids]);
  }
  return readAll();
}

/* -------------------------------------------------------------------- */
/* 방문 예약 (reservations)                                               */
/* -------------------------------------------------------------------- */

async function readAllReservations() {
  const { rows } = await pool.query(`SELECT ${RESERVATION_COLUMNS} FROM reservations ORDER BY created_at DESC`);
  return rows;
}

// 취소되지 않은 예약들의 날짜·시간만 추려서 돌려준다 (공개 API, 예약 폼의 중복 선택 방지용).
async function readBookedSlots() {
  const { rows } = await pool.query(`SELECT date, time FROM reservations WHERE status <> 'cancelled'`);
  return rows;
}

async function createReservation(input) {
  const data = normalizeReservationInput(input);
  const candidate = { ...data, status: "received" };
  assertValidReservation(candidate);

  const id = crypto.randomUUID();
  try {
    const { rows } = await pool.query(
      `INSERT INTO reservations (id, name, email, date, time, purpose, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'received', now(), now())
       RETURNING ${RESERVATION_COLUMNS}`,
      [id, data.name, data.email, data.date, data.time, data.purpose]
    );
    return rows[0];
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw conflictError();
    throw err;
  }
}

async function updateReservationStatus(id, status) {
  assertValidStatus(status);
  try {
    const { rows } = await pool.query(
      `UPDATE reservations SET status = $2, updated_at = now() WHERE id = $1 RETURNING ${RESERVATION_COLUMNS}`,
      [id, status]
    );
    if (rows.length === 0) throw reservationNotFoundError();
    return rows[0];
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw conflictError();
    throw err;
  }
}

module.exports = {
  init,
  readAll,
  createProject,
  updateProject,
  deleteProject,
  deleteMany,
  readAllReservations,
  readBookedSlots,
  createReservation,
  updateReservationStatus,
};
