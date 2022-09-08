const { v4: uuidv4 } = require("uuid");
const ddb = require("../db/config");

const isExistingRate = async ({ id, user_id, movie_id }) => {
  if (id) {
    const params = {
      TableName: "Rate",
      Key: { id },
    };
    const existedRateById = await ddb.client.get(params).promise();
    if (existedRateById?.Count > 0) {
      return true;
    }
  }
  const checkExistedRateParams = {
    TableName: "Rate",
    IndexName: "movie_id_index",
    ExpressionAttributeValues: {
      ":movie_id": movie_id,
      ":user_id": user_id,
    },
    KeyConditionExpression: "movie_id = :movie_id",
    FilterExpression: "user_id = :user_id",
  };

  const existedRate = await ddb.client.query(checkExistedRateParams).promise();
  if (existedRate?.Count > 0) {
    return true;
  }
};

const getDetailRate = async ({ id, user_id, movie_id }) => {
  if (id) {
    const params = {
      TableName: "Rate",
      Key: { id },
    };
    const existedRateById = await ddb.client.get(params).promise();
    if (existedRateById?.Count > 0) {
      return existedRateById;
    }
  }
  if (!user_id || !movie_id) return;

  const checkExistedRateParams = {
    TableName: "Rate",
    IndexName: "movie_id_index",
    ExpressionAttributeValues: {
      ":movie_id": movie_id,
      ":user_id": user_id,
    },
    KeyConditionExpression: "movie_id = :movie_id",
    FilterExpression: "user_id = :user_id",
  };

  const existedRate = await ddb.client.query(checkExistedRateParams).promise();
  if (existedRate?.Count > 0) {
    return existedRate.Items[0];
  }
};

const getRatesByUserIdOrMovieId = async ({ user_id, movie_id }) => {
  let rates;
  if (user_id) {
    const userParams = {
      TableName: "Rate",
      IndexName: "user_id_index",
      ExpressionAttributeValues: {
        ":user_id": user_id,
      },
      KeyConditionExpression: "user_id = :user_id",
    };
    rates = await ddb.client.query(userParams).promise();
  } else if (movie_id) {
    const movieParams = {
      TableName: "Rate",
      IndexName: "movie_id_index",
      ExpressionAttributeValues: {
        ":movie_id": movie_id,
      },
      KeyConditionExpression: "movie_id = :movie_id",
    };
    rates = await ddb.client.query(movieParams).promise();
  }
  if (rates?.Count > 0) {
    return rates.Items;
  }
};
const RateController = {
  // GET /
  index: async (req, res) => {
    try {
      const params = {
        TableName: "Rate",
      };
      const rates = await ddb.client.scan(params).promise();
      if (!rates)
        return res
          .status(400)
          .json({ success: false, message: "Rate collection not found" });
      res.json({ success: true, rates: rates?.Items });
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
    if (!movie_id || (rate_status != 0 && !rate_status))
      return res.status(400).json({
        success: false,
        message: "Please check your input",
      });

    if (!user_id)
      return res.status(400).json({
        success: false,
        message: "check your token",
      });

    try {
      // check is existing rate
      const isExistedRate = await isExistingRate({
        user_id: req.userId,
        movie_id,
      });

      if (isExistedRate)
        return res.status(400).json({
          success: false,
          message: "Rate already exists",
        });
      // create new rate
      const params = {
        TableName: "Rate",
        Item: { id: uuidv4(), user_id: req.userId, movie_id, rate_status },
      };
      ddb.client.put(params, (err, rate) => {
        if (err) {
          console.error(err);
          return res.status(400).json({
            success: false,
            message: "Failed to create rate",
            error: err,
          });
        }
        res.json({
          success: true,
          message: "Rate created successfully",
          rate,
        });
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
    if (!user_id)
      return res.status(400).json({
        success: false,
        message: "check your token",
      });

    try {
      const rate = await getDetailRate({ user_id, movie_id });
      if (!rate) {
        // create new rate
        const createParams = {
          TableName: "Rate",
          Item: { id: uuidv4(), user_id: req.userId, movie_id, rate_status },
        };
        ddb.client.put(createParams, (err, rate) => {
          if (err) {
            console.error(err);
            return res.status(400).json({
              success: false,
              message: "Failed to create rate",
              error: err,
            });
          }
          res.json({
            success: true,
            message: "Rate created successfully",
            rate,
          });
        });
      } else {
        const params = {
          TableName: "Rate",
          Key: { id: rate.id },
          // ConditionExpression: 'attribute_exists(id)',
          UpdateExpression: "set rate_status = :new_rates_tatus",
          ExpressionAttributeValues: {
            ":new_rates_tatus": rate_status,
          },
        };

        const updatedRate = await ddb.client.update(params).promise();
        if (!updatedRate)
          return res.status(400).json({
            success: false,
            message: "Rate not found",
          });

        // All good
        res.json({
          success: true,
          message: "Rate created/updated successfully",
          rate: updatedRate,
        });
      }
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
    if (!userId)
      return res.status(400).json({
        success: false,
        message: "Check your token",
      });

    try {
      const my_rates = await getRatesByUserIdOrMovieId({ user_id: userId });
      if (!my_rates)
        return res
          .status(400)
          .json({ success: false, message: "Rates collection not found" });
      res.json({ success: true, rates: my_rates });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = RateController;
module.exports.getRatesByUserIdOrMovieId = getRatesByUserIdOrMovieId;
