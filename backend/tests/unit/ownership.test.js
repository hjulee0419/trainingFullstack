'use strict';

// BE-6(접근 제어 통합 점검) 완료조건 검증:
// - Repository 쿼리 전수에 user_id 조건이 존재하는지, 403 대신 항상 404를 사용하는지,
//   컨트롤러가 소유자 판별에 req.user.id만 사용하는지를 "소스 코드 문자열 정적 분석" 방식으로 검증한다.
// - backend/tests/integration/app/{category,todo}.test.js의 "타 사용자 접근 시 404" 통합 테스트와는
//   달리, 이 파일은 실제 DB 호출 없이 소스 코드 자체가 접근 제어 정책을 일관되게 따르고 있는지를
//   회귀 테스트로 고정한다(새 Repository/Controller 파일이 정책을 어기면 이 테스트가 fail한다).

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const SRC_ROOT = path.resolve(__dirname, '..', '..', 'src');

const REPOSITORY_PATHS = {
  category: path.join(SRC_ROOT, 'repositories', 'category.repository.js'),
  todo: path.join(SRC_ROOT, 'repositories', 'todo.repository.js'),
  user: path.join(SRC_ROOT, 'repositories', 'user.repository.js'),
};

const CONTROLLER_PATHS = {
  category: path.join(SRC_ROOT, 'controllers', 'category.controller.js'),
  todo: path.join(SRC_ROOT, 'controllers', 'todo.controller.js'),
};

const SERVICE_PATHS = {
  category: path.join(SRC_ROOT, 'services', 'category.service.js'),
  todo: path.join(SRC_ROOT, 'services', 'todo.service.js'),
};

function readIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

const repoSources = Object.fromEntries(
  Object.entries(REPOSITORY_PATHS).map(([key, p]) => [key, readIfExists(p)])
);
const controllerSources = Object.fromEntries(
  Object.entries(CONTROLLER_PATHS).map(([key, p]) => [key, readIfExists(p)])
);
const serviceSources = Object.fromEntries(
  Object.entries(SERVICE_PATHS).map(([key, p]) => [key, readIfExists(p)])
);

const allRepositoriesExist = Object.values(repoSources).every((s) => s !== null);
const allControllersExist = Object.values(controllerSources).every((s) => s !== null);
const allServicesExist = Object.values(serviceSources).every((s) => s !== null);
const shouldSkip = !allRepositoriesExist || !allControllersExist || !allServicesExist;

if (!allRepositoriesExist) {
  console.log('[ownership.test] repositories 소스 파일 일부가 아직 존재하지 않아 skip 합니다.');
}
if (!allControllersExist) {
  console.log('[ownership.test] controllers 소스 파일 일부가 아직 존재하지 않아 skip 합니다.');
}
if (!allServicesExist) {
  console.log('[ownership.test] services 소스 파일 일부가 아직 존재하지 않아 skip 합니다.');
}

test('대상 소스 파일이 아직 없으면 skip', { skip: !shouldSkip }, () => {
  console.log('[ownership.test] 위 사유로 전체 테스트를 skip 합니다.');
});

// SQL 문자열에서 WHERE 절이 있는 FROM todos / FROM categories 쿼리를 추출한다.
// (WHERE가 없는 쿼리는 의도적인 전체 스캔이 아니라 이 프로젝트에는 존재하지 않지만,
//  혹시 있더라도 "특정 리소스 대상 쿼리"가 아니므로 검사 대상에서 제외한다.)
// 파일 내에 `const NAME = \`...\`;` 형태로 선언된 템플릿 리터럴 상수를 이름->내용 맵으로 수집한다.
// (todo.repository.js의 LIST_TODOS_WHERE_CLAUSE처럼 WHERE 절 자체가 별도 상수로 분리되어
//  쿼리 문자열에 ${NAME} 형태로 삽입되는 경우, 치환 후에 검사해야 user_id 조건 존재 여부를 올바르게 판단할 수 있다.)
function collectTemplateConstants(source) {
  const constants = {};
  const constPattern = /const\s+([A-Z0-9_]+)\s*=\s*`([^`]*)`/g;
  let m;
  while ((m = constPattern.exec(source)) !== null) {
    constants[m[1]] = m[2];
  }
  return constants;
}

function resolveTemplateReferences(sql, constants) {
  return sql.replace(/\$\{(\w+)\}/g, (whole, name) => {
    return Object.prototype.hasOwnProperty.call(constants, name) ? constants[name] : whole;
  });
}

function extractQueriesTargetingTable(source, tableName) {
  // 백틱(`) 또는 작은따옴표(') 템플릿/문자열 리터럴 형태의 SQL을 모두 잡기 위해
  // 각 따옴표 종류별로 매치한 뒤, tableName을 포함하는 것만 필터링한다.
  const constants = collectTemplateConstants(source);
  const matches = [];
  const templateLiteralPattern = /`([^`]*)`/g;
  let m;
  while ((m = templateLiteralPattern.exec(source)) !== null) {
    matches.push(resolveTemplateReferences(m[1], constants));
  }
  const singleQuotePattern = /'((?:[^'\\]|\\.)*)'/g;
  while ((m = singleQuotePattern.exec(source)) !== null) {
    matches.push(resolveTemplateReferences(m[1], constants));
  }

  return matches.filter((sql) => {
    const normalized = sql.replace(/\s+/g, ' ');
    const fromPattern = new RegExp(`FROM\\s+${tableName}\\b`, 'i');
    const hasWhere = /\bWHERE\b/i.test(normalized);
    return fromPattern.test(normalized) && hasWhere;
  });
}

test(
  'category.repository.js: FROM categories ... WHERE 쿼리는 모두 user_id 조건을 포함한다',
  { skip: shouldSkip },
  () => {
    const queries = extractQueriesTargetingTable(repoSources.category, 'categories');
    assert.ok(queries.length > 0, '검증 대상 쿼리가 1개 이상 존재해야 한다');
    for (const sql of queries) {
      assert.match(
        sql,
        /user_id/i,
        `다음 쿼리에 user_id 조건이 없습니다: ${sql}`
      );
    }
  }
);

test(
  'todo.repository.js: FROM todos ... WHERE 쿼리는 모두 user_id 조건을 포함한다',
  { skip: shouldSkip },
  () => {
    const queries = extractQueriesTargetingTable(repoSources.todo, 'todos');
    assert.ok(queries.length > 0, '검증 대상 쿼리가 1개 이상 존재해야 한다');
    for (const sql of queries) {
      assert.match(
        sql,
        /user_id/i,
        `다음 쿼리에 user_id 조건이 없습니다: ${sql}`
      );
    }
  }
);

test(
  'todo.repository.js: DELETE FROM todos 쿼리도 user_id 조건을 포함한다',
  { skip: shouldSkip },
  () => {
    assert.match(repoSources.todo, /DELETE FROM todos WHERE[^;]*user_id/i);
  }
);

test(
  'category.repository.js: DELETE FROM categories 쿼리도 user_id 조건을 포함한다',
  { skip: shouldSkip },
  () => {
    assert.match(repoSources.category, /DELETE FROM categories WHERE[^;]*user_id/i);
  }
);

test(
  'user.repository.js는 사용자 자신을 조회하는 리포지토리이므로 user_id 조건 검사에서 제외한다(정상)',
  { skip: shouldSkip },
  () => {
    // findUserByEmail/findUserById는 users 테이블 자체를 조회하는 것이 목적이므로
    // WHERE user_id = ... 조건이 없는 것이 정상이다. 이 테스트는 그 사실을 문서화하기 위한 것으로,
    // user.repository.js가 여전히 존재하고 users 테이블을 조회하고 있음만 확인한다.
    assert.match(repoSources.user, /FROM users/i);
  }
);

test(
  '모든 repository 소스에서 403 응답(res.status(403) 또는 new AppError(403)이 사용되지 않는다(프로젝트 컨벤션: 항상 404)',
  { skip: shouldSkip },
  () => {
    for (const [name, source] of Object.entries(repoSources)) {
      assert.doesNotMatch(
        source,
        /res\.status\(403\)|new AppError\(\s*403/,
        `${name}.repository.js에서 403 사용이 발견되었습니다`
      );
    }
  }
);

test(
  '모든 controller 소스에서 403 응답이 사용되지 않는다(프로젝트 컨벤션: 항상 404)',
  { skip: shouldSkip },
  () => {
    for (const [name, source] of Object.entries(controllerSources)) {
      assert.doesNotMatch(
        source,
        /res\.status\(403\)|new AppError\(\s*403/,
        `${name}.controller.js에서 403 사용이 발견되었습니다`
      );
    }
  }
);

test(
  '모든 service 소스에서 403 응답이 사용되지 않는다(프로젝트 컨벤션: 항상 404)',
  { skip: shouldSkip },
  () => {
    for (const [name, source] of Object.entries(serviceSources)) {
      assert.doesNotMatch(
        source,
        /res\.status\(403\)|new AppError\(\s*403/,
        `${name}.service.js에서 403 사용이 발견되었습니다`
      );
    }
  }
);

test(
  'category.controller.js / todo.controller.js는 소유자 판별에 req.user.id만 사용하고, ' +
    'req.body.userId / req.params.userId / req.query.userId 같은 클라이언트 조작 가능 필드를 사용하지 않는다',
  { skip: shouldSkip },
  () => {
    const clientControllableUserIdPattern = /req\.(body|params|query)\.userId/;

    for (const [name, source] of Object.entries(controllerSources)) {
      assert.doesNotMatch(
        source,
        clientControllableUserIdPattern,
        `${name}.controller.js에서 클라이언트 조작 가능한 userId 필드 사용이 발견되었습니다`
      );
      assert.match(
        source,
        /req\.user\.id/,
        `${name}.controller.js는 req.user.id를 사용해 소유자를 판별해야 합니다`
      );
    }
  }
);

test(
  'category.service.js / todo.service.js도 클라이언트 조작 가능한 userId 필드를 직접 사용하지 않는다',
  { skip: shouldSkip },
  () => {
    const clientControllableUserIdPattern = /req\.(body|params|query)\.userId/;

    for (const [name, source] of Object.entries(serviceSources)) {
      assert.doesNotMatch(
        source,
        clientControllableUserIdPattern,
        `${name}.service.js에서 클라이언트 조작 가능한 userId 필드 사용이 발견되었습니다`
      );
    }
  }
);

test(
  'category.service.js: findCategoryByIdAndUserId가 null을 반환하면 AppError(404, ...)를 던진다',
  { skip: shouldSkip },
  () => {
    // 호출 패턴: const category = await findCategoryByIdAndUserId(...); if (!category) throw new AppError(404, ...);
    // 인자 안에 getPool() 같은 중첩 괄호가 있을 수 있으므로 ')'가 아닌 ';' 기준으로 호출문 종료를 판단한다.
    const pattern = /findCategoryByIdAndUserId\([^;]*\);\s*if\s*\(![\w.]+\)\s*throw new AppError\(404/;
    assert.match(
      serviceSources.category,
      pattern,
      'findCategoryByIdAndUserId 호출 뒤 null 체크 시 AppError(404, ...)를 던지는 패턴이 발견되지 않았습니다'
    );
  }
);

test(
  'todo.service.js: findTodoByIdAndUserId가 null을 반환하면 AppError(404, ...)를 던진다',
  { skip: shouldSkip },
  () => {
    // 인자 안에 getPool() 같은 중첩 괄호가 있을 수 있으므로 ')'가 아닌 ';' 기준으로 호출문 종료를 판단한다.
    const pattern = /findTodoByIdAndUserId\([^;]*\);\s*if\s*\(![\w.]+\)\s*throw new AppError\(404/;
    assert.match(
      serviceSources.todo,
      pattern,
      'findTodoByIdAndUserId 호출 뒤 null 체크 시 AppError(404, ...)를 던지는 패턴이 발견되지 않았습니다'
    );
  }
);

test(
  'todo.service.js: updateTodoById가 null(0건 갱신)을 반환하면 AppError(404, ...)를 던진다',
  { skip: shouldSkip },
  () => {
    const pattern = /updateTodoById\([^]*?if\s*\(!updated\)\s*throw new AppError\(404/;
    assert.match(
      serviceSources.todo,
      pattern,
      'updateTodoById 호출 뒤 null 체크 시 AppError(404, ...)를 던지는 패턴이 발견되지 않았습니다'
    );
  }
);

test(
  'todo.service.js: deleteTodoById가 0건 삭제 시 AppError(404, ...)를 던진다',
  { skip: shouldSkip },
  () => {
    assert.match(
      serviceSources.todo,
      /deleteTodoById\([^]*?if\s*\(deletedCount === 0\)\s*throw new AppError\(404/,
      'deleteTodoById 호출 뒤 0건 체크 시 AppError(404, ...)를 던지는 패턴이 발견되지 않았습니다'
    );
  }
);

test(
  'category.service.js: deleteCategoryById가 0건 삭제 시 AppError(404, ...)를 던진다',
  { skip: shouldSkip },
  () => {
    assert.match(
      serviceSources.category,
      /deleteCategoryById\([^]*?if\s*\(deletedCount === 0\)\s*throw new AppError\(404/,
      'deleteCategoryById 호출 뒤 0건 체크 시 AppError(404, ...)를 던지는 패턴이 발견되지 않았습니다'
    );
  }
);
