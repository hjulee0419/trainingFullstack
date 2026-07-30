'use strict';

const { asyncHandler } = require('../middlewares/async-handler');
const userService = require('../services/user.service');
const { validateUpdateUserRequest } = require('../validators/user.schema');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserForRequest(req.user.id);
  res.status(200).json(user);
});

const updateMe = asyncHandler(async (req, res) => {
  const dto = validateUpdateUserRequest(req.body);
  const user = await userService.updateUserForUser(req.user.id, dto);
  res.status(200).json(user);
});

module.exports = { getMe, updateMe };
