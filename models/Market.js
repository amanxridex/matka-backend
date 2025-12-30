const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema({
  name: String,
  openAt: String,   // "13:20"
  closeAt: String,  // "14:10"
  status: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "CLOSED"
  }
});

module.exports = mongoose.model("Market", marketSchema);