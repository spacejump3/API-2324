import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";
import { Liquid } from "liquidjs";
import serveStatic from "serve-static";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const app = new App();
const engine = new Liquid();

app.use(serveStatic("public"));

let flights = [];

// schiphol api
app.get("/:page?", async (req, res) => {
  const page = req.params.page || 0;

  const options = {
    hostname: "api.schiphol.nl",
    path: `/public-flights/flights?page=${page}&sort=+scheduleTime`,
    method: "GET",
    headers: {
      ResourceVersion: "v4",
      Accept: "application/json",
      app_id: process.env.APP_ID,
      app_key: process.env.APP_KEY,
    },
  };

  const request = https.request(options, (response) => {
    let chunks = [];

    response.on("data", (chunk) => {
      chunks.push(chunk);
    });

    response.on("end", async () => {
      const body = Buffer.concat(chunks);
      const data = JSON.parse(body.toString());

      if (data && data.flights) {
        flights = data.flights;

        // Fetch airline data for each flight
        const airlinePromises = flights.map((flight) => {
          return new Promise((resolve, reject) => {
            const airlineOptions = {
              hostname: "api.api-ninjas.com",
              path: `/v1/airlines?icao=${flight.prefixICAO}`,
              method: "GET",
              headers: {
                "X-Api-Key": process.env.API_NINJAS_KEY,
              },
            };

            const airlineRequest = https.request(
              airlineOptions,
              (airlineResponse) => {
                let airlineChunks = [];

                airlineResponse.on("data", (chunk) => {
                  airlineChunks.push(chunk);
                });

                airlineResponse.on("end", () => {
                  const airlineBody = Buffer.concat(airlineChunks);
                  const airlineData = JSON.parse(airlineBody.toString());

                  // Log the airline data
                  console.log("Airline data:", airlineData);

                  // Add the airline data to the flight data
                  flight.airlineData = airlineData;

                  resolve();
                });
              }
            );

            airlineRequest.on("error", (error) => {
              console.error("Error:", error);
              reject(error);
            });

            airlineRequest.end();
          });
        });

        // Wait for all airline API requests to complete
        await Promise.all(airlinePromises);

        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(
          today.getMonth() + 1
        ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        const flightsOfToday = flights.filter(
          (flight) => flight.scheduleDate === todayString
        );

        console.log(JSON.stringify(flightsOfToday, null, 2)); // make sure I get the full console log including arrays

        // Render the index page using Liquid
        const html = await engine.renderFile("./views/index.liquid", {
          flights: flightsOfToday,
          page: page,
        });
        res.send(html);
      } else {
        console.error("Error: API response does not include flights");
      }
    });
  });

  request.on("error", (error) => {
    console.error("Error:", error);
  });

  request.end();
});

app.get("/flights/:flightName", async (req, res) => {
  const flightName = req.params.flightName;

  // Get the flight data
  const flight = flights.find((flight) => flight.flightName === flightName);

  if (flight) {
    const html = await engine.renderFile("./views/flight.liquid", { flight });
    res.send(html);
  } else {
    res.status(404).send("Flight not found");
  }
});

app.use(logger());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
