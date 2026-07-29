'use strict';

const { Router } = require('express');
const healthRoutes = require('./health.routes');

const router = Router();

router.use('/api/v1', healthRoutes);

module.exports = router;
