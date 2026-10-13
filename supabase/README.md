# DB 연결 작업 (Supabase)

이 폴더는 `feature/db-connection` 브랜치에서 진행하는 Supabase 연동 작업 공간이다.

## 연결 방법 (코드 변경 최소화)

`admin/lib/db-postgres.js`가 이미 표준 `pg` 라이브러리로 `DATABASE_URL` 환경변수에 접속하고
있다. Supabase가 주는 Postgres 커넥션 문자열(Settings → Database → Connection string)도
표준 Postgres 접속 정보이므로, **`DATABASE_URL`만 Supabase 쪽으로 바꾸면 코드 수정 없이
그대로 연결된다.** (`admin/lib/store.js`가 `DATABASE_URL` 존재 여부로 파일 저장소/Postgres를
자동 전환한다.)

## 진행 순서

1. [migrations/20261013000000_init_projects_reservations.sql](migrations/20261013000000_init_projects_reservations.sql)
   — 이미 범위가 확정된 `projects`, `reservations` 테이블. Supabase SQL Editor에
   그대로 붙여넣어 실행하면 됨. `admin/lib/db-postgres.js`의 `init()`이 만드는 스키마와
   동일하다.
2. 로컬 `.env`(gitignore 대상, 커밋되지 않음)에 Supabase 커넥션 문자열을
   `DATABASE_URL=...` 형태로 넣고 `npm run admin`으로 로컬에서 연결 확인.
3. 확인되면 Render 대시보드의 `portfolio-admin` 서비스 환경변수 `DATABASE_URL`도
   동일한 값으로 교체 (또는 Render 자체를 걷어내고 다른 곳에 배포할지는 별도 결정 필요).
4. 기존 Render Postgres에 실데이터가 있다면 `pg_dump`/`pg_restore`로 이전.

## 아직 정해지지 않은 것 (보류)

- [migrations/02_future_tables.sql.example](migrations/02_future_tables.sql.example) —
  `career_items`(자격증·대외활동·수상), `skill_categories`/`skill_items`(기술 스택),
  `contact_messages`(문의 폼) 제안 스키마. 테이블만 만든다고 끝나는 게 아니라 관리자
  페이지에 CRUD 화면도 새로 만들어야 의미가 있어서, 이번 1단계 범위에는 포함하지 않았다.
  범위가 확정되면 `.sql.example` → `.sql`로 바꾸고 `migrations/`에 정식 번호를 매겨 추가한다.
- `site_profile`(이름/소개문 등)은 거의 바뀌지 않는 "설정값" 성격이라 테이블화가
  꼭 필요한지부터 결정 필요 (지금처럼 `portfolio-data.js`에 두는 것도 유효한 선택).

## 공개/비공개 기준 (테이블 생성 시 참고)

| 테이블 | 공개(공개 API 노출) | 비공개(관리자 전용) |
|---|---|---|
| projects | id, title, role, description, date, participants, notes (status='published'인 행만) | status, created_at, updated_at |
| reservations | date, time만 (status<>'cancelled'인 행만) | id, name, email, purpose, status, created_at, updated_at |

이 구분은 DB 컬럼 자체에 플래그를 두는 게 아니라, `admin/server.js`의 공개 API 라우트가
응답에 포함할 컬럼을 직접 골라서 내려주는 방식으로 구현되어 있다 (이미 `/api/projects`,
`/api/reservations/booked`가 이렇게 동작함). Supabase로 옮긴 뒤에도 이 Express 레이어를
그대로 유지하면 별도 작업 없이 동일하게 적용된다.
