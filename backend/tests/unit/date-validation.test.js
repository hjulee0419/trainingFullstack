'use strict';

// BE-6(접근 제어 통합 점검 + 핵심 로직 단위 테스트) 완료조건 검증:
// - backend/src/validators/todo.schema.js의 validateCreateTodoRequest(및 validateUpdateTodoRequest)를
//   대상으로 하는 순수 함수 단위테스트.
// - 도메인 규칙 3(종료일자는 시작일자보다 이전일 수 없음, 같은 날짜는 허용)과
//   E-1(종료일자<시작일자) 경계값을 검증한다.
//
// 주의(실제 구현 확인 결과, 아래 "완료 후 보고" 참고):
// - validateDate는 정규식 /^\d{4}-\d{2}-\d{2}$/ 로 "형식"만 검사하고 달력상 유효성(월 13, 일 32 등)은
//   검사하지 않는다. 따라서 '2026-13-01'은 형식상 4자리-2자리-2자리 패턴을 만족하므로 throw되지 않는다.
//   이는 테스트가 실제 구현 동작을 반영해야 하므로, 이 파일에서는 그 사실을 그대로 검증한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const SCHEMA_PATH = path.resolve(__dirname, '..', '..', 'src', 'validators', 'todo.schema.js');
const schemaExists = fs.existsSync(SCHEMA_PATH);

let validateCreateTodoRequest;
let validateUpdateTodoRequest;
let AppError;

if (schemaExists) {
  ({ validateCreateTodoRequest, validateUpdateTodoRequest } = require(SCHEMA_PATH));
  ({ AppError } = require('../../src/utils/app-error'));
} else {
  console.log('[date-validation.test] src/validators/todo.schema.js가 아직 존재하지 않아 skip 합니다.');
}

test('src/validators/todo.schema.js가 아직 없으면 skip', { skip: !!schemaExists }, () => {
  console.log('[date-validation.test] 위 사유로 전체 테스트를 skip 합니다.');
});

function baseValidBody(overrides) {
  return {
    title: '테스트 할일',
    startDate: '2026-08-01',
    endDate: '2026-08-10',
    ...overrides,
  };
}

test('endDate === startDate => 허용(도메인 규칙 3, 같은 날짜 허용)', { skip: !schemaExists }, () => {
  const dto = validateCreateTodoRequest(
    baseValidBody({ startDate: '2026-08-01', endDate: '2026-08-01' })
  );
  assert.equal(dto.startDate, '2026-08-01');
  assert.equal(dto.endDate, '2026-08-01');
});

test('endDate > startDate => 통과', { skip: !schemaExists }, () => {
  const dto = validateCreateTodoRequest(
    baseValidBody({ startDate: '2026-08-01', endDate: '2026-08-10' })
  );
  assert.equal(dto.startDate, '2026-08-01');
  assert.equal(dto.endDate, '2026-08-10');
});

test('endDate < startDate => AppError(400) throw(E-1)', { skip: !schemaExists }, () => {
  assert.throws(
    () => validateCreateTodoRequest(baseValidBody({ startDate: '2026-08-10', endDate: '2026-08-01' })),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, '종료일자는 시작일자보다 이전일 수 없습니다.');
      return true;
    }
  );
});

test('startDate 형식 오류(YYYY-MM-DD 아님, 예: 2026/07/30) => AppError(400) throw', { skip: !schemaExists }, () => {
  assert.throws(
    () => validateCreateTodoRequest(baseValidBody({ startDate: '2026/07/30' })),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /시작일자.*형식이 올바르지 않습니다/);
      return true;
    }
  );
});

test('endDate 형식 오류(YYYY-MM-DD 아님, 예: 07-30-2026) => AppError(400) throw', { skip: !schemaExists }, () => {
  assert.throws(
    () => validateCreateTodoRequest(baseValidBody({ endDate: '07-30-2026' })),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /종료일자.*형식이 올바르지 않습니다/);
      return true;
    }
  );
});

test(
  "'2026-13-01'처럼 자릿수는 YYYY-MM-DD 패턴이지만 달력상 무효한 값은 " +
    '실제 구현(정규식 형식 검사만 수행)에서는 throw되지 않는다(달력 유효성 미검증, 알려진 한계)',
  { skip: !schemaExists },
  () => {
    const dto = validateCreateTodoRequest(baseValidBody({ startDate: '2026-13-01', endDate: '2026-13-01' }));
    assert.equal(dto.startDate, '2026-13-01');
  }
);

test('startDate 누락 => AppError(400) throw', { skip: !schemaExists }, () => {
  const body = baseValidBody();
  delete body.startDate;
  assert.throws(
    () => validateCreateTodoRequest(body),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      return true;
    }
  );
});

test('endDate 누락 => AppError(400) throw', { skip: !schemaExists }, () => {
  const body = baseValidBody();
  delete body.endDate;
  assert.throws(
    () => validateCreateTodoRequest(body),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      return true;
    }
  );
});

test('startDate, endDate 모두 누락 => AppError(400) throw', { skip: !schemaExists }, () => {
  const body = baseValidBody();
  delete body.startDate;
  delete body.endDate;
  assert.throws(
    () => validateCreateTodoRequest(body),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      return true;
    }
  );
});

test('title 누락 => AppError(400) throw', { skip: !schemaExists }, () => {
  const body = baseValidBody();
  delete body.title;
  assert.throws(
    () => validateCreateTodoRequest(body),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, '제목을 입력해주세요.');
      return true;
    }
  );
});

test('title이 빈 문자열 => AppError(400) throw', { skip: !schemaExists }, () => {
  assert.throws(
    () => validateCreateTodoRequest(baseValidBody({ title: '' })),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, '제목을 입력해주세요.');
      return true;
    }
  );
});

test('title이 공백만 있는 문자열 => AppError(400) throw', { skip: !schemaExists }, () => {
  assert.throws(
    () => validateCreateTodoRequest(baseValidBody({ title: '    ' })),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, '제목을 입력해주세요.');
      return true;
    }
  );
});

// 실제 구현 확인 결과: validateTitle에 MAX_TITLE_LENGTH = 200 제한이 존재한다(todo.schema.js:5,14-16).
test('title이 200자를 초과하면 AppError(400) throw', { skip: !schemaExists }, () => {
  const longTitle = 'a'.repeat(201);
  assert.throws(
    () => validateCreateTodoRequest(baseValidBody({ title: longTitle })),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, '제목은 최대 200자까지 입력할 수 있습니다.');
      return true;
    }
  );
});

test('title이 정확히 200자이면 통과(경계값)', { skip: !schemaExists }, () => {
  const title200 = 'a'.repeat(200);
  const dto = validateCreateTodoRequest(baseValidBody({ title: title200 }));
  assert.equal(dto.title.length, 200);
});

// 실제 구현 확인 결과: validateCategoryId는 Number(categoryId)가 정수가 아니면 AppError(400)을 throw한다
// (todo.schema.js:29-37). 문자열 'abc'는 Number('abc') === NaN 이므로 Number.isInteger(NaN)이 false가 되어 throw된다.
test("categoryId가 정수로 변환 불가능한 문자열('abc')이면 AppError(400) throw", { skip: !schemaExists }, () => {
  assert.throws(
    () => validateCreateTodoRequest(baseValidBody({ categoryId: 'abc' })),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, '카테고리 ID는 정수여야 합니다.');
      return true;
    }
  );
});

// 실제 구현 확인 결과: 숫자 형식의 문자열('3')은 Number('3') === 3이 정수이므로 통과하고,
// 반환값은 숫자 3(문자열이 아님)으로 정규화된다.
test("categoryId가 숫자 형식의 문자열('3')이면 정수로 정규화되어 통과", { skip: !schemaExists }, () => {
  const dto = validateCreateTodoRequest(baseValidBody({ categoryId: '3' }));
  assert.equal(dto.categoryId, 3);
});

test('categoryId 미지정(undefined) => 통과, categoryId는 undefined로 유지', { skip: !schemaExists }, () => {
  const dto = validateCreateTodoRequest(baseValidBody());
  assert.equal(dto.categoryId, undefined);
});

// --- validateUpdateTodoRequest (부분 업데이트) ---

// 실제 구현 확인 결과: validateUpdateTodoRequest는 부분 업데이트이므로 각 필드의 "형식"만 검증하고,
// startDate/endDate 순서 비교는 하지 않는다(기존 값과 병합한 최종 날짜 비교는
// src/services/todo.service.js의 updateTodoForUser에서 수행됨). 따라서 스키마 단계에서는 throw되지 않는다.
test(
  '[update] endDate < startDate여도 스키마 단계에서는 throw되지 않는다(순서 비교는 서비스 계층 책임)',
  { skip: !schemaExists },
  () => {
    const dto = validateUpdateTodoRequest({ startDate: '2026-08-10', endDate: '2026-08-01' });
    assert.equal(dto.startDate, '2026-08-10');
    assert.equal(dto.endDate, '2026-08-01');
  }
);

test('[update] 필드가 없는 빈 body => 빈 dto 반환(부분 업데이트이므로 필수값 강제하지 않음)', { skip: !schemaExists }, () => {
  const dto = validateUpdateTodoRequest({});
  assert.deepEqual(dto, {});
});

test('[update] title이 빈 문자열이면 AppError(400) throw', { skip: !schemaExists }, () => {
  assert.throws(
    () => validateUpdateTodoRequest({ title: '' }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      return true;
    }
  );
});

test("[update] categoryId가 'abc'이면 AppError(400) throw", { skip: !schemaExists }, () => {
  assert.throws(
    () => validateUpdateTodoRequest({ categoryId: 'abc' }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      return true;
    }
  );
});
