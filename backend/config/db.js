const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use the MongoDB URI from .env file
    const mongoUri = 'mongodb+srv://usert0445_db_user:greenhouse@cluster0.8aw4xqx.mongodb.net/greenhouseDB?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;