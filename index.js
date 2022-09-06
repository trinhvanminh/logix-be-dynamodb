require("dotenv").config();
const express = require("express");
const app = express();
const route = require("./routes/index.route");
// const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const port = process.env.PORT || 5000;

// set body-parse to parse req.body
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// set static folder
app.use(express.static(path.join(__dirname, "public")));

//	HTTP logger
// app.use(morgan("combined"));

app.use(cors());

// Routes
route(app);

// CONNECT DB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongodb connected successfully");
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));
