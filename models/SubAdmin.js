const mongoose = require("mongoose");

const subAdminSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: {
    type: String,
    default: "SUB_ADMIN"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },

  // 🔥 NEW FIELDS
  users: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("SubAdmin", subAdminSchema);
