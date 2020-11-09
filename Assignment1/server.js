//  Create an express app
const https = require('https');
const express = require('express')
const app = express()
const port = 3000
const path = require("path")
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
            console.log(JSON.stringify(openWeatherJSON))

            /*
                The JSON should indicate:
                - Whether the user should bring an umbrella (there is rain at any stage)
                - Whether the user should pack for cold (-10..+10), warm (+10..+20) or hot (20+) weather
                - A summary for the next 5 days including: temperature, wind speed and rainfall
            */
            var summaryForClient = {
                rain: false,
                cold: false,
                warm: false,
                hot: false,
                list: []
            };

            for(var i = 0; i < openWeatherJSON.list.length; i++){
                var responseItem = openWeatherJSON.list[i];
                // take the OpenWeatherMap list item, append relevant items to the summary's list
                summaryForClient.list[i] = {
                    date_time: responseItem.dt_txt,
                    temp: responseItem.main.temp,
                    wind_speed: responseItem.wind.speed,
                    rain: 0.00
                }
                // Check if the list item has rain, if it does we can index into it and update the current list item
                // Also set rain to true for the overall array, so the client knows an umbrella is needed
                if (responseItem.rain != null){
                    summaryForClient.list[i].rain = responseItem.rain['3h'];
                    summaryForClient.rain = true;
                }
                // The temperature will either fall within the cold, warm of hot range.
                // Ensure that this is indicated to the client, so the user knows to pack for these temperatures.
                if (responseItem.main.temp < 10){
                    summaryForClient.cold = true;
                } else if (responseItem.main.temp < 20){
                    summaryForClient.warm = true;
                } else {
                    summaryForClient.hot = true;
                }
            }
            // Finally, put the JSON in the response to the client
            res.json(summaryForClient)
        })
    }
    )
}

