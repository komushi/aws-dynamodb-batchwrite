# AWS DynamoDB DocumentClient batchwrite example
## The purposes of this example are
* To remind myself how to pass the table name as parameter.
* To use CloudFormation to setup tables and initialize data

# 1. Setup table with CloudFormation and initialize data with aws-sdk
## 1-1. Prepare the table with CloudFormation template
```setup_table.yaml
---
AWSTemplateFormatVersion: '2010-09-09'
Description: Setup AWS Resources for an example DynamoDb table
Parameters:
  ExampleTableName:
    Description: Name of the example DynamoDb table
    Type: String

Resources:
  ExampleTable:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: http://yaml-cfn-templates.s3.amazonaws.com/snippets/dynamodb-simple-table.yaml
      TimeoutInMinutes: '1'
      Parameters:
        TableName: !Ref ExampleTableName
        TableIdColumnName: 'id'
Outputs:
  AwsRegion:
    Description: AwsRegion
    Value: !Ref AWS::Region
```

## 1-2. Confirm you have the Shared Credentials File
[Setting Credentials in Node.js](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html)

```
$ cat ~/.aws/credentials
[default]
aws_access_key_id = AKIEXAMPLE123243
aws_secret_access_key = EhPTJbhgpc71Fl+1SrrEG2WWCZgpc71Example1
```

## 1-3. Invoke the index.js

```
$ node index.js <table-name>
```

# 2. Setup table and initialize data with CloudFormation
## 1-1. Prepare everything with CloudFormation template
```setup_everything.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Setup AWS Resources for an example DynamoDb table
Parameters:
  ExampleTableName:
    Description: Name of the example DynamoDb table
    Type: String

Resources:
  ExampleTable:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: http://yaml-cfn-templates.s3.amazonaws.com/snippets/dynamodb-simple-table.yaml
      TimeoutInMinutes: '1'
      Parameters:
        TableName: !Ref ExampleTableName
        TableIdColumnName: 'id'
  LambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
        - Effect: Allow
          Principal:
            Service:
            - lambda.amazonaws.com
          Action:
          - sts:AssumeRole
      Path: "/"
      Policies:
        - PolicyName: dynamodbAccessRole
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
            - Effect: Allow
              Action:
              - dynamodb:*
              Resource: "*"
            - Effect: Allow
              Action:
              - logs:*
              Resource: "*"
  InitializeDataFunction:
    Type: AWS::Lambda::Function
    Properties:
      Code:
        ZipFile: >
          const AWS = require("aws-sdk");
          const response = require("cfn-response");
          const docClient = new AWS.DynamoDB.DocumentClient();
          exports.handler = function(event, context) {
            console.log(JSON.stringify(event,null,2));

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
            params.RequestItems[event.ResourceProperties.TableName] = items;

            docClient.batchWrite(params, function(err, data) { 
              if (err) {
                response.send(event, context, response.FAILED, err);
              } else {
                response.send(event, context, response.SUCCESS, data);
              }
            });
          };
      Handler: index.handler
      Role:
        Fn::GetAtt: [ LambdaRole , "Arn" ]
      Runtime: nodejs4.3
      Timeout: 60
  Initialize:
    Type: Custom::Initialize
    DependsOn: ExampleTable
    Properties:
      ServiceToken:
         Fn::GetAtt: [ InitializeDataFunction , "Arn" ]
      TableName: !Ref ExampleTableName

Outputs:
  AwsRegion:
    Description: AwsRegion
    Value: !Ref AWS::Region
```