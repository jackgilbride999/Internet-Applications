const https = require('https');
const express = require('express')
const app = express()
const port = 3000
const path = require("path");
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
AWS.config.update({
    region: 'us-east-1'
});

var dynamodb = new AWS.DynamoDB();



// Set up the app to listen on a port, respond to page requests and return to movie requests
let publicPath = path.resolve(__dirname, "public")
app.use(express.static(publicPath))
app.listen(port, () => console.log(`Listening on port ${port}`))
app.get('/movies/', getMovies)
app.get('/create/', createDatabase)
app.get('/delete/', deleteDatabase)

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
    
    s3.getObject(
        { Bucket: "csu44000assign2useast20", Key: "moviedata.json" },
        function (error, data) {
          if (error != null) {
            console.log("Failed to retrieve an object: " + error);
            return res.status(400).json(err)
          } else {
            console.log("Loaded " + data.ContentLength + " bytes");
            let bucketData = JSON.parse(data.Body)
            console.log(bucketData)
            dynamodb.createTable(params, function(err, data) {
                if (err) {
                    console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
                    return res.status(400).json(err)
                } else {
                    console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
                    //return res.status(200).send('Successul')
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
                               console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
                               return res.status(400).json(err)
                           } else {
                               console.log("PutItem succeeded:", movie.title);
                           }
                        });
                    });
                    return res.status(200).send('Successfully created database.')
                }
            });
          }
        }
      );
}

function deleteDatabase(req, res){
    let params = {
        TableName : "Movies"
    };

    dynamodb.deleteTable(params, function(err, data) {
        if (err) {
            console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
            return res.status(400).json(err)
        } else {
            console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
            return res.status(200).send('Successul')
        }
    });
}

// The function to response to forecast requests for a city
function getMovies(req, res){
    // Parse out the city and call the OpenWeatherMap API
    let title = req.query.title;
    let year = req.query.year;
    console.log("request received, " + title + ", " + year);
    


    /*
    var url = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&APPID=3e2d927d4f28b456c6bc662f34350957&units=metric";
   
    // Handle the response
    https.get(url, (response) => {
        // Start with an empty response
        let todo = '';
        // append each chunk to the response so far
        response.on('data', (chunk) => {
            todo += chunk;
        })

        // when the chunks have all been received
        response.on('end', () => {
            // parse the response and pass an error response to the client if applicable
            var openWeatherJSON = JSON.parse(todo)
            if(openWeatherJSON.cod == 404){
               res.json({
                   code: 404,
                   message: openWeatherJSON.message
                })
            } else {
                /*
                The JSON should indicate:
                - Whether the user should bring an umbrella (there is rain at any stage)
                - Whether the user should pack for cold (-10..+10), warm (+10..+20) or hot (20+) weather
                - A summary for the next 5 days including: temperature, wind speed and rainfall
                */
               /*
                var summaryForClient = {
                    code: 200,
                    city: openWeatherJSON.city.name,
                    country: openWeatherJSON.city.country,
                    rain: false,
                    cold: false,
                    warm: false,
                    hot: false,
                    list: []
                };

                // All code from here to the for loop processes the first item in the OpenWeatherMap JSON
                var responseItem = openWeatherJSON.list[0];
                var prev_item_date = responseItem.dt_txt.split(" ")[0];
                // Add the first time forcast for today to the date array
                var dayArray = [
                    {
                        date_time: responseItem.dt_txt,
                        temp: responseItem.main.temp,
                        wind_speed: responseItem.wind.speed,
                        rain: 0.00
                    }
                ];
                // Check the first item of today to see if any of the packing conditions are true
                if (responseItem.rain != null){
                    dayArray[0].rain = responseItem.rain['3h'];
                    summaryForClient.rain = true;
                }
                if (responseItem.main.temp < 10){
                    summaryForClient.cold = true;
                } else if (responseItem.main.temp < 20){
                    summaryForClient.warm = true;
                } else {
                    summaryForClient.hot = true;
                }

                // Set up the variables to keep track of which date we are on, and which time of that date we are on 
                var dayIndex = 0;
                var timeIndex = 0;
                
                // Iterate through the remaining items in the OpenWeatherMap JSON
                for(var i = 1; i < openWeatherJSON.list.length; i++){
                    responseItem = openWeatherJSON.list[i];
                    var current_item_date = responseItem.dt_txt.split(" ")[0];
                    // If we are not on the last time entry and the current date is the same as the last, we just need to increment the time index
                    if(current_item_date == prev_item_date && i!=openWeatherJSON.list.length-1){
                        timeIndex++;
                    } 
                    // Otherwise, we need to increment the day index, and reset the time index back to 0
                    // Before we do this, we need to compute sums and averages of the time values for the current day
                    // This will give a summary of the day, which is added to the array to send back to the client
                    else {
                        // Initialise sums, compute sums/averages, add summary of day to client response array
                        var sum_temp = 0.00;
                        var sum_wind_speed = 0.00;
                        var sum_rain = 0.00;
                        var numItems = dayArray.length;

                        for(t = 0; t<dayArray.length; t++){
                            sum_temp += dayArray[t].temp;
                            sum_wind_speed += dayArray[t].wind_speed;
                            sum_rain += dayArray[t].rain;
                        }
                        
                        summaryForClient.list[dayIndex] = {
                            date_time: prev_item_date,
                            temp: (sum_temp/numItems).toFixed(2),
                            wind_speed: (sum_wind_speed/numItems).toFixed(2),
                            rain: (sum_rain).toFixed(2)
                        }

                        // Change the index values to signify that it is a new day
                        dayIndex++;
                        timeIndex = 0;
                        dayArray = [];
                    }

                    // Add the relevant fields of the time value to the day array
                    // On a future iteration of the loop this will be used in the calculation of sums/averages for the day (in the else statement above)
                    dayArray[timeIndex] = {
                        date_time: responseItem.dt_txt,
                        temp: responseItem.main.temp,
                        wind_speed: responseItem.wind.speed,
                        rain: 0.00
                    }

                    // Check if this time satisfies any of the packing conditions
                    if (responseItem.rain != null){
                        dayArray[timeIndex].rain = responseItem.rain['3h'];
                        summaryForClient.rain = true;
                    }
                    if (responseItem.main.temp < 10){
                        summaryForClient.cold = true;
                    } else if (responseItem.main.temp < 20){
                        summaryForClient.warm = true;
                    } else {
                        summaryForClient.hot = true;
                    }
                    prev_item_date = current_item_date;
                }

                /*
                    At this point, the server has:
                    - Parsed the city from the client's request
                    - Requested a five day forecast from the OpenWeatherMap API
                    - For each day, iterated through each of the time values and created a summary of that day (avg temp, avg wind speed, total rainfall)
                    - Added the summary to a summary array to send back to the client
                    - If any of the time values satisfied the conditions for cold weather, warm weather, hot weather or bringing an umbrella, these flags were set true
                    - The summary array and flags have been packaged into the JSON
                    - All that is left to do, is respond to the client with the JSON, done below:
                */
                //res.json(summaryForClient)
  //          }
  //      })
  //  }
  //  )
}