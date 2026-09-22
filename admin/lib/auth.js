/**
 * 관리자 인증 유틸리티.
 * 비밀번호(평문)는 절대 저장/로깅하지 않고, bcrypt 해시(.env의 ADMIN_PASSWORD_HASH)와
 * 비교하는 용도로만 메모리에서 잠깐 사용합니다.
 */
const bcrypt = require("bcryptjs");

function verifyPassword(plainPassword) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error(
      "ADMIN_PASSWORD_HASH가 설정되지 않았습니다. `npm run set-admin-password -- \"비밀번호\"` 를 먼저 실행하세요."
    );
  }
  return bcrypt.compareSync(plainPassword, hash);
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: "로그인이 필요합니다." });
}

module.exports = { verifyPassword, requireAdmin };
