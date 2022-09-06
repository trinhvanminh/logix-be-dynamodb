const ddb = require("../../config/index");
(async () => {
  const params = {
    TableName: "Rate",
    KeySchema: [
      { AttributeName: "user_id", KeyType: "HASH" }, // Partition key
      { AttributeName: "movie_id", KeyType: "RANGE" }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "user_id", AttributeType: "S" },
      { AttributeName: "movie_id", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
  };

  try {
    const result = ddb.dynamodb.createTable(params).promise();
    console.log(
      "Created table. Table description JSON:",
      JSON.stringify(result, null, 2)
    );
  } catch (error) {
    console.error(
      "Unable to create table. Error JSON:",
      JSON.stringify(error, null, 2)
    );
  }
})();
