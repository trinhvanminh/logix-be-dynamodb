const express = require("express");
const router = express.Router();
const MoviesController = require("../controllers/movies.controller");
const { verifyToken } = require("../middlewares/JWT");

// movies/
router.get("/", MoviesController.index);
router.post("/", verifyToken, MoviesController.createMovie);
router.patch("/:id", verifyToken, MoviesController.updateMovie);
router.delete("/:id", verifyToken, MoviesController.deleteMovie);

router.delete("/", verifyToken, MoviesController.deleteMoviesWithConditional);

module.exports = router;
