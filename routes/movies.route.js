const express = require("express");
const router = express.Router();
const MoviesController = require("../controllers/movies.controller");
const { verifyToken } = require("../middlewares/JWT");

// movies/
router.get("/", MoviesController.index);
router.post("/", MoviesController.createMovie);
router.get("/:id", MoviesController.getMovie);
router.delete("/:id", MoviesController.deleteMovie);

module.exports = router;
