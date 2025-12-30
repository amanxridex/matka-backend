const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: {
    type: String,
    default: "SUPER_ADMIN"
  }
});

module.exports = mongoose.model("Admin", adminSchema);
