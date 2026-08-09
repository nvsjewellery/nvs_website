const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const prisma = require("../lib/prisma");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

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
// FORGOT PASSWORD (VIA RESEND EMAIL)
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
    return res.status(200).json({
      success: true,
      message: "If that email is registered, a password reset link has been sent to your inbox.",
    });
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
  const resetUrl = `${clientUrl}/signin?resetToken=${resetToken}`;

  const htmlTemplate = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #2C221E; font-size: 20px; font-weight: 600; margin-bottom: 12px;">Reset Your Password</h2>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Hello <strong>${user.name}</strong>,</p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">We received a request to reset your password for your NVS Jewellery account. Click the button below to set a new password:</p>
      
      <div style="margin: 28px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #B8860B; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 25px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; line-height: 1.4;">This link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request — NVS Jewellery",
      html: htmlTemplate,
    });

    res.status(200).json({
      success: true,
      message: "Password reset instructions have been sent to your email inbox.",
    });
  } catch (error) {
    // Clean up reset token fields in DB if dispatch fails
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    res.status(500);
    throw new Error(error.message || "Failed to send reset email. Please try again later.");
  }
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