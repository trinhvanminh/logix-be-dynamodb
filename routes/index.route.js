function route(app) {
  app.use("/api/movies", require("./movies.route"));
  app.use("/api/auth", require("./auth.route"));
}

module.exports = route;
