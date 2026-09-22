/**
 * PostgreSQL 기반 저장소 (Render 등에 배포해서 DATABASE_URL 환경변수가 있을 때 사용).
 * 로컬 파일(db-file.js)과 완전히 같은 함수 이름/반환 형태를 제공해서,
 * server.js 쪽 코드는 어떤 저장소를 쓰는지 신경 쓰지 않아도 된다.
 */
const crypto = require("crypto");
const { Pool } = require("pg");
const { normalizeInput, assertValid, notFoundError } = require("./validate");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render의 관리형 PostgreSQL은 자체 서명 인증서를 쓰므로 rejectUnauthorized를 꺼야 접속된다.
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

const SELECT_COLUMNS = `
  id, title, role, description, date, participants, notes, status,
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

module.exports = { init, readAll, createProject, updateProject, deleteProject, deleteMany };
