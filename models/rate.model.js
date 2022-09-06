const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  movie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movies",
  },
  rate_status: {
    type: Number,
    enum: [-1, 0, 1],
  },
});

module.exports = mongoose.model("Rate", rateSchema);
