const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

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

// public files
app.use("/uploads/images", express.static(path.join("uploads", "images")));

// routers
const users = require("./routers/users");
app.use("/users", users);
const accounts = require("./routers/accounts");
app.use("/accounts", accounts);

// route not found
app.use((req, res, next) => {
  const error = new Error("Imi pare rau, pagina nu a fost gasita");
  error.code = 404;
  next(error);
});
// handle errors
app.use((err, req, res, next) => {
  if (res.headerSent) {
    return next(err);
  }
  res.status(err.code || 500).json({
    message: err.message || "Ceva nu a mers bine. Incearca mai tarziu",
  });
});
app.listen(process.env.PORT, () =>
  console.log("You have been connected on port" + process.env.PORT)
);
