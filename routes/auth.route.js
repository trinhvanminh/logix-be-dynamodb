const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/JWT");

// auth/
router.get("/", verifyToken, authController.index);
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/reset-password", authController.resetPassword);
router.patch(
  "/reset-password/confirm/",
  verifyToken,
  authController.confirmResetPassword
);

module.exports = router;
