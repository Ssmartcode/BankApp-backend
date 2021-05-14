const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();

// body-parser
app.use(express.json({ useNewUrlParser: true }));

// db connection
const DB_STRING = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zapps.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
mongoose.connect(DB_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once("connected", () => {
  console.log("You are connected to the data base");
});
connection.on("error", () => {
  console.log("Something went wrong while trying to connect to the data base");
});

// set cors headers
app.use(cors());

// routers
const users = require("./routers/users");
app.use("/users", users);

// handle errors
app.use((err, req, res, next) => {
  if (res.headerSent) {
    return next(err);
  }
  res
    .status(err.code)
    .json(
      { message: err.message } || "Something went wrong. Please try again later"
    );
});
app.listen(process.env.PORT, () =>
  console.log("You have been connected on port" + process.env.PORT)
);
