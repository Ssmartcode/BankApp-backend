const express = require("express");

require("dotenv").config();

const app = express();

app.get("/", (req, res, next) => {
  res.send("<h1>Hello world</h1>");
});

app.listen(process.env.PORT, () =>
  console.log("You have been connected on port" + process.env.PORT)
);
