require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const ddb = require("../db/config/index");
const parseDBItem = require("../utils/parseDBItem");
const { getRatesByUserIdOrMovieId } = require("../controllers/rate.controller");
const { verify } = require("jsonwebtoken");
const MoviesController = {
  // GET /api/movies/
  index: async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];
    const decoded = token && verify(token, process.env.JWT_SECRET);
    const userId = decoded && decoded.userId;

    try {
      const params = {
        TableName: "Movies",
      };
      const movies = await ddb.dynamodb.scan(params).promise();
      if (!movies?.Items)
        return res
          .status(400)
          .json({ success: false, message: "Movies not found" });
      const moviesItems = parseDBItem(movies.Items);
      if (userId) {
        // insert my_rate_status
        const my_rates = await getRatesByUserIdOrMovieId({ user_id: userId });
        const newMovies = JSON.parse(JSON.stringify(moviesItems)).map(
          (movie) => {
            const my_rate_status = my_rates.find(
              (rate) => (rate.movie_id = movie.id)
            )?.rate_status;
            movie.my_rate_status = my_rate_status;
            return movie;
          }
        );

        //insert like, dislike, rate
        const moviesWithMetadata = newMovies.map((movie) => {
          const getMovieLikeDislikes = async () => {
            const movie_rates = await getRatesByUserIdOrMovieId({
              movie_id: movie.id,
            });
            if (!movie_rates) return movie;

            let like_count = 0;
            let dislike_count = 0;

            movie_rates.forEach((movie_rate) => {
              if (movie_rate?.rate_status >= 1) like_count++;
              if (movie_rate?.rate_status <= -1) dislike_count++;
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

      res.status(200).json({ success: true, movies: moviesItems });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /api/movies/
  createMovie: async (req, res) => {
    const { title, thumbnail_url, description } = req.body;

    // Simple validation
    if (!title || !thumbnail_url)
      return res.status(400).json({
        success: false,
        message: "Missing title and/or thumbnail_url",
      });

    try {
      const params = {
        TableName: "Movies",
        Item: {
          id: uuidv4(),
          title,
          thumbnail_url,
          description,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
        },
        // ReturnValues: "ALL_OLD",
      };
      ddb.client.put(params, (err, data) => {
        if (err) {
          console.log("Error", err);
        } else
          res.json({
            success: true,
            message: "Movie created successfully",
            movie: data,
          });
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // GET /api/movies/:id
  getMovie: async (req, res) => {
    const { id } = req.params;
    try {
      const params = {
        TableName: "Movies",
        Key: {
          id: id,
        },
        ReturnValues: "ALL_OLD",
      };
      const movie = await ddb.client.get(params).promise();
      if (!movie?.Item)
        return res.status(400).json({
          success: false,
          message: "Movie not found",
        });

      // All good
      res.json({
        success: true,
        message: "success",
        movie: movie.Item,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // DELETE /api/movies/:id
  deleteMovie: async (req, res) => {
    const { id } = req.params;
    try {
      const params = {
        TableName: "Movies",
        Key: {
          id: id,
        },
        ReturnValues: "ALL_OLD",
      };
      const movie = await ddb.client.delete(params).promise();
      if (!movie?.Attributes)
        return res.status(400).json({
          success: false,
          message: "Movie not found",
        });

      // All good
      res.json({
        success: true,
        message: "Movie deleted successfully",
        movie: movie.Attributes,
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
