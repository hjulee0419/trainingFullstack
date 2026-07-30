'use strict';

// BE-8 완료조건 검증: SIGTERM 수신 시 서버가 정상 종료(exit code 0)되고
// DB pool이 정리되는지 확인한다.
//
// 주의: Windows에서는 child_process.kill('SIGTERM'/'SIGINT')이 실제 POSIX 시그널을
// 전달하지 않고 프로세스를 즉시 강제 종료(TerminateProcess)한다(Node 공식 문서에
// 명시된 Windows 제약 — 우리 코드의 결함이 아니다). 이 때문에 자식 프로세스에 실제
// OS 시그널을 보내는 방식으로는 우리의 SIGTERM 핸들러(src/server.js)를 재현할 수
// 없다. 대신 spawn한 자식 프로세스 "안에서" -e 스크립트로 src/server.js를 require한
// 뒤 process.emit('SIGTERM')을 프로그램적으로 호출해, 핸들러 로직 자체(graceful
// shutdown: server.close → pool.end → exit 0)를 플랫폼 무관하게 검증한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { BACKEND_ROOT, DEV_DATABASE_URL } = require('../db/setup');

const SERVER_PATH = path.resolve(BACKEND_ROOT, 'src', 'server.js');
const serverExists = fs.existsSync(SERVER_PATH);

test(
  'src/server.js가 아직 없으면 skip',
  { skip: serverExists },
  () => {
    console.log('[graceful-shutdown.test] src/server.js가 아직 없어 skip 합니다.');
  }
);

test(
  'SIGTERM 수신 시 graceful shutdown으로 exit code 0 종료된다',
  { skip: !serverExists },
  async () => {
    const child = spawn(
      'node',
      [
        '-e',
        `
        process.env.PORT = '4099';
        require(${JSON.stringify(SERVER_PATH)});
        setTimeout(() => { process.emit('SIGTERM'); }, 300);
        `,
      ],
      {
        cwd: BACKEND_ROOT,
        env: { ...process.env, DATABASE_URL: DEV_DATABASE_URL },
      }
    );

    let stdout = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stdout += d.toString();
    });

    const { code } = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error(`graceful shutdown 타임아웃, 지금까지 출력:\n${stdout}`));
      }, 8000);
      child.on('exit', (exitCode) => {
        clearTimeout(timeout);
        resolve({ code: exitCode });
      });
    });

    console.log('[graceful-shutdown.test] 자식 프로세스 출력:\n', stdout);
    assert.equal(code, 0, `SIGTERM 후 exit code가 0이어야 함 (실제: ${code})`);
    assert.match(stdout, /SIGTERM 수신, graceful shutdown 시작/);
    assert.match(stdout, /DB pool 종료 완료, 프로세스 종료/);
  }
);
