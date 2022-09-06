function route(app) {
  app.use("/api/auth", require("./auth.route"));
  app.use("/api/movies", require("./movies.route"));
  app.use("/api/rates", require("./rates.route"));
}

module.exports = route;
