'use strict';

const env = require('./config/env');
const app = require('./app');
const { getPool } = require('./config/db.pool');

const server = app.listen(env.PORT, () => {
  console.log(`[server] TodoList backend listening on port ${env.PORT} (env: ${env.NODE_ENV})`);
});

// 포트 충돌(EADDRINUSE) 등 기동 실패를 애매하게 넘기지 않고 명확히 실패시킨다.
// 이전 실행이 남긴 좀비 프로세스가 포트를 점유한 채 계속 응답하는 바람에 새 서버가
// 조용히 죽고 옛 프로세스를 새 서버로 착각하는 사고를 방지하기 위함이다.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[server] 포트 ${env.PORT}이(가) 이미 사용 중입니다. 이전 서버 프로세스가 종료되지 않았을 수 있습니다. ` +
        `'npm run dev'/'npm start'는 predev/prestart 훅(scripts/free-port.js)이 자동으로 정리하지만, ` +
        `직접 'node src/server.js'로 실행했다면 기존 프로세스를 먼저 종료하세요.`
    );
  } else {
    console.error('[server] 서버 기동 중 오류:', err);
  }
  process.exit(1);
});

// 배포 준비(BE-8): SIGTERM/SIGINT 수신 시 신규 요청을 받지 않고 기존 요청 처리를 마친 뒤
// DB Pool을 정리하고 종료한다(무중단 배포/컨테이너 재시작 시 강제 종료로 인한 요청 유실 방지).
function gracefulShutdown(signal) {
  console.log(`[server] ${signal} 수신, graceful shutdown 시작`);
  server.close((err) => {
    if (err) {
      console.error('[server] 서버 종료 중 오류:', err);
      process.exit(1);
      return;
    }
    getPool()
      .end()
      .then(() => {
        console.log('[server] DB pool 종료 완료, 프로세스 종료');
        process.exit(0);
      })
      .catch((poolErr) => {
        console.error('[server] DB pool 종료 중 오류:', poolErr);
        process.exit(1);
      });
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
