const ddb = require("../../config/index");
(async () => {
  const params = {
    TableName: "Auth",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }, // Partition key
      // { AttributeName: "email", KeyType: "HASH" }, // Partition key
      // { AttributeName: "username", KeyType: "RANGE" }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
      { AttributeName: "username", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: "email_index",
        KeySchema: [
          {
            AttributeName: "email",
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
        IndexName: "username_index",
        KeySchema: [
          {
            AttributeName: "username",
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
