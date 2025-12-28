const mongoose = require("mongoose");

const MarketSchema = new mongoose.Schema({
  name: String,
  openTime: String,
  closeTime: String
});

module.exports = mongoose.model("Market", MarketSchema);
