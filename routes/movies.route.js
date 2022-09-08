const express = require("express");
const router = express.Router();
const MoviesController = require("../controllers/movies.controller");
const { verifyToken } = require("../middlewares/JWT");

// movies/
router.get("/", MoviesController.index);
router.post("/", verifyToken, MoviesController.createMovie);
router.get("/:id", MoviesController.getMovie);
router.delete("/:id", verifyToken, MoviesController.deleteMovie);

module.exports = router;
