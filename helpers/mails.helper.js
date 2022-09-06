require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

function sendMail(mailOptions) {
  return new Promise((resolve, reject) => {
    const accessToken = oAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "tvminh261198@gmail.com",
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
}

exports.sendResetPasswordEmail = ({ toUser, accessToken }) => {
  const mailOptions = {
    from: "Logex <no-reply@logexfilm.com>",
    to: toUser,
    subject: "Reset password", // Subject line
    text: "Please confirm your reset password request.", // plain text body
    html: `<b><a href="${process.env.FE_DOMAIN}/reset-password/confirm/${accessToken}" target="_blank">Confirm!!</a></b>`, // html body
  };
  return sendMail(mailOptions);
};
