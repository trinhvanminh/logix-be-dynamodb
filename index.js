require("dotenv").config();
require("./oauth2/config/index");
const express = require("express");
const app = express();
const route = require("./routes/index.route");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session"); //oauth2 Login sessions require session support
const passport = require("passport");
// const morgan = require("morgan");
const port = process.env.PORT || 5000;

// set body-parse to parse req.body
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// set static folder
app.use(express.static(path.join(__dirname, "public")));

// // https logger
// app.use(morgan("combined"));

//express-session
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(cors());

// Routes
route(app);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
