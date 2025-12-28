require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI);

(async () => {
  const hash = await bcrypt.hash("admin123", 10);
  await Admin.create({
    username: "admin",
    password: hash
  });
  console.log("Admin created");
  process.exit();
})();
