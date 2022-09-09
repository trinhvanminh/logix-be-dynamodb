require("dotenv").config();
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

// ================= oauth2 =================

// frontend class this to check is authenticated
router.get("/login/success", authController.loginSuccess);

router.get("/login/failure", authController.loginFailure);

router.get("/google/callback", authController.googleCallback);

// ---- note: not using fetch, axios to get this ===> using [a href] to get this router ------------
router.get("/google", authController.google);

//---- note: not using fetch, axios to get this ===> using [a href] to get this router ------------
router.get("/logout", authController.logoutOauth);

module.exports = router;
