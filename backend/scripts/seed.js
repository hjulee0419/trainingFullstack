'use strict';

// DB-6 시드 스크립트: 개발/QA용 최소 더미 데이터를 생성한다.
// 정책: 기본 카테고리(is_default=true)는 실제 회원가입 API 트랜잭션(BE-2)과 동일한 순서로,
// "사용자 생성 -> 기본 카테고리 생성"을 하나의 트랜잭션 안에서 수행한다.
// (docs/7-execution-plan.md DB-3/DB-6 절, migrations/0002_create_categories.sql 정책 주석 참조)
// 실행: node scripts/seed.js

const bcrypt = require('bcrypt');
const { getPool } = require('../src/config/db.pool');

const SEED_USERS = [
  { email: 'seed.user1@example.com', password: 'Passw0rd!1', nickname: '시드유저1' },
  { email: 'seed.user2@example.com', password: 'Passw0rd!2', nickname: '시드유저2' },
  { email: 'seed.user3@example.com', password: 'Passw0rd!3', nickname: '시드유저3' },
];

const BCRYPT_SALT_ROUNDS = 10;
const DEFAULT_CATEGORY_NAME = '기본';

async function seedUser(client, { email, password, nickname }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const userResult = await client.query(
    `INSERT INTO users (email, password_hash, nickname)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, passwordHash, nickname]
  );

  if (userResult.rows.length === 0) {
    console.log(`[seed] 이미 존재하는 사용자, 건너뜀: ${email}`);
    return null;
  }

  const userId = userResult.rows[0].id;

  // 회원가입 트랜잭션과 동일하게, 사용자 생성 직후 같은 트랜잭션에서 기본 카테고리를 생성한다.
  await client.query(
    `INSERT INTO categories (user_id, name, is_default)
     VALUES ($1, $2, true)`,
    [userId, DEFAULT_CATEGORY_NAME]
  );

  console.log(`[seed] 사용자 생성 완료: ${email} (id=${userId}), 기본 카테고리 "${DEFAULT_CATEGORY_NAME}" 생성 완료`);

  return userId;
}

async function main() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const user of SEED_USERS) {
      await seedUser(client, user);
    }

    await client.query('COMMIT');
    console.log('[seed] 트랜잭션 커밋 완료.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] 에러 발생, 트랜잭션 롤백:', err);
    process.exitCode = 1;
    return;
  } finally {
    client.release();
  }

  // 검증: 시드된 각 사용자에 기본 카테고리가 정확히 1개씩 존재하는지 확인
  const { rows } = await pool.query(
    `SELECT user_id, count(*) AS cnt
     FROM categories
     WHERE is_default = true
     GROUP BY user_id
     HAVING count(*) <> 1`
  );

  if (rows.length > 0) {
    console.error('[seed] 검증 실패: 기본 카테고리가 1개가 아닌 사용자가 존재합니다:', rows);
    process.exitCode = 1;
  } else {
    console.log('[seed] 검증 완료: 모든 사용자의 기본 카테고리 개수가 정확히 1개입니다(위반 0건).');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('[seed] 실행 중 예외 발생:', err);
  process.exitCode = 1;
});
