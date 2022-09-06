require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const ddb = require("../db/config/index");
const parseDBItem = require("../utils/parseDBItem");
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
      const result = parseDBItem(movies.Items);
      res.status(200).json({ success: true, movies: result });
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
