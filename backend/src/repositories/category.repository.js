'use strict';

const { toCamelCase } = require('../utils/case-mapper');

const SELECT_COLUMNS = 'id, name, is_default, user_id AS owner_id, created_at, updated_at';

async function insertCategory(clientOrPool, { userId, name, isDefault }) {
  const result = await clientOrPool.query(
    `INSERT INTO categories (user_id, name, is_default) VALUES ($1,$2,$3) RETURNING ${SELECT_COLUMNS}`,
    [userId, name, isDefault]
  );
  return toCamelCase(result.rows[0]);
}

async function findDefaultCategoryByUserId(clientOrPool, userId) {
  const result = await clientOrPool.query(
    `SELECT ${SELECT_COLUMNS} FROM categories WHERE user_id = $1 AND is_default = true`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  return toCamelCase(result.rows[0]);
}

async function findAllCategoriesByUserId(clientOrPool, userId) {
  const result = await clientOrPool.query(
    `SELECT ${SELECT_COLUMNS} FROM categories WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC`,
    [userId]
  );
  return toCamelCase(result.rows);
}

async function findCategoryByIdAndUserId(clientOrPool, categoryId, userId) {
  const result = await clientOrPool.query(
    `SELECT ${SELECT_COLUMNS} FROM categories WHERE id = $1 AND user_id = $2`,
    [categoryId, userId]
  );
  if (result.rows.length === 0) return null;
  return toCamelCase(result.rows[0]);
}

async function updateCategoryName(clientOrPool, { categoryId, userId, name }) {
  const result = await clientOrPool.query(
    `UPDATE categories SET name = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING ${SELECT_COLUMNS}`,
    [name, categoryId, userId]
  );
  if (result.rowCount === 0) return null;
  return toCamelCase(result.rows[0]);
}

async function deleteCategoryById(clientOrPool, categoryId, userId) {
  const result = await clientOrPool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [
    categoryId,
    userId,
  ]);
  return result.rowCount;
}

module.exports = {
  insertCategory,
  findDefaultCategoryByUserId,
  findAllCategoriesByUserId,
  findCategoryByIdAndUserId,
  updateCategoryName,
  deleteCategoryById,
};
