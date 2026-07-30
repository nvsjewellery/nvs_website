const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const prisma = require("../lib/prisma");
const generateToken = require("../utils/generateToken");

//
// REGISTER
//
const registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { name, email, password } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existing) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const salt = await bcrypt.genSalt(12);

  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
    },
  });

  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

//
// LOGIN
//
const loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email, password } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const matched = await bcrypt.compare(password, user.password);

  if (!matched) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user.id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

//
// LOGOUT
//
const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

//
// GET ME
//
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
};