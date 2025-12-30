require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash("admin123", 10);

  await Admin.deleteMany({ username: "admin" }); // safety

  await Admin.create({
    username: "admin",
    password: hash,
    role: "SUPER_ADMIN"
  });

  console.log("ADMIN CREATED SUCCESSFULLY");
  process.exit();
});
