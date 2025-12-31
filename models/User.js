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
          enum: ["ADD", "DEDUCT"],
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
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