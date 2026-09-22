/**
 * 저장소 선택 창구(facade).
 * DATABASE_URL 환경변수가 있으면 PostgreSQL(db-postgres.js)을,
 * 없으면 지금까지 쓰던 로컬 파일(db-file.js)을 사용한다.
 * server.js를 비롯한 나머지 코드는 이 차이를 몰라도 된다.
 */
const backend = process.env.DATABASE_URL ? require("./db-postgres") : require("./db-file");

module.exports = backend;
module.exports.isPostgres = Boolean(process.env.DATABASE_URL);
