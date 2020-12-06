const express = require('express')
const app = express()
const port = 3000
const path = require("path");

// Set up the app to listen on a port and respond to requests
let publicPath = path.resolve(__dirname, "public")
app.use(express.static(publicPath))
app.listen(port, () => console.log(`Listening on port ${port}`))
app.get('/movies/', getMovies)
app.post('/create', createDatabase)
app.post('/delete', deleteDatabase)

// constants for working with AWS bucket & dynamo db
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
AWS.config.update({
    region: 'us-east-1'
});
const dynamodb = new AWS.DynamoDB();

function createDatabase(req, res){
    let params = {
        TableName : "Movies",
        KeySchema: [       
            { AttributeName: "year", KeyType: "HASH"},  //Partition key
            { AttributeName: "title", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 1, 
            WriteCapacityUnits: 1
        }
    };

    dynamodb.createTable(params, async function(err, data) {
        if (err) {
            console.error("Unable to create table. Error JSON:", 
                JSON.stringify(err, null, 2));
        } else {
            console.log("Created table. Table description JSON:", 
                JSON.stringify(data, null, 2));
            s3.getObject(
                { Bucket: "csu44000assign2useast20", Key: "moviedata.json" },
                async function (error, data) {
                  if (error != null) {
                    console.log("Failed to retrieve an object: " + error);
                  } else {
                    console.log("Loaded " + data.ContentLength + " bytes");
                    let bucketData = JSON.parse(data.Body)
                    // Ensure that the table creation has been completed before 
                    // trying to populate it:
                    await dynamodb.waitFor("tableExists", {TableName: "Movies"}).promise(); 
                    let docClient = new AWS.DynamoDB.DocumentClient();
                    bucketData.forEach(function(movie) {
                        var params = {
                            TableName: "Movies",
                            Item: {
                                "year":  movie.year,
                                "title": movie.title,
                                "info":  movie.info
                            }
                        };
                        docClient.put(params, function(err, data) {
                           if (err) {
                               console.error("Unable to add movie", movie.title, 
                                ". Error JSON:", JSON.stringify(err, null, 2));
                           }
                        });
                    });
                    console.log("Successfully populated database");
                  }
                }
              );
        }
    });
}

function deleteDatabase(req, res){
    let params = {
        TableName : "Movies"
    };
    dynamodb.deleteTable(params, function(err, data) {
        if (err) {
            console.error("Unable to delete table. Error JSON:", 
                JSON.stringify(err, null, 2));
        } else {
            console.log("Deleted table. Table description JSON:", 
                JSON.stringify(data, null, 2));
        }
    });
}

function getMovies(req, res){
    let title = req.query.title;
    let year = req.query.year;
    console.log("request received, " + title + ", " + year);
    
    let params = {
        TableName : "Movies",
        KeyConditionExpression: "#yr = :yyyy and begins_with(title, :t)",
        ExpressionAttributeNames:{
            "#yr": "year"
        },
        ExpressionAttributeValues: {
            ":yyyy": parseInt(year),
            ":t": title
        }
    };

    var docClient = new AWS.DynamoDB.DocumentClient();
    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", 
                JSON.stringify(err, null, 2));
            return res.status(400).json(err)
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function(item) {
                console.log(" -", item.year + ": " + item.title);
            });
            return res.status(200).json(data)
        }
    });
}