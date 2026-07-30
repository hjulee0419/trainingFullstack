'use strict';

const { asyncHandler } = require('../middlewares/async-handler');
const authService = require('../services/auth.service');
const { validateSignupRequest, validateLoginRequest } = require('../validators/auth.schema');

const signup = asyncHandler(async (req, res) => {
  const dto = validateSignupRequest(req.body);
  const user = await authService.signup(dto);
  res.status(201).json(user);
});

const login = asyncHandler(async (req, res) => {
  const dto = validateLoginRequest(req.body);
  const result = await authService.login(dto);
  res.status(200).json(result);
});

module.exports = { signup, login };
