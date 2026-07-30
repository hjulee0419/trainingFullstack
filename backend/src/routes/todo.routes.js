'use strict';

const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/todo.controller');

router.use(requireAuth);
router.get('/', ctrl.listTodos);
router.post('/', ctrl.createTodo);
router.patch('/:todoId', ctrl.updateTodo);
router.delete('/:todoId', ctrl.deleteTodo);

module.exports = router;
