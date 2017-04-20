const AWS = require("aws-sdk");

var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
AWS.config.update({region: 'ap-northeast-1'});


const docClient = new AWS.DynamoDB.DocumentClient();

// process.argv.forEach(function (val, index, array) {
//   console.log(index + ': ' + val);
// });

const tableName = process.argv.slice(2);

if (tableName.length == 0) {
  console.error("missing parameter tablename!");
  console.log("example:", "node index.js <tablename>");
  return -1;
}

const items =[
  {
    PutRequest: {
      Item:{
        "id": "photos/2017/image1.jpg",
        "bucketName": "mymobile",
        "virtualPath": "photos/2017/",
        "virtualName": "image1.jpg",
        "guid": "869ed730-23e3-11e7-b3e0-716e71472651"
      }
    }
  },
  {
    PutRequest: {
      Item:{
        "id": "photos/2017/image2.jpg",
        "bucketName": "mydevice",
        "virtualPath": "photos/2017/",
        "virtualName": "image2.jpg",
        "guid": "969ed730-23e3-11e7-b3e0-716e71472651"
      }
    }
  }
];

const params= {RequestItems: {}};
params.RequestItems[tableName] = items;

docClient.batchWrite(params, function(err, data) { 
  if (err) {
    console.error(err)
  } else {
    console.log(data)
  }
});
