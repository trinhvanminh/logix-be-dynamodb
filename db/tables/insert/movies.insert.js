const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { client } = require("../../config");

const putItem = ({ title, thumbnail_url, description }) => {
  const params = {
    TableName: "Movies",
    Item: {
      id: uuidv4(),
      title,
      thumbnail_url,
      description,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    },
  };
  client.put(params, (err, data) => {
    if (err) {
      console.log("Error", err);
      return err;
    }
  });
};

fs.readFile("./db/fakeData/movies.json", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  JSON.parse(data).forEach((movie) => {
    const err = putItem(movie);
    if (err) {
      console.error(err);
    }
  });
});
