# Reactive Internet Application
The goal of this assignment is to develop a simple Internet Application which demonstrates the following:
- A **reactive client** running in an Internet Browser using **Vue.js** - demonstrating some simple knowledge of the V-directives and mustache syntax and interacting with a Server-Side application using at least one **Web API primitive**.
- A **server-side** application which exposes at least one **API primitie** and consumes the services of a **3rd party Web API**.

Produce an application that inputs the city that someone is planning to go to. The server-side should use the OpenWeatherMap API to get the weather forecast for that city for the next 5 days. You should then display for the user some summary information including:
- Packing: if there is rain anytime over the next 5-days indicate that the user should bring an umbrella.
- Indicate whether the user should pack for cold (temp range -10..+10), warm (+10..+20) or hot(20+).
- Give a summary table for the next 5 days showing: temperature, wind speed and rainfall level.

# Prerequisites
- Node.js installed locally with the express package

# Usage
- Clone this repository.
- Navigate to the root of this repository from your terminal.
- Enter `npm install` to install the necessary dependencies.
- Enter `node server.js`. This will start the server, running on localhost port 3000.
- Open your web browser and navigate to `localhost:3000\client.html`. You should be brought to a page prompting you to enter a city and country code. 
- Enter a city (e.g. `Dublin`) and a country code (e.g. `IE`) into the relevant text boxes. Press the "Get Weather" button.
- If your input is valid (and the API key that we were given is still in use!), the webpage should display the relevant data.

# API Key
- We were provided with an OpenWeatherMap API key to carry out this assignment. If it is invalid at time of use, simply sign up for one and replace it in line 18 of [server.js](\server.js). The app requires only a free-tier API key to work.