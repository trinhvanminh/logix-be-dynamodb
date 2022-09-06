const Users = require("../models/users.model");
const argon2 = require("argon2");
const { createTokens } = require("../middlewares/JWT");
const nodeMailer = require("nodemailer");
const { sendResetPasswordEmail } = require("../helpers/mails.helper");

const AuthController = {
  // GET /
  index: async (req, res) => {
    try {
      const user = await Users.findById(req.userId).select("-password");
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      res.json({ success: true, user });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /login
  login: async (req, res) => {
    const { username, password, email } = req.body;

    // Simple validation
    if (!password || (!username && !email))
      return res.status(400).json({
        success: false,
        message: "Missing username/email and/or password",
      });

    try {
      // Check for existing user
      const user = await Users.findOne({
        $or: [{ email }, { username }],
      });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "Incorrect username or password" });

      // Username found
      const passwordValid = await argon2.verify(user.password, password);
      if (!passwordValid)
        return res
          .status(400)
          .json({ success: false, message: "Incorrect username or password" });

      // All good
      // Return token
      const accessToken = createTokens(user._id);

      res.json({
        success: true,
        message: "User logged in successfully",
        accessToken,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /register
  register: async (req, res) => {
    const { username, password, email } = req.body;

    // Simple validation
    if (!password || !username || !email)
      return res.status(400).json({
        success: false,
        message: "Missing username and/or password and/or email",
      });

    try {
      // Check for existing user
      const user = await Users.findOne({
        $or: [{ email }, { username }],
      });

      if (user)
        return res.status(400).json({
          success: false,
          message: "Username and/or email already taken",
        });

      // All good
      const hashedPassword = await argon2.hash(password);
      const newUser = new Users({ username, email, password: hashedPassword });
      await newUser.save();

      // Return token
      const accessToken = createTokens(newUser._id);

      res.json({
        success: true,
        message: "User created successfully",
        accessToken,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /reset-password
  resetPassword: async (req, res) => {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Missing email to reset password" });

    const user = await Users.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });

    const accessToken = createTokens(user._id);
    const result = await sendResetPasswordEmail({
      toUser: email,
      accessToken,
    });
    if (result) return res.json({ success: true, message: "Email sent" });
    return res.json({ success: false, message: "Email not sent" });
  },

  // PATCH /reset-password/confirm/
  confirmResetPassword: async (req, res) => {
    const { newpassword } = req.body;
    if (!newpassword) {
      return res.status(400).json({
        success: false,
        message: "Missing new password",
      });
    }
    // update password
    const hashedPassword = await argon2.hash(newpassword);
    const updatedUser = await Users.findOneAndUpdate(
      { _id: req.userId },
      { $set: { password: hashedPassword } },
      {
        new: true,
      }
    );

    if (!updatedUser)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    res.json({
      success: true,
      message: "Password updated successfully",
      user: updatedUser,
    });
  },
};

module.exports = AuthController;
