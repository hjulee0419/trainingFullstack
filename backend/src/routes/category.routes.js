'use strict';

const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/category.controller');

router.use(requireAuth);
router.get('/', ctrl.listCategories);
router.post('/', ctrl.createCategory);
router.patch('/:categoryId', ctrl.updateCategory);
router.delete('/:categoryId', ctrl.deleteCategory);

module.exports = router;
