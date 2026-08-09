const crypto = require("crypto");
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
      phone: user.phone,
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
      phone: user.phone,
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

//
// UPDATE PROFILE (PHONE)
//
const updateProfile = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error("Phone number is required");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: {
      phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

//
// FORGOT PASSWORD
//
const forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    res.status(404);
    throw new Error("No account found with that email address");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const resetExpire = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: resetExpire,
    },
  });

  const clientUrl = process.env.CLIENT_URL || "https://nvsjewellery.com";
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  res.status(200).json({
    success: true,
    message: "Password reset token generated successfully",
    resetToken,
    resetUrl,
  });
});

//
// RESET PASSWORD
//
const resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { token, password } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired password reset token");
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpire: null,
    },
  });

  const authToken = generateToken(user.id);

  res.status(200).json({
    success: true,
    message: "Password reset successful",
    token: authToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
};