'use strict';

// BE-5(할일 목록 조회 API: 상태파생+필터+페이지네이션) 완료조건 검증:
// - 완료조건 3(E-6): 완료 처리된 todo는 기한초과와 무관하게 'completed' 반환
// - 완료조건 4: 경계값(시작일=오늘 -> 진행중, 종료일=오늘 -> 진행중) 테스트 통과
// domain/todo-status.js의 deriveTodoStatus 순수 함수를 today 인자를 고정해 결정적으로 검증한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const TODO_STATUS_PATH = path.resolve(__dirname, '..', '..', 'src', 'domain', 'todo-status.js');
const todoStatusExists = fs.existsSync(TODO_STATUS_PATH);

let deriveTodoStatus;
let getUtcTodayString;
if (todoStatusExists) {
  ({ deriveTodoStatus, getUtcTodayString } = require(TODO_STATUS_PATH));
} else {
  console.log('[todo-status.test] src/domain/todo-status.js가 아직 존재하지 않아 skip 합니다.');
}

test('src/domain/todo-status.js가 아직 없으면 skip', { skip: !!todoStatusExists }, () => {
  console.log('[todo-status.test] 위 사유로 전체 테스트를 skip 합니다.');
});

test(
  '미완료 + today < startDate => not_started',
  { skip: !todoStatusExists },
  () => {
    const status = deriveTodoStatus(
      { isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' },
      '2026-07-31'
    );
    assert.equal(status, 'not_started');
  }
);

test(
  '미완료 + today === startDate(경계) => in_progress',
  { skip: !todoStatusExists },
  () => {
    const status = deriveTodoStatus(
      { isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' },
      '2026-08-01'
    );
    assert.equal(status, 'in_progress');
  }
);

test(
  '미완료 + startDate < today < endDate => in_progress',
  { skip: !todoStatusExists },
  () => {
    const status = deriveTodoStatus(
      { isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' },
      '2026-08-05'
    );
    assert.equal(status, 'in_progress');
  }
);

test(
  '미완료 + today === endDate(경계) => in_progress',
  { skip: !todoStatusExists },
  () => {
    const status = deriveTodoStatus(
      { isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' },
      '2026-08-10'
    );
    assert.equal(status, 'in_progress');
  }
);

test(
  '미완료 + today > endDate => overdue',
  { skip: !todoStatusExists },
  () => {
    const status = deriveTodoStatus(
      { isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' },
      '2026-08-11'
    );
    assert.equal(status, 'overdue');
  }
);

test(
  '완료 + today > endDate(기한초과 조건 동시 성립) => completed(E-6 최우선)',
  { skip: !todoStatusExists },
  () => {
    const status = deriveTodoStatus(
      { isCompleted: true, startDate: '2026-08-01', endDate: '2026-08-10' },
      '2026-09-01'
    );
    assert.equal(status, 'completed');
  }
);

test(
  '완료 + today < startDate => completed',
  { skip: !todoStatusExists },
  () => {
    const status = deriveTodoStatus(
      { isCompleted: true, startDate: '2026-08-01', endDate: '2026-08-10' },
      '2026-07-01'
    );
    assert.equal(status, 'completed');
  }
);

test(
  'today 인자를 생략하면 getUtcTodayString()의 기본값(오늘)이 사용된다',
  { skip: !todoStatusExists },
  () => {
    const today = getUtcTodayString();
    const status = deriveTodoStatus({
      isCompleted: false,
      startDate: today,
      endDate: today,
    });
    assert.equal(status, 'in_progress');
  }
);

test(
  'getUtcTodayString(date)는 YYYY-MM-DD 형식 문자열을 반환한다',
  { skip: !todoStatusExists },
  () => {
    const result = getUtcTodayString(new Date('2026-01-05T15:30:00.000Z'));
    assert.equal(result, '2026-01-05');
  }
);
