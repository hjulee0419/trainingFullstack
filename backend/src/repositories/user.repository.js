'use strict';

const { toCamelCase, camelToSnake } = require('../utils/case-mapper');

async function insertUser(clientOrPool, { email, passwordHash, nickname }) {
  const result = await clientOrPool.query(
    'INSERT INTO users (email, password_hash, nickname) VALUES ($1,$2,$3) RETURNING id, email, nickname, created_at, updated_at',
    [email, passwordHash, nickname]
  );
  return toCamelCase(result.rows[0]);
}

async function findUserByEmail(clientOrPool, email) {
  const result = await clientOrPool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) return null;
  return toCamelCase(result.rows[0]);
}

async function findUserById(clientOrPool, userId) {
  const result = await clientOrPool.query(
    'SELECT id, email, nickname, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) return null;
  return toCamelCase(result.rows[0]);
}

async function updateUserById(clientOrPool, userId, fields) {
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

  values.push(userId);
  const userIdParamIndex = paramIndex;

  const result = await clientOrPool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${userIdParamIndex}
     RETURNING id, email, nickname, created_at, updated_at`,
    values
  );

  if (result.rowCount === 0) return null;
  return toCamelCase(result.rows[0]);
}

module.exports = { insertUser, findUserByEmail, findUserById, updateUserById };
