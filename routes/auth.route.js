require("dotenv").config();
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/JWT");
const passport = require("passport");

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

// auth/ by passport oauth2

const CLIENT_URL = process.env.FE_DOMAIN_V2 || "http://localhost:3000";

// frontend class this to check is authenticated
router.get("/login/success", (req, res) => {
  console.log("================================================");
  console.log(req);
  console.log(req.user);
  console.log("================================================");

  return res.status(200).json({
    success: true,
    message: "success",
    user: req.user,
    // cookies: req.user
  });
});

router.get("/login/failure", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Unauthorized",
  });
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: CLIENT_URL,
    failureRedirect: "/login/failure",
  })
);

// ---- note: not using fetch, axios to get this ===> using [a href] to get this router ------------
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(CLIENT_URL);
});

module.exports = router;
