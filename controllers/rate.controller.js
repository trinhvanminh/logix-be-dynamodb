const Rate = require("../models/rate.model");

const RateController = {
  // GET /
  index: async (req, res) => {
    try {
      const rates = await Rate.find();
      if (!rates)
        return res
          .status(400)
          .json({ success: false, message: "Rate collection not found" });
      res.json({ success: true, rates });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /
  createRate: async (req, res) => {
    const { movie_id, rate_status } = req.body;

    // Simple validation
    if (!movie_id || !rate_status)
      return res.status(400).json({
        success: false,
        message: "Please check your input",
      });

    try {
      const rate = new Rate({ user_id: req.userId, movie_id, rate_status });
      await rate.save();

      res.json({
        success: true,
        message: "Rate created successfully",
        rate,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // PATCH /:movie_id
  updateRate: async (req, res) => {
    const { movie_id } = req.params;
    const { rate_status } = req.body;
    const user_id = req.userId;

    if (!movie_id || (rate_status !== 0 && !rate_status)) {
      return res.status(400).json({
        success: false,
        message: "Please check your input",
      });
    }

    try {
      //find one and update
      // const rate = await Rate.findOneAndUpdate({ _id: id }, payload, {
      //   new: true,
      // });
      //create or update
      const rate = await Rate.update(
        { movie_id, user_id },
        { rate_status },
        { upsert: true, setDefaultsOnInsert: true }
      );

      if (!rate)
        return res.status(400).json({
          success: false,
          message: "Rate not found",
        });

      // All good
      res.json({
        success: true,
        message: "Rate created/updated successfully",
        rate,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // GET /me
  getMyRate: async (req, res) => {
    const userId = req.userId;
    try {
      const rates = await Rate.find({ user_id: userId });
      if (!rates)
        return res
          .status(400)
          .json({ success: false, message: "Rates collection not found" });
      res.json({ success: true, rates });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = RateController;
