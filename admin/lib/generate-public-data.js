/**
 * 관리자 페이지에서 "공개(published)" 상태인 프로젝트만 골라
 * 실제 웹사이트가 읽는 공개용 데이터 파일(data/public-projects.generated.js)을
 * 자동으로 다시 생성합니다.
 *
 * - 이 파일은 초안(draft)을 절대 포함하지 않으므로 안전하게 git에 커밋/배포할 수 있습니다.
 * - 반대로 원본 데이터(data/projects.json, 초안 포함)는 .gitignore에 의해 절대 커밋되지 않습니다.
 */
const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "..", "..", "data", "public-projects.generated.js");

function generatePublicDataFile(allProjects) {
  const published = allProjects
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

  const content = `/**
 * ⚠️ 자동 생성 파일입니다. 직접 수정하지 마세요.
 * 관리자 페이지(admin)에서 "공개"로 설정한 프로젝트만 이 파일에 반영됩니다.
 * 생성 시각: ${new Date().toISOString()}
 */
window.ADMIN_MANAGED_PROJECTS = ${JSON.stringify(published, null, 2)};
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, content, "utf-8");
}

module.exports = { generatePublicDataFile, OUTPUT_FILE };
