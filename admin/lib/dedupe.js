/**
 * 중복 프로젝트 탐지 로직.
 * 복잡한 유사도 계산 없이, 제목을 정규화(공백 제거, 소문자 변환)해서
 * 같은 제목을 가진 프로젝트끼리 그룹으로 묶는 단순한 방식만 사용합니다.
 */
function normalizeTitle(title) {
  return (title || "").trim().toLowerCase().replace(/\s+/g, "");
}

function findDuplicateGroups(projects) {
  const groups = new Map();

  for (const project of projects) {
    const key = normalizeTitle(project.title);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(project);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

module.exports = { normalizeTitle, findDuplicateGroups };
