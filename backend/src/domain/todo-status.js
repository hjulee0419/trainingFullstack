'use strict';

// 할일 상태 파생 순수 함수 (BE-5 / BE-6 단위테스트 대상).
// 서버 UTC 기준 오늘 날짜와 완료여부/시작일/종료일을 바탕으로 4개 상태 중 하나를 계산한다.
// 실제 목록조회 API의 필터링/응답 status는 SQL(CASE 문)로 동일 규칙을 계산하므로,
// 이 함수는 애플리케이션 레이어에서 상태를 계산해야 할 때(및 단위테스트)를 위한 참고 구현이다.

function getUtcTodayString(date = new Date()) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function deriveTodoStatus({ isCompleted, startDate, endDate }, today = getUtcTodayString()) {
  if (isCompleted) return 'completed';
  if (today < startDate) return 'not_started';
  if (today > endDate) return 'overdue';
  return 'in_progress';
}

module.exports = { deriveTodoStatus, getUtcTodayString };
