const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error(
        "\n❌ CONFIGURATION ERROR: MONGO_URI is not set in environment variables!\n" +
        "   Please add MONGO_URI to your Render service Environment settings.\n"
      );
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully!");
    console.log("Database:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;