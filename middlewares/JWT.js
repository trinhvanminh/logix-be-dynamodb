require("dotenv").config();
const { sign, verify } = require("jsonwebtoken");
const createTokens = (userId) => {
  const accessToken = sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });
  return accessToken;
};

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Access token not found" });

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

module.exports = { createTokens, verifyToken };
