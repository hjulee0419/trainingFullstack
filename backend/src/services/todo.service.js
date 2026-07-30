'use strict';

const { AppError } = require('../utils/app-error');
const { getPool } = require('../config/db.pool');
const {
  insertTodo,
  findTodoByIdAndUserId,
  updateTodoById,
  deleteTodoById,
  findTodosForUser,
  countTodosForUser,
} = require('../repositories/todo.repository');
const {
  findCategoryByIdAndUserId,
  findDefaultCategoryByUserId,
} = require('../repositories/category.repository');

const TODO_NOT_FOUND_MESSAGE = '할일을 찾을 수 없습니다.';
const CATEGORY_NOT_FOUND_MESSAGE = '지정한 카테고리를 찾을 수 없습니다.';
const END_DATE_BEFORE_START_DATE_MESSAGE = '종료일자는 시작일자보다 이전일 수 없습니다.';

async function createTodoForUser(userId, dto) {
  let categoryId = dto.categoryId;

  if (categoryId === undefined || categoryId === null) {
    const defaultCategory = await findDefaultCategoryByUserId(getPool(), userId);
    categoryId = defaultCategory.id;
  } else {
    const category = await findCategoryByIdAndUserId(getPool(), categoryId, userId);
    if (!category) throw new AppError(404, CATEGORY_NOT_FOUND_MESSAGE);
  }

  const inserted = await insertTodo(getPool(), {
    userId,
    categoryId,
    title: dto.title,
    description: dto.description ?? null,
    startDate: dto.startDate,
    endDate: dto.endDate,
  });

  // insertTodo는 categories와 JOIN하지 않으므로 categoryName이 비어있다.
  // 응답 계약(swagger Todo.categoryName)을 만족시키기 위해 JOIN된 최종 상태를 재조회한다.
  return findTodoByIdAndUserId(getPool(), inserted.id, userId);
}

async function updateTodoForUser(userId, todoId, dto) {
  const existing = await findTodoByIdAndUserId(getPool(), todoId, userId);
  if (!existing) throw new AppError(404, TODO_NOT_FOUND_MESSAGE);

  const finalStartDate = dto.startDate ?? existing.startDate;
  const finalEndDate = dto.endDate ?? existing.endDate;
  if (finalEndDate < finalStartDate) {
    throw new AppError(400, END_DATE_BEFORE_START_DATE_MESSAGE);
  }

  if ('categoryId' in dto) {
    const category = await findCategoryByIdAndUserId(getPool(), dto.categoryId, userId);
    if (!category) throw new AppError(404, CATEGORY_NOT_FOUND_MESSAGE);
  }

  const fields = {
    title: dto.title,
    description: dto.description,
    categoryId: dto.categoryId,
    startDate: dto.startDate,
    endDate: dto.endDate,
    isCompleted: dto.isCompleted,
  };

  if ('isCompleted' in dto) {
    if (dto.isCompleted === true && !existing.isCompleted) {
      fields.completedAt = new Date();
    } else if (dto.isCompleted === false && existing.isCompleted) {
      fields.completedAt = null;
    }
  }

  const updated = await updateTodoById(getPool(), todoId, userId, fields);
  if (!updated) throw new AppError(404, TODO_NOT_FOUND_MESSAGE);

  return findTodoByIdAndUserId(getPool(), todoId, userId);
}

async function deleteTodoForUser(userId, todoId) {
  const deletedCount = await deleteTodoById(getPool(), todoId, userId);
  if (deletedCount === 0) throw new AppError(404, TODO_NOT_FOUND_MESSAGE);
}

// BE-5: 목록조회(필터+페이지네이션).
// 응답의 status는 findTodosForUser의 SQL(CASE)이 이미 계산해 반환하므로 여기서 재계산하지 않는다
// (domain/todo-status.js의 deriveTodoStatus는 동일 규칙의 순수함수 참고 구현이며 BE-6 단위테스트 대상이다).
async function listTodosForUser(userId, { categoryId, status, page, limit }) {
  const offset = (page - 1) * limit;
  const pool = getPool();
  const [items, totalCount] = await Promise.all([
    findTodosForUser(pool, { userId, categoryId, status, limit, offset }),
    countTodosForUser(pool, { userId, categoryId, status }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  return {
    items,
    pagination: { page, limit, totalCount, totalPages },
  };
}

module.exports = {
  createTodoForUser,
  updateTodoForUser,
  deleteTodoForUser,
  listTodosForUser,
};
