'use strict';

const { asyncHandler } = require('../middlewares/async-handler');
const categoryService = require('../services/category.service');
const {
  validateCreateCategoryRequest,
  validateUpdateCategoryRequest,
} = require('../validators/category.schema');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategoriesForUser(req.user.id);
  res.status(200).json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const dto = validateCreateCategoryRequest(req.body);
  const category = await categoryService.createCategoryForUser(req.user.id, dto);
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const dto = validateUpdateCategoryRequest(req.body);
  const categoryId = Number(req.params.categoryId);
  const category = await categoryService.updateCategoryForUser(req.user.id, categoryId, dto);
  res.status(200).json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.categoryId);
  await categoryService.deleteCategoryForUser(req.user.id, categoryId);
  res.status(204).send();
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
