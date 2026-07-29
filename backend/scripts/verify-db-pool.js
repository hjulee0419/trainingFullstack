'use strict';

// DB-4 검증 스크립트: pg Pool을 생성해 SELECT 1을 실행하고,
// pool.end() 이후 커넥션이 정상적으로 반환/종료되는지(누수 없음) 확인한다.
// 실행: node scripts/verify-db-pool.js

const { getPool } = require('../src/config/db.pool');

async function main() {
  const pool = getPool();

  console.log('[verify-db-pool] Pool 생성 완료. SELECT 1 실행 시도...');

  const result = await pool.query('SELECT 1 AS ok');
  const ok = result.rows[0].ok === 1;

  if (!ok) {
    console.error('[verify-db-pool] SELECT 1 결과가 예상과 다릅니다:', result.rows);
    process.exitCode = 1;
    return;
  }

  console.log('[verify-db-pool] SELECT 1 성공:', result.rows[0]);
  console.log('[verify-db-pool] 현재 Pool 상태 - total:', pool.totalCount, 'idle:', pool.idleCount, 'waiting:', pool.waitingCount);

  await pool.end();

  console.log('[verify-db-pool] pool.end() 완료. 남은 커넥션 총계:', pool.totalCount, '(0이어야 누수 없음)');

  if (pool.totalCount !== 0) {
    console.error('[verify-db-pool] 경고: pool.end() 이후에도 커넥션이 남아있습니다.');
    process.exitCode = 1;
    return;
  }

  console.log('[verify-db-pool] 검증 완료: Pool 생성/쿼리/종료 모두 정상.');
}

main().catch((err) => {
  console.error('[verify-db-pool] 검증 중 에러 발생:', err);
  process.exitCode = 1;
});
