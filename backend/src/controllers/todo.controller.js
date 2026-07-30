'use strict';

const { asyncHandler } = require('../middlewares/async-handler');
const todoService = require('../services/todo.service');
const {
  validateCreateTodoRequest,
  validateUpdateTodoRequest,
  validateListTodosQuery,
} = require('../validators/todo.schema');

const createTodo = asyncHandler(async (req, res) => {
  const dto = validateCreateTodoRequest(req.body);
  const todo = await todoService.createTodoForUser(req.user.id, dto);
  res.status(201).json(todo);
});

const updateTodo = asyncHandler(async (req, res) => {
  const dto = validateUpdateTodoRequest(req.body);
  const todoId = Number(req.params.todoId);
  const todo = await todoService.updateTodoForUser(req.user.id, todoId, dto);
  res.status(200).json(todo);
});

const deleteTodo = asyncHandler(async (req, res) => {
  const todoId = Number(req.params.todoId);
  await todoService.deleteTodoForUser(req.user.id, todoId);
  res.status(204).send();
});

const listTodos = asyncHandler(async (req, res) => {
  const query = validateListTodosQuery(req.query);
  const result = await todoService.listTodosForUser(req.user.id, query);
  res.status(200).json(result);
});

module.exports = { createTodo, updateTodo, deleteTodo, listTodos };
