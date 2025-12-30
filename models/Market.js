const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema({
  name: String,

  openTime: String,   // "11:20"
  closeTime: String,  // "14:10"

  status: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "CLOSED"
  }
});

module.exports = mongoose.model("Market", marketSchema);
