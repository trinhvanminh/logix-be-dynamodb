// https://github.com/trinhvanminh/fullstack-nodejs-react-oauth2/blob/master/services/passport.js

const { v4: uuidv4 } = require("uuid");
const ddb = require("../../db/config/index");
require("dotenv").config();
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");

passport.serializeUser((user, done) => {
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
        const existedId = await ddb.client.get(isExistedparams).promise();
        if (existedId?.Item) {
          done(null, existedId.Item);
          return;
        }
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
        ddb.client.put(params, done);
      }
    }
  )
);
