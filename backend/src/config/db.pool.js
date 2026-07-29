'use strict';

// pg Pool 싱글턴.
// 이 프로세스 전체에서 단 하나의 Pool 인스턴스만 생성/공유한다(재사용).
// 값 근거는 각 옵션 옆 주석 참조. 최종 근거 요약은 backend/docs/db-handoff.md 참고.

const { Pool } = require('pg');
const env = require('./env');

let poolInstance = null;

function createPool() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,

    // MVP는 1인 개발 기준 단일 인스턴스(로컬 PostgreSQL) 운영을 전제로 한다.
    // PRD 6.1의 "1000명 동시 접속 시 p95 800ms" 목표는 별도 스케일링 단계(추후 커넥션 풀러/리드 레플리카 도입)에서
    // 다시 튜닝하기로 하고, 지금은 단일 로컬 인스턴스가 감당 가능한 보수적인 값으로 시작한다.
    max: env.DB_POOL_MAX, // 10: 로컬 단일 Postgres 인스턴스의 max_connections(기본 100) 대비 여유를 두면서
    // 동시성 있는 요청을 처리할 수 있는 보수적 상한. 과도하게 크면 단일 인스턴스에 부담,
    // 과도하게 작으면 목록 조회 등 동시 요청 시 대기 큐가 길어져 PRD 6.1의 평균 300ms 목표에 위협이 된다.

    idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS, // 30000(30초): 유휴 커넥션을 오래 들고 있지 않고 반환해
    // 커넥션 누수를 방지하되, 너무 짧으면 매 요청마다 재연결 비용(핸드셰이크/인증)이 반복 발생해
    // PRD 6.1의 응답 시간 목표에 불리하다. 30초는 짧은 개발 세션 내 재사용성과 자원 반환의 균형점이다.

    connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS, // 2000(2초): 커넥션 획득 대기 상한.
    // PRD 6.1의 p95 800ms 목표를 고려하면, 커넥션 대기만으로 800ms를 넘기지 않도록
    // 충분히 짧게 설정해 장애 시 빠르게 실패(fail fast)하고 재시도/에러 응답으로 전환하게 한다.
  });

  pool.on('error', (err) => {
    // 유휴 커넥션에서 발생하는 예기치 못한 에러(예: 네트워크 단절)를 로깅한다.
    // 이 핸들러가 없으면 Node 프로세스 전체가 uncaughtException으로 죽을 수 있다.
    console.error('[db.pool] 예기치 못한 유휴 커넥션 에러:', err);
  });

  return pool;
}

function getPool() {
  if (!poolInstance) {
    poolInstance = createPool();
  }
  return poolInstance;
}

module.exports = { getPool };
