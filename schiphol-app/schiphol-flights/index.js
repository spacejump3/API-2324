const { App } = require("@tinyhttp/app");
// import { logger } from "@tinyhttp/logger";
const { Liquid } = require("liquidjs");

const app = new App();
const engine = new Liquid();

engine
  .parseAndRender("{{name | capitalize}}", { name: "alice" })
  .then(console.log); // outputs 'Alice'

app.use((req, res) => void res.send("Hello world!"));

app.listen(3000, () => console.log("Started on http://localhost:3000"));
