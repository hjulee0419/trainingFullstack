'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const env = require('./config/env');
const routes = require('./routes/index');
const { requestLogger } = require('./utils/logger');
const { errorHandler } = require('./middlewares/error-handler');
const { AppError } = require('./utils/app-error');

const allowedOrigins = (env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed for this origin'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);

app.use(routes);

app.use((req, res, next) => next(new AppError(404, 'Not Found')));

app.use(errorHandler);

module.exports = app;
