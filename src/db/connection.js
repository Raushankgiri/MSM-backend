// const mongoose = require("mongoose");
// require("dotenv").config();
// const mongo_URI = process.env.mongo_URI;
// // "mongodb://127.0.0.1:27017/eel_project_v1"
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(mongo_URI, {
//       useNewUrlParser: true,
//     });
//     console.log(`MongoDB Connected`);
//   } catch (error) {
//     console.error(error.message);
//     //   process.exit(1);
//   }
// };
// module.exports = connectDB;

//**/ second solution
const mongoose = require("mongoose");
require("dotenv").config();

const mongo_URI = process.env.mongo_URI;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongo_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected`);

    // Connection event listeners (optional)
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connection established");
    });
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Handle error or re-throw if you want to exit the application
    // process.exit(1);
  }
};

// Function to disconnect from MongoDB
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
};

module.exports = { connectDB, disconnectDB };

//***/ third solution
// const { MongoClient } = require("mongodb");

// // Connection URL
// // const url = "mongodb://localhost:27017";

// // Create a new MongoClient with connection pooling configuration
// const client = new MongoClient(url, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   poolSize: 10, // Set the size of the connection pool
// });

// // Use connect method to connect to the Server
// client.connect(async (err) => {
//   if (err) throw err;

//   try {
//     // Perform MongoDB operations using the client
//     const db = client.db("your_database");
//     const result = await db.collection("your_collection").find({}).toArray();
//     console.log(result);
//   } finally {
//     // The connection is automatically returned to the pool
//     await client.close();
//   }
// });

// const { MongoClient } = require("mongodb");
// require("dotenv").config();
// const mongoURI = process.env.mongo_URI;
// const connectDB = async () => {
//   try {
//     const client = new MongoClient(mongoURI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     client.poolSize = 200;

//     await client.connect();
//     console.log("MongoDB Connected");

//     // Connection event listeners
//     client.on("connected", () => {
//       console.log("MongoDB connection established");
//     });
//     client.on("error", (err) => {
//       console.error("MongoDB connection error:", err);
//     });
//     client.on("disconnected", () => {
//       console.log("MongoDB disconnected");
//     });

//     // // Periodically ping the server to check connection status
//     // setInterval(async () => {
//     //   try {
//     //     await client.db().admin().ping();
//     //     console.log('MongoDB connection is stable');
//     //   } catch (error) {
//     //     console.error('MongoDB connection lost:', error);
//     //   }
//     // }, 60000); // Ping every 60 seconds
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//   }
// };

// module.exports = connectDB;
