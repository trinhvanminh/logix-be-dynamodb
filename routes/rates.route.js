const express = require("express");
const router = express.Router();
const RateController = require("../controllers/rate.controller");
const { verifyToken } = require("../middlewares/JWT");

// rates/
router.get("/", verifyToken, RateController.index);
router.post("/", verifyToken, RateController.createRate);
router.patch("/:movie_id", verifyToken, RateController.updateRate);
router.get("/me", verifyToken, RateController.getMyRate);

module.exports = router;
