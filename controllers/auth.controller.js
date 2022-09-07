const { v4: uuidv4 } = require("uuid");
const argon2 = require("argon2");
const { createTokens } = require("../middlewares/JWT");
const nodeMailer = require("nodemailer");
const { sendResetPasswordEmail } = require("../helpers/mails.helper");
const ddb = require("../db/config/index");

const isExistingUser = async (email, username) => {
  const checkExistedEmailParams = {
    TableName: "Auth",
    IndexName: "email_index",
    ExpressionAttributeValues: {
      ":email": email,
    },
    KeyConditionExpression: "email = :email",
  };

  const existedEmail = await ddb.client
    .query(checkExistedEmailParams)
    .promise();

  if (existedEmail?.Count > 0) {
    return true;
  }
  const checkExistedUsernameParams = {
    TableName: "Auth",
    IndexName: "username_index",
    ExpressionAttributeValues: {
      ":username": username,
    },
    KeyConditionExpression: "username = :username",
  };

  const existedUsername = await ddb.client
    .query(checkExistedUsernameParams)
    .promise();

  if (existedUsername?.Count > 0) {
    return true;
  }
};

const getUser = async ({ email, username, id }) => {
  let user;
  if (id) {
    const params = {
      TableName: "Auth",
      ExpressionAttributeValues: {
        ":id": id,
      },
      KeyConditionExpression: "id = :id",
    };
    user = await ddb.client.query(params).promise();
  } else if (email) {
    const emailParams = {
      TableName: "Auth",
      IndexName: "email_index",
      ExpressionAttributeValues: {
        ":email": email,
      },
      KeyConditionExpression: "email = :email",
    };
    user = await ddb.client.query(emailParams).promise();
  } else if (username) {
    const usernameParams = {
      TableName: "Auth",
      IndexName: "username_index",
      ExpressionAttributeValues: {
        ":username": username,
      },
      KeyConditionExpression: "username = :username",
    };
    user = await ddb.client.query(usernameParams).promise();
  }
  if (user?.Count > 0) {
    return user.Items[0];
  }
};

const AuthController = {
  // GET /
  index: async (req, res) => {
    try {
      const user = await getUser({ id: req.userId });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User not found" });

      // remove password from response
      delete user.password;

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /login
  login: async (req, res) => {
    const { username, password, email } = req.body;

    // Simple validation
    if (!password || (!username && !email))
      return res.status(400).json({
        success: false,
        message: "Missing username/email and/or password",
      });

    try {
      // Check for existing user
      const user = await getUser({ email, username });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect username or password" });
      }
      // Username found
      const passwordValid = await argon2.verify(user.password, password);
      if (!passwordValid)
        return res
          .status(400)
          .json({ success: false, message: "Incorrect username or password" });

      // All good
      // Return token
      const accessToken = createTokens(user.id);
      res.json({
        success: true,
        message: "User logged in successfully",
        accessToken,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /register
  register: async (req, res) => {
    const { username, password, email } = req.body;

    // Simple validation
    if (!password || !username || !email)
      return res.status(400).json({
        success: false,
        message: "Missing username and/or password and/or email",
      });

    try {
      const hashedPassword = await argon2.hash(password);

      // // https://stackoverflow.com/questions/67281739/how-to-check-if-username-or-email-exist-in-dynamodb-using-node-js-express/67283887#67283887
      // const params = {
      //   TableName: "Auth",
      //   Item: {
      //     id: uuidv4(),
      //     username,
      //     password: hashedPassword,
      //     email,
      //   },
      //   ConditionExpression:
      //     "attribute_not_exists(email) AND attribute_not_exists(username)",
      // };
      // ddb.client.put(params, (err, user) => {
      //   if (err)
      //     return res.status(400).json({
      //       success: false,
      //       message: err,
      //     });

      //   // Return token
      //   const accessToken = createTokens(params.id);
      //   return res.status(200).json({
      //     success: true,
      //     message: "User created successfully",
      //     accessToken,
      //     user,
      //   });
      // });

      // Check for existing user

      const isExistedUser = await isExistingUser(email, username);
      if (isExistedUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }
      // create user
      const params = {
        TableName: "Auth",
        Item: {
          id: uuidv4(),
          username,
          password: hashedPassword,
          email,
        },
      };
      ddb.client.put(params, (err, user) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            success: false,
            message: "Failed to create user",
            error: err,
          });
        }
        // Return token
        const accessToken = createTokens(params.id);
        return res.json({
          success: true,
          message: "User created successfully",
          accessToken,
          user,
        });
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // POST /reset-password
  resetPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Missing email to reset password" });

      const user = await getUser({ email });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User not found" });

      console.log(user);
      const accessToken = createTokens(user.id);
      const result = await sendResetPasswordEmail({
        toUser: email,
        accessToken,
      });
      if (result)
        return res.status(200).json({ success: true, message: "Email sent" });
      return res
        .status(400)
        .json({ success: false, message: "Email not sent" });
    } catch (error) {
      console.log(error);
      return res
        .status(400)
        .json({ success: false, message: "Something went wrong" });
    }
  },

  // PATCH /reset-password/confirm/
  confirmResetPassword: async (req, res) => {
    try {
      const { newpassword } = req.body;

      if (!req?.userId)
        return res.status(400).json({
          success: false,
          message: "check your token",
        });

      if (!newpassword) {
        return res.status(400).json({
          success: false,
          message: "Missing new password",
        });
      }
      // update password
      const hashedPassword = await argon2.hash(newpassword);
      const params = {
        TableName: "Auth",
        Key: { id: req.userId },
        UpdateExpression: "set password = :newpassword",
        ExpressionAttributeValues: {
          ":newpassword": hashedPassword,
        },
      };

      const updatedUser = await ddb.client.update(params).promise();
      if (!updatedUser)
        return res.status(400).json({
          success: false,
          message: "User not found",
        });

      res.json({
        success: true,
        message: "Password updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  },
};

module.exports = AuthController;
