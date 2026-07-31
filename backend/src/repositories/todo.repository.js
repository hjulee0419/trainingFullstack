'use strict';

const { toCamelCase, camelToSnake } = require('../utils/case-mapper');

// BE-3에서는 카테고리 삭제 트랜잭션에서 사용할 함수만 우선 추가한다.
// 나머지 todo 관련 함수는 BE-4에서 추가한다.

async function reassignTodosToCategory(client, { userId, fromCategoryId, toCategoryId }) {
  await client.query(
    'UPDATE todos SET category_id = $1, updated_at = now() WHERE user_id = $2 AND category_id = $3',
    [toCategoryId, userId, fromCategoryId]
  );
}

async function insertTodo(clientOrPool, { userId, categoryId, title, description, startDate, endDate }) {
  const result = await clientOrPool.query(
    `INSERT INTO todos (user_id, category_id, title, description, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, user_id AS owner_id, category_id, title, description, start_date, end_date,
       is_completed, completed_at, created_at, updated_at`,
    [userId, categoryId, title, description, startDate, endDate]
  );
  return toCamelCase(result.rows[0]);
}

// 파생 상태(status) 계산식. findTodoByIdAndUserId/findTodosForUser가 동일한 규칙을 공유하도록 상수로 분리한다.
const STATUS_CASE_SQL = `
  CASE
    WHEN t.is_completed THEN 'completed'
    WHEN CURRENT_DATE < t.start_date THEN 'not_started'
    WHEN CURRENT_DATE > t.end_date THEN 'overdue'
    ELSE 'in_progress'
  END
`;

async function findTodoByIdAndUserId(clientOrPool, todoId, userId) {
  const result = await clientOrPool.query(
    `SELECT t.id, t.user_id AS owner_id, t.category_id, c.name AS category_name, t.title,
       t.description, t.start_date, t.end_date, t.is_completed, t.completed_at, t.created_at, t.updated_at,
       ${STATUS_CASE_SQL} AS status
     FROM todos t
     JOIN categories c ON c.id = t.category_id
     WHERE t.id = $1 AND t.user_id = $2`,
    [todoId, userId]
  );
  if (result.rows.length === 0) return null;
  return toCamelCase(result.rows[0]);
}

async function updateTodoById(clientOrPool, todoId, userId, fields) {
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    setClauses.push(`${camelToSnake(key)} = $${paramIndex}`);
    values.push(value);
    paramIndex += 1;
  }

  setClauses.push('updated_at = now()');

  values.push(todoId);
  const todoIdParamIndex = paramIndex;
  paramIndex += 1;

  values.push(userId);
  const userIdParamIndex = paramIndex;

  const result = await clientOrPool.query(
    `UPDATE todos SET ${setClauses.join(', ')} WHERE id = $${todoIdParamIndex} AND user_id = $${userIdParamIndex} RETURNING id`,
    values
  );

  if (result.rowCount === 0) return null;
  return toCamelCase(result.rows[0]);
}

async function deleteTodoById(clientOrPool, todoId, userId) {
  const result = await clientOrPool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [
    todoId,
    userId,
  ]);
  return result.rowCount;
}

// BE-5: 목록조회(필터+페이지네이션) 전용 WHERE 절.
// findTodosForUser/countTodosForUser가 동일한 조건(파생 status 포함)을 공유하도록 상수로 분리한다.
const LIST_TODOS_WHERE_CLAUSE = `
  t.user_id = $1
  AND ($2::bigint IS NULL OR t.category_id = $2)
  AND (
    $3::text IS NULL
    OR (
      CASE
        WHEN t.is_completed THEN 'completed'
        WHEN CURRENT_DATE < t.start_date THEN 'not_started'
        WHEN CURRENT_DATE > t.end_date THEN 'overdue'
        ELSE 'in_progress'
      END
    ) = $3
  )
`;

async function findTodosForUser(clientOrPool, { userId, categoryId, status, limit, offset }) {
  const result = await clientOrPool.query(
    `SELECT t.id, t.user_id AS owner_id, t.category_id, c.name AS category_name, t.title, t.description,
            t.start_date, t.end_date, t.is_completed, t.completed_at, t.created_at, t.updated_at,
            CASE
              WHEN t.is_completed THEN 'completed'
              WHEN CURRENT_DATE < t.start_date THEN 'not_started'
              WHEN CURRENT_DATE > t.end_date THEN 'overdue'
              ELSE 'in_progress'
            END AS status
     FROM todos t
     JOIN categories c ON c.id = t.category_id
     WHERE ${LIST_TODOS_WHERE_CLAUSE}
     ORDER BY t.created_at DESC
     LIMIT $4 OFFSET $5`,
    [userId, categoryId ?? null, status ?? null, limit, offset]
  );
  return toCamelCase(result.rows);
}

async function countTodosForUser(clientOrPool, { userId, categoryId, status }) {
  const result = await clientOrPool.query(
    `SELECT COUNT(*)::int AS count
     FROM todos t
     WHERE ${LIST_TODOS_WHERE_CLAUSE}`,
    [userId, categoryId ?? null, status ?? null]
  );
  return result.rows[0].count;
}

module.exports = {
  reassignTodosToCategory,
  insertTodo,
  findTodoByIdAndUserId,
  updateTodoById,
  deleteTodoById,
  findTodosForUser,
  countTodosForUser,
};
