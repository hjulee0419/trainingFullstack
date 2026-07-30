'use strict';

const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/user.controller');

router.use(requireAuth);
router.get('/me', ctrl.getMe);
router.patch('/me', ctrl.updateMe);

module.exports = router;
