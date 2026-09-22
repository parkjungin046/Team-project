/**
 * 관리자 비밀번호를 bcrypt로 해시하여 .env 파일에 저장하는 스크립트.
 *
 * 사용법:
 *   npm run set-admin-password -- "새비밀번호"
 *
 * - 입력한 평문 비밀번호는 어떤 파일에도 저장되지 않습니다.
 * - .env 파일에는 되돌릴 수 없는 bcrypt 해시값만 저장되며,
 *   .env는 .gitignore에 등록되어 있어 GitHub에는 절대 올라가지 않습니다.
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("사용법: npm run set-admin-password -- \"새비밀번호\"");
  process.exit(1);
}

const envPath = path.join(__dirname, "..", ".env");
const hash = bcrypt.hashSync(password, 12);

let lines = [];
if (fs.existsSync(envPath)) {
  lines = fs
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((line) => !line.startsWith("ADMIN_PASSWORD_HASH="));
}

// 기존에 ADMIN_PORT 등 다른 설정이 있으면 유지하고, 해시값만 갱신/추가
lines = lines.filter((line) => line.trim() !== "");
lines.unshift(`ADMIN_PASSWORD_HASH=${hash}`);

if (!lines.some((line) => line.startsWith("ADMIN_PORT="))) {
  lines.push("ADMIN_PORT=4300");
}

fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf-8");

console.log("✅ 관리자 비밀번호가 안전하게 해시되어 .env 파일에 저장되었습니다.");
console.log("   (.env는 .gitignore에 등록되어 있어 GitHub에는 업로드되지 않습니다)");
