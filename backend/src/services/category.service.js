'use strict';

const { AppError } = require('../utils/app-error');
const { withTransaction } = require('../utils/with-transaction');
const { getPool } = require('../config/db.pool');
const {
  insertCategory,
  findAllCategoriesByUserId,
  findCategoryByIdAndUserId,
  updateCategoryName,
  deleteCategoryById,
  findDefaultCategoryByUserId,
} = require('../repositories/category.repository');
const { reassignTodosToCategory } = require('../repositories/todo.repository');

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';
const CATEGORY_NOT_FOUND_MESSAGE = '카테고리를 찾을 수 없습니다.';
const DUPLICATE_NAME_MESSAGE = '이미 존재하는 카테고리 이름입니다.';

async function listCategoriesForUser(userId) {
  return findAllCategoriesByUserId(getPool(), userId);
}

async function createCategoryForUser(userId, { name }) {
  try {
    return await insertCategory(getPool(), { userId, name, isDefault: false });
  } catch (err) {
    if (err.code === POSTGRES_UNIQUE_VIOLATION_CODE) throw new AppError(409, DUPLICATE_NAME_MESSAGE);
    throw err;
  }
}

async function updateCategoryForUser(userId, categoryId, { name }) {
  const category = await findCategoryByIdAndUserId(getPool(), categoryId, userId);
  if (!category) throw new AppError(404, CATEGORY_NOT_FOUND_MESSAGE);
  if (category.isDefault) throw new AppError(400, '기본 카테고리는 수정할 수 없습니다.');

  try {
    const updated = await updateCategoryName(getPool(), { categoryId, userId, name });
    if (!updated) throw new AppError(404, CATEGORY_NOT_FOUND_MESSAGE);
    return updated;
  } catch (err) {
    if (err.code === POSTGRES_UNIQUE_VIOLATION_CODE) throw new AppError(409, DUPLICATE_NAME_MESSAGE);
    throw err;
  }
}

async function deleteCategoryForUser(userId, categoryId) {
  return withTransaction(getPool(), async (client) => {
    const category = await findCategoryByIdAndUserId(client, categoryId, userId);
    if (!category) throw new AppError(404, CATEGORY_NOT_FOUND_MESSAGE);
    if (category.isDefault) throw new AppError(400, '기본 카테고리는 삭제할 수 없습니다.');

    const defaultCategory = await findDefaultCategoryByUserId(client, userId);
    await reassignTodosToCategory(client, {
      userId,
      fromCategoryId: categoryId,
      toCategoryId: defaultCategory.id,
    });

    const deletedCount = await deleteCategoryById(client, categoryId, userId);
    if (deletedCount === 0) throw new AppError(404, CATEGORY_NOT_FOUND_MESSAGE);
  });
}

module.exports = {
  listCategoriesForUser,
  createCategoryForUser,
  updateCategoryForUser,
  deleteCategoryForUser,
};
