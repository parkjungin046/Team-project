-- ============================================================================
-- DB 연결 1단계: 이미 코드에 스키마가 있는 테이블(projects, reservations)만 먼저 생성.
-- admin/lib/db-postgres.js의 init()이 만드는 테이블과 완전히 동일하다 — 코드 변경 없이
-- DATABASE_URL만 이 Supabase 프로젝트의 커넥션 문자열로 바꾸면 그대로 붙는다.
--
-- career_items / skill_categories / skill_items / contact_messages는 관리자 CRUD
-- 화면을 같이 만들지 범위가 아직 정해지지 않아 이번 마이그레이션에서는 제외했다.
-- (대화에서 제안했던 스키마는 02_future_tables.sql.example 참고)
-- ============================================================================

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

-- 취소되지 않은 예약끼리는 같은 날짜·시간을 가질 수 없다 (중복 예약 방지, DB 차원 강제).
CREATE UNIQUE INDEX IF NOT EXISTS reservations_active_date_time_idx
  ON reservations (date, time)
  WHERE status <> 'cancelled';
