const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema({
  name: String,

  openTime: String,   // "11:20"
  closeTime: String,  // "12:20"

  openAt: String,     // "11:20"
  closeAt: String,    // "12:20"

  status: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "CLOSED"
  }
});

module.exports = mongoose.model("Market", marketSchema);
