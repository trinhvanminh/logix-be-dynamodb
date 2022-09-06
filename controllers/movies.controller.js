const ObjectId = require("bson").ObjectId;
const Movies = require("../models/movies.model");
const Rate = require("../models/rate.model");
const { verify } = require("jsonwebtoken");
require("dotenv").config();

const MoviesController = {
  // GET /
  index: async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];
    const decoded = token && verify(token, process.env.JWT_SECRET);
    const userId = decoded && decoded.userId;

    try {
      const movies = await Movies.find();
      if (!movies)
        return res
          .status(400)
          .json({ success: false, message: "Movies not found" });

      if (userId) {
        // insert my_rate_status
        const my_rates = await Rate.find({ user_id: userId });
        const newMovies = JSON.parse(JSON.stringify(movies)).map((movie) => {
          const my_rate_status = my_rates.find((rate) =>
            rate.movie_id.equals(movie._id)
          )?.rate_status;
          movie.my_rate_status = my_rate_status;
          return movie;
        });

        //insert like, dislike, rate
        const moviesWithMetadata = newMovies.map((movie) => {
          const getMovieLikeDislikes = async () => {
            const movie_rates = await Rate.find({
              movie_id: ObjectId(movie._id),
            });
            if (!movie_rates) return movie;

            let like_count = 0;
            let dislike_count = 0;

            movie_rates.forEach((movie_rate) => {
              if (movie_rate?.rate_status === 1) like_count++;
              if (movie_rate?.rate_status === -1) dislike_count++;
            });

            if (like_count === 0)
              return {
                like_count,
                dislike_count,
                rate: 0,
              };

            const rate = parseInt(
              (like_count / (like_count + dislike_count)) * 5
            );

            return { like_count, dislike_count, rate };
          };
          return getMovieLikeDislikes().then((res) => ({
            ...movie,
            ...res,
          }));
        });

        const listValues = await Promise.all(moviesWithMetadata);

        return res.status(200).json({
          success: true,
          movies: listValues,
        });
      }

      res.status(200).json({ success: true, movies });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /
  createMovie: async (req, res) => {
    const { title, thumbnail_url, description } = req.body;

    // Simple validation
    if (!title || !thumbnail_url)
      return res.status(400).json({
        success: false,
        message: "Missing title and/or thumbnail_url",
      });

    try {
      const movie = new Movies({ title, thumbnail_url, description });
      await movie.save();

      res.json({
        success: true,
        message: "Movie created successfully",
        movie,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // PATCH /:id
  updateMovie: async (req, res) => {
    const { id } = req.params;
    const payload = req.body;

    try {
      //find one and update
      const movie = await Movies.findOneAndUpdate({ _id: id }, payload, {
        new: true,
      });

      if (!movie)
        return res.status(400).json({
          success: false,
          message: "Movie not found",
        });

      // All good
      res.json({
        success: true,
        message: "Movie updated successfully",
        movie,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // DELETE /:id
  deleteMovie: async (req, res) => {
    const { id } = req.params;
    try {
      const movie = await Movies.findOneAndDelete({ _id: id });

      if (!movie)
        return res.status(400).json({
          success: false,
          message: "Movie not found",
        });

      // All good
      res.json({
        success: true,
        message: "Movie deleted successfully",
        movie,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /
  deleteMoviesWithConditional: async (req, res) => {
    const payload = req.body;
    try {
      const movie = await Movies.deleteMany(payload);

      if (!movie)
        return res.status(400).json({
          success: false,
          message: "Movie not found",
        });

      // All good
      res.json({
        success: true,
        message: "Movie deleted successfully",
        movie,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = MoviesController;
