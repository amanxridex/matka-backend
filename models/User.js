const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    balance: {
      type: Number,
      default: 0
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubAdmin",
      required: true
    },

    transactions: [
      {
        type: {
          type: String,
          enum: ["ADD", "DEDUCT", "BET"],
          required: true
        },

        // total amount of ADD / DEDUCT / BET
        amount: {
          type: Number,
          required: true
        },

        // ✅ ONLY FOR BET
        market: {
          type: String // "MADHUR MORNING"
        },

        gameType: {
          type: String // "AKHAR" | "JODI"
        },

        // individual bets
        bets: [
          {
            digit: {
              type: String // "2", "92"
            },
            amount: {
              type: Number
            }
          }
        ],

        date: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
