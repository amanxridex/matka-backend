const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  market: {
    type: String,
    required: true
  },
  result: {
    type: String, // e.g. "59"
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Result", resultSchema);
