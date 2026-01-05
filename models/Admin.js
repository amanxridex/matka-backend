const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: {
    type: String,
    default: "SUPER_ADMIN"
  },

  // 🔥 ADD THIS
  balance: {
    type: Number,
    default: 0
  }

});

module.exports = mongoose.model("Admin", adminSchema);
