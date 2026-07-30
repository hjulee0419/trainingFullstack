'use strict';

const { AppError } = require('../utils/app-error');

const MAX_TITLE_LENGTH = 200;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new AppError(400, '제목을 입력해주세요.');
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    throw new AppError(400, `제목은 최대 ${MAX_TITLE_LENGTH}자까지 입력할 수 있습니다.`);
  }

  return trimmedTitle;
}

function validateDescription(description) {
  if (description === undefined || description === null) return null;
  if (typeof description !== 'string') {
    throw new AppError(400, '설명은 문자열이어야 합니다.');
  }
  return description;
}

function validateCategoryId(categoryId) {
  if (categoryId === undefined || categoryId === null) return undefined;

  const numericCategoryId = Number(categoryId);
  if (!Number.isInteger(numericCategoryId)) {
    throw new AppError(400, '카테고리 ID는 정수여야 합니다.');
  }
  return numericCategoryId;
}

function validateDate(value, fieldMessage) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new AppError(400, `${fieldMessage} 형식이 올바르지 않습니다. (YYYY-MM-DD)`);
  }
  return value;
}

function validateCreateTodoRequest(body) {
  const { title, description, categoryId, startDate, endDate } = body || {};

  const validatedTitle = validateTitle(title);
  const validatedDescription = validateDescription(description);
  const validatedCategoryId = validateCategoryId(categoryId);
  const validatedStartDate = validateDate(startDate, '시작일자');
  const validatedEndDate = validateDate(endDate, '종료일자');

  if (validatedEndDate < validatedStartDate) {
    throw new AppError(400, '종료일자는 시작일자보다 이전일 수 없습니다.');
  }

  return {
    title: validatedTitle,
    description: validatedDescription,
    categoryId: validatedCategoryId,
    startDate: validatedStartDate,
    endDate: validatedEndDate,
  };
}

function validateUpdateTodoRequest(body) {
  const source = body || {};
  const dto = {};

  if ('title' in source) {
    dto.title = validateTitle(source.title);
  }

  if ('description' in source) {
    dto.description = validateDescription(source.description);
  }

  if ('categoryId' in source) {
    const validatedCategoryId = validateCategoryId(source.categoryId);
    if (validatedCategoryId === undefined) {
      throw new AppError(400, '카테고리 ID는 정수여야 합니다.');
    }
    dto.categoryId = validatedCategoryId;
  }

  if ('startDate' in source) {
    dto.startDate = validateDate(source.startDate, '시작일자');
  }

  if ('endDate' in source) {
    dto.endDate = validateDate(source.endDate, '종료일자');
  }

  if ('isCompleted' in source) {
    if (typeof source.isCompleted !== 'boolean') {
      throw new AppError(400, 'isCompleted는 boolean이어야 합니다.');
    }
    dto.isCompleted = source.isCompleted;
  }

  return dto;
}

const VALID_STATUSES = ['not_started', 'in_progress', 'completed', 'overdue'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function validateListTodosQuery(query) {
  const source = query || {};

  let categoryId;
  if (source.categoryId !== undefined && source.categoryId !== null && source.categoryId !== '') {
    const numericCategoryId = Number(source.categoryId);
    if (!Number.isInteger(numericCategoryId)) {
      throw new AppError(400, 'categoryId는 정수여야 합니다.');
    }
    categoryId = numericCategoryId;
  }

  let status;
  if (source.status !== undefined && source.status !== null && source.status !== '') {
    if (!VALID_STATUSES.includes(source.status)) {
      throw new AppError(400, '유효하지 않은 status 값입니다.');
    }
    status = source.status;
  }

  let page = Number(source.page);
  if (source.page === undefined || source.page === null || source.page === '' || Number.isNaN(page) || page < 1) {
    page = DEFAULT_PAGE;
  } else {
    page = Math.trunc(page);
  }

  let limit = Number(source.limit);
  if (source.limit === undefined || source.limit === null || source.limit === '' || Number.isNaN(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  } else if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  } else {
    limit = Math.trunc(limit);
  }

  return { categoryId, status, page, limit };
}

module.exports = {
  validateCreateTodoRequest,
  validateUpdateTodoRequest,
  validateListTodosQuery,
};
