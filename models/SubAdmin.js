const mongoose = require("mongoose");

const SubAdminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    default: "SUB_ADMIN"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }
});

module.exports = mongoose.model("SubAdmin", SubAdminSchema);
