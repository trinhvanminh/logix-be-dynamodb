const ddb = require("../../config/index");
(async () => {
  const params = {
    TableName: "Movies",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }, // Partition key
    ],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
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
