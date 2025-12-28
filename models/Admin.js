const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    default: "SUPER_ADMIN"
  }
});

module.exports = mongoose.model("Admin", AdminSchema);
