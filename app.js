

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const helmet = require("helmet");
const cluster = require("cluster");
const os = require("os");
const numCPUs = require("node:os").availableParallelism();
const process = require("node:process");
const router = require("../src/api/route/routes");
require("dotenv").config();
const mongoose = require('mongoose');
const fs = require('fs');



const port = process.env.port;








let cpuCount = os.cpus().length;
const email_link = process.env.verified_uri;
const { connectDB, disconnectDB } = require("../src/db/connection");
connectDB(function (err, db) {
  if (err) {
   
    console.error("Error occurred while connecting to MongoDB", err);
    return;
  }

  const collection = db.collection("documents");
  collection.insertOne({ a: 1 }, function (err, result) {
    if (err) {
      console.error("Error occurred while inserting document", err);
      disconnectDB(function (disconnectErr) {
        if (disconnectErr) {
          console.error(
            "Error occurred while disconnecting from MongoDB",
            disconnectErr
          );
        }
      });
      return;
    }

    disconnectDB(function (disconnectErr) {
      if (disconnectErr) {
        console.error(
          "Error occurred while disconnecting from MongoDB",
          disconnectErr
        );
      }
    });
  });
});
function startexpress() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(cors());
  // app.use(cors({
  //   origin: ['https://customer-management-admin.netlify.app','http://localhost:3000','http://82.180.147.224:3000/'], // Replace with your frontend URL
  //   methods: ['GET', 'POST', 'PUT', 'DELETE'],
  //   credentials: true, // If you need cookies or authorization headers to be sent
  // }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  
  var corsOptions = {
    origin: "http://example.com",
    optionsSuccessStatus: 200, 
  };
  app.use("/", router);
  app.use(
    helmet.frameguard({
      action: "deny",
    })
  );


  const multer = require('multer');
  const csvParser = require('csv-parser'); // If you're parsing CSVs
  
  // Set up multer to handle file uploads
  const upload = multer({ dest: 'uploads/' }); // 'uploads/' is the directory where files will be temporarily stored
  
  // Route to handle file uploads
  

  app.get("/welcome", (req, res) => {
    res.status(200).send({ message: "the server is running" });
  });

  app.get("/healthcheck", (req, res) => {
    res.status(200).send({ message: "ok", status: 200 });
  });

  app.listen(port, console.log("server is running at ", port));
}


if (cluster.isPrimary) {
  console.log(`Number of CPUs is ${cpuCount}`);
  console.log(`Primary ${process.pid} is running`);
  for (var i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on("online", function (worker) {
    console.log("Worker " + worker.process.pid + " is online");
  });

  cluster.on("exit", function (worker, code, signal) {
    console.log(
      "Worker " +
        worker.process.pid +
        " died with code: " +
        code +
        ", and signal: " +
        signal
    );
    console.log("Starting a new worker");
    cluster.fork();
  });
} else {
  startexpress();
}

