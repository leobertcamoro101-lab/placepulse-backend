require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]); // << if error connection do this

const fs = require('fs');
const path = require('path');

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

// register the body-parser middleware to parse incoming JSON data
// register the places routes middleware
app.use(bodyParser.json()); 

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use("/api/places", placesRoutes); // => /api/places
app.use("/api/users", usersRoutes); // => /api/users

// error handling middleware for unsupported routes
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

// error handling middleware
// app.use((error, req, res, next) => {
//   // this code will not save image to the folder if error for "user" and "place"
//   if(req.file) {
//     fs.unlink(req.file.path, (err) => {
//       console.log(err);
//     });
//   }

//   if (res.headerSent) {
//     return next(error);
//   }
//   res.status(error.code || 500);
//   res.json({ message: error.message || "An unknown error occurred!" });
// });

app.use((error, req, res, next) => {
  // ✅ Only delete file if using local storage (remove this when using Cloudinary)
  // if(req.file && req.file.path && !req.file.path.startsWith('http')) {
  //   fs.unlink(req.file.path, (err) => {
  //     if (err) console.log('Could not delete file:', err);
  //   });
  // }

  if (res.headerSent) {
    return next(error);
  }
  const statusCode = typeof error.code === 'number' ? error.code : 500;
  res.status(statusCode);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.accdk79.mongodb.net/${process.env.DB_NAME}?appName=Cluster0`)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.log(err);
  });

// mongodb+srv://leobertcamoro10_db_user:WwALwPdZcsK4Adb2@cluster0.accdk79.mongodb.net/?appName=Cluster0
// mongodb+srv://LeoDev:LAWErUwAJCCVroyd@cluster0.accdk79.mongodb.net/places?appName=Cluster0
// mongodb://localhost:27017/

