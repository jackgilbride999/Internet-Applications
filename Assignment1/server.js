//  Create an express app
const https = require('https');
const express = require('express')
const app = express()
const port = 3000
const path = require("path");
const { open } = require('inspector');
let publicPath = path.resolve(__dirname, "public")

app.use(express.static(publicPath))
app.listen(port, () => console.log(`Listening on port ${port}`))
app.get('/weather/:city', getWeather)

function getWeather(req, res){
    console.log("weather")
    let city = req.params.city;
    var url = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&APPID=3e2d927d4f28b456c6bc662f34350957&units=metric";
   
    https.get(url, (response) => {
        let todo = '';
        // append each chunk to the response
        response.on('data', (chunk) => {
            todo += chunk;
        })

        response.on('end', () => {
            var openWeatherJSON = JSON.parse(todo)
        //    console.log(JSON.stringify(openWeatherJSON))

            /*
                The JSON should indicate:
                - Whether the user should bring an umbrella (there is rain at any stage)
                - Whether the user should pack for cold (-10..+10), warm (+10..+20) or hot (20+) weather
                - A summary for the next 5 days including: temperature, wind speed and rainfall
            */
           if(openWeatherJSON.cod == 404){
               res.json({
                   code: 404,
                   message: openWeatherJSON.message
               })
           } else {
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

                var responseItem = openWeatherJSON.list[0];

                var prev_item_date = responseItem.dt_txt.split(" ")[0];
                var dateIndex = 0;
                var hourIndex = 0;
                var dayArray = [
                    {
                        date_time: responseItem.dt_txt,
                        temp: responseItem.main.temp,
                        wind_speed: responseItem.wind.speed,
                        rain: 0.00
                    }
                ];
                console.log(dayArray)
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
                
                for(var i = 1; i < openWeatherJSON.list.length; i++){
                    responseItem = openWeatherJSON.list[i];
                    var current_item_date = responseItem.dt_txt.split(" ")[0];
                    if(current_item_date == prev_item_date && i!=openWeatherJSON.list.length-1){
                        console.log(current_item_date + " equals " + prev_item_date)
                        hourIndex++;
                    } 
                    else {
                        console.log(current_item_date + " doesn't equal " + prev_item_date)
                        var sum_temp = 0.00;
                        var sum_wind_speed = 0.00;
                        var sum_rain = 0.00;
                        var numItems = dayArray.length;

                        for(d = 0; d<dayArray.length; d++){
                            sum_temp += dayArray[d].temp;
                            sum_wind_speed += dayArray[d].wind_speed;
                            sum_rain += dayArray[d].rain;
                        }
                        
                        summaryForClient.list[dateIndex] = {
                            date_time: prev_item_date,
                            temp: (sum_temp/numItems).toFixed(2),
                            wind_speed: (sum_wind_speed/numItems).toFixed(2),
                            rain: (sum_rain).toFixed(2)
                        }
                        dateIndex++;
                        hourIndex = 0;
                        dayArray = [];
                    }
                    dayArray[hourIndex] = {
                        date_time: responseItem.dt_txt,
                        temp: responseItem.main.temp,
                        wind_speed: responseItem.wind.speed,
                        rain: 0.00
                    }
                    if (responseItem.rain != null){
                        dayArray[hourIndex].rain = responseItem.rain['3h'];
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


                console.log(todo)

                // Finally, put the JSON in the response to the client
                res.json(summaryForClient)
            }
        })
    }
    )
}

