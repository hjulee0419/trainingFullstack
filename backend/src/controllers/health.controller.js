'use strict';

const { getPool } = require('../config/db.pool');
const { asyncHandler } = require('../middlewares/async-handler');
const { AppError } = require('../utils/app-error');

const checkHealth = asyncHandler(async (req, res) => {
  const startTime = process.hrtime.bigint();

  let result;
  try {
    result = await getPool().query('SELECT 1 AS ok');
  } catch (err) {
    throw new AppError(503, 'Database connection failed');
  }

  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  res.status(200).json({
    status: 'ok',
    db: {
      status: 'connected',
      latencyMs,
    },
  });
});

module.exports = { checkHealth };
