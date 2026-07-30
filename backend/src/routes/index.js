'use strict';

const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const todoRoutes = require('./todo.routes');
const userRoutes = require('./user.routes');
const docsRoutes = require('./docs.routes');

const router = Router();

router.use('/api/v1/docs', docsRoutes);
router.use('/api/v1', healthRoutes);
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/categories', categoryRoutes);
router.use('/api/v1/todos', todoRoutes);
router.use('/api/v1/users', userRoutes);

module.exports = router;
