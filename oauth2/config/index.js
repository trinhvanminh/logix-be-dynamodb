// https://github.com/trinhvanminh/fullstack-nodejs-react-oauth2/blob/master/services/passport.js

// ========== login with oauth2 will updated existed user information =================
// ========== but can not create new user with that email ==============
// ========== or after login with oauth2 need to create password for both login method (with password or oauth2)===============

const { v4: uuidv4 } = require("uuid");
const ddb = require("../../db/config/index");
require("dotenv").config();
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");

passport.serializeUser((user, done) => {
  console.log("serializeUser", user);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log("deserialized user", id);
  const isExistedparams = {
    TableName: "Auth",
    Key: { id },
  };
  ddb.client.get(isExistedparams, (err, existedId) => {
    done(err, existedId?.Item);
  });
});

const getUser = async (id) => {
  const params = {
    TableName: "Auth",
    Key: { id },
  };
  const user = await ddb.client.get(params).promise();
  return user;
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL || "/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      // console.log(accessToken, profile);
      if (profile?.id) {
        const isExistedparams = {
          TableName: "Auth",
          Key: { id: profile.id },
        };
        const existedIdUser = await ddb.client.get(isExistedparams).promise();
        if (existedIdUser?.Item) {
          done(null, existedIdUser.Item);
          return;
        }

        const isExistedEmailparams = {
          TableName: "Auth",
          IndexName: "email_index",
          ExpressionAttributeValues: {
            ":email": profile.email,
          },
          KeyConditionExpression: "email = :email",
        };
        const existedEmailUser = await ddb.client
          .query(isExistedEmailparams)
          .promise();

        console.log("existedEmailUser", existedEmailUser);
        if (existedEmailUser?.Items?.length > 0) {
          const updateParams = {
            TableName: "Auth",
            Key: { id: existedEmailUser.Items[0].id },
            UpdateExpression:
              "set displayName = :displayName, picture = :picture, provider = :provider",
            ExpressionAttributeValues: {
              ":displayName": profile.displayName,
              ":picture": profile.picture,
              ":provider": profile.provider,
            },
          };

          ddb.client.update(updateParams, (err, data) => {
            getUser(existedEmailUser.Items[0].id)
              .then((user) => {
                console.log("update", user);
                done(null, user.Item);
              })
              .catch((err) => done(err, null));
          });
        } else {
          const params = {
            TableName: "Auth",
            Item: {
              // id: uuidv4(),
              // providerId: profile.id,

              id: profile.id,
              displayName: profile.displayName,
              email: profile.email,
              picture: profile.picture,
              provider: profile.provider,
            },
          };
          ddb.client.put(params, (err, data) => {
            if (err) {
              done(err, null);
              return;
            }

            getUser(profile.id)
              .then((user) => {
                console.log("update", user);
                done(null, user.Item);
              })
              .catch((err) => done(err, null));
          });
        }
      }
    }
  )
);
