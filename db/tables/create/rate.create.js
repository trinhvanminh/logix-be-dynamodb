const ddb = require("../../config/index");
(async () => {
  const params = {
    TableName: "Rate",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }, // Partition key
      // { AttributeName: "user_id", KeyType: "HASH" }, // Partition key
      // { AttributeName: "movie_id", KeyType: "RANGE" }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "user_id", AttributeType: "S" },
      { AttributeName: "movie_id", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: "user_id_index",
        KeySchema: [
          {
            AttributeName: "user_id",
            KeyType: "HASH",
          },
        ],
        Projection: {
          // attributes to project into the index
          ProjectionType: "ALL", // (ALL | KEYS_ONLY | INCLUDE)
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: "movie_id_index",
        KeySchema: [
          {
            AttributeName: "movie_id",
            KeyType: "HASH",
          },
        ],
        Projection: {
          // attributes to project into the index
          ProjectionType: "ALL", // (ALL | KEYS_ONLY | INCLUDE)
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
    ],
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
