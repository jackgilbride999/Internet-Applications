//  Create an express app
const https = require('https');
const express = require('express')
const app = express()
const port = 3000
const path = require("path")
const { response, json } = require('express')
let publicPath = path.resolve(__dirname, "public")

app.use(express.static(publicPath))
app.listen(port, () => console.log(`Listening on port ${port}`))
app.get('/weather/:city', getWeather)

function getWeather(req, res){
    console.log("weather")
    let city = req.params.city;
    var url = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&APPID=3e2d927d4f28b456c6bc662f34350957";
   
    https.get(url, (response) => {
        let todo = '';
        // append each chunk to the response
        response.on('data', (chunk) => {
            todo += chunk;
        })

        response.on('end', () => {
            console.log(JSON.stringify(JSON.parse(todo)))
            res.json(todo)
            if(todo.includes("rain")){
                console.log("Prepare for rain!")
            } else {
                console.log("No need to bring an umbrella!")
            }
        })
    }
    )
}

