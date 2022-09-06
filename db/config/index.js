require("dotenv").config();
const AWS = require("aws-sdk");
AWS.config.update({
  endpoint: process.env.DYNAMO_ENDPOINT || "http://localhost:8000",
  region: process.env.REGION || "local",
});

module.exports = {
  client: new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" }),
  dynamodb: new AWS.DynamoDB(),
};
