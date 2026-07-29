'use strict';

// pg Pool로부터 client를 얻어 트랜잭션(BEGIN/COMMIT/ROLLBACK)을 감싸 실행하는 헬퍼.
// 성공 시 COMMIT 후 fn의 반환값을 그대로 반환하고, 실패 시 ROLLBACK 후 원래 에러를 재throw한다.
// client는 finally에서 항상 반환(release)한다.

async function withTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };
