'use strict';

// dev/start 전에 PORT를 점유 중인 잔여(좀비) 프로세스를 강제 종료한다.
// 배경: Windows(git-bash)에서 `node src/server.js &` 후 `kill $!`로는 실제 node.exe가
// 종료되지 않는 경우가 있어, 이전 실행이 포트를 계속 점유한 채 새 프로세스는
// EADDRINUSE로 조용히 죽고 예전 프로세스가 계속 응답하는 문제가 있었다.
// npm의 "predev"/"prestart" 훅으로 항상 먼저 실행되어 이 문제를 원천 차단한다.

const { execSync } = require('child_process');

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const PORT = process.env.PORT || '3000';

function freePortWindows(port) {
  let output;
  try {
    output = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
  } catch (err) {
    return;
  }

  const pids = new Set();
  for (const line of output.split('\n')) {
    if (!line.includes(`:${port} `) && !line.includes(`:${port}\r`)) continue;
    if (!line.includes('LISTENING')) continue;
    const columns = line.trim().split(/\s+/);
    const pid = columns[columns.length - 1];
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`[free-port] 포트 ${port}을(를) 점유 중이던 잔여 프로세스(PID ${pid})를 종료했습니다.`);
    } catch (err) {
      console.log(`[free-port] PID ${pid} 종료 실패(이미 종료되었거나 권한 없음): ${err.message}`);
    }
  }
}

function freePortPosix(port) {
  let pidsOutput;
  try {
    pidsOutput = execSync(`lsof -i tcp:${port} -sTCP:LISTEN -t`, { encoding: 'utf8' });
  } catch (err) {
    return; // 점유 프로세스 없음
  }

  const pids = pidsOutput.split('\n').map((s) => s.trim()).filter(Boolean);
  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`[free-port] 포트 ${port}을(를) 점유 중이던 잔여 프로세스(PID ${pid})를 종료했습니다.`);
    } catch (err) {
      console.log(`[free-port] PID ${pid} 종료 실패: ${err.message}`);
    }
  }
}

if (process.platform === 'win32') {
  freePortWindows(PORT);
} else {
  freePortPosix(PORT);
}
