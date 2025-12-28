const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://thegreatestaman999_db_user:Aman12345@cluster1.8zhmekx.mongodb.net/matka?appName=Cluster1"
    );
    console.log("MongoDB Atlas Connected");
  } catch (err) {
    console.log("DB Error:", err.message);
  }
};

module.exports = connectDB;
