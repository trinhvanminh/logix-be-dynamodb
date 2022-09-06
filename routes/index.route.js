function route(app) {
  app.use("/api/movies", require("./movies.route"));
}

module.exports = route;
