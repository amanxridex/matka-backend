const mongoose = require("mongoose");

const betSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    market: {
      type: String, // "MADHUR MORNING"
      required: true
    },

    betType: {
      type: String,
      enum: ["AKHAR", "JODI"],
      required: true
    },

    bets: [
      {
        digit: String, // "2" or "92"
        amount: Number
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "WIN", "LOSE"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bet", betSchema);
