'use strict';

// DB-5 검증 스크립트: todos 테이블의 인덱스 3개가 실제로 존재하고,
// 각 인덱스의 선행 컬럼이 user_id인지 pg_indexes 조회로 확인한다.
// 실행: node scripts/verify-indexes.js

const { getPool } = require('../src/config/db.pool');

const EXPECTED_INDEXES = [
  'idx_todos_user_id_category_id',
  'idx_todos_user_id_is_completed',
  'idx_todos_user_id_end_date',
];

async function main() {
  const pool = getPool();

  console.log('[verify-indexes] todos 테이블 인덱스 조회 중...');

  const { rows } = await pool.query(
    `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = $1 ORDER BY indexname`,
    ['todos']
  );

  console.log(`[verify-indexes] pg_indexes에서 발견된 todos 인덱스 수: ${rows.length}`);

  let allOk = true;

  for (const indexName of EXPECTED_INDEXES) {
    const found = rows.find((r) => r.indexname === indexName);

    if (!found) {
      console.error(`[verify-indexes] 누락: 인덱스 "${indexName}"이(가) 존재하지 않습니다.`);
      allOk = false;
      continue;
    }

    // indexdef 예: CREATE INDEX idx_todos_user_id_category_id ON public.todos USING btree (user_id, category_id)
    const columnListMatch = found.indexdef.match(/\(([^)]+)\)/);
    const firstColumn = columnListMatch ? columnListMatch[1].split(',')[0].trim() : null;

    const leadingColumnOk = firstColumn === 'user_id';

    console.log(`[verify-indexes] ${indexName}`);
    console.log(`  indexdef: ${found.indexdef}`);
    console.log(`  선행 컬럼: ${firstColumn} (${leadingColumnOk ? 'user_id 확인' : 'user_id 아님!'})`);

    if (!leadingColumnOk) {
      allOk = false;
    }
  }

  await pool.end();

  if (!allOk) {
    console.error('[verify-indexes] 검증 실패: 위 로그를 확인하세요.');
    process.exitCode = 1;
    return;
  }

  console.log('[verify-indexes] 검증 완료: todos 인덱스 3개 모두 존재하며 선행 컬럼이 user_id입니다.');
}

main().catch((err) => {
  console.error('[verify-indexes] 검증 중 에러 발생:', err);
  process.exitCode = 1;
});
