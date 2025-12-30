const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: {
    type: String, // ADD / DEDUCT
    enum: ["ADD", "DEDUCT"]
  },
  amount: Number,
  date: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,

  balance: {
    type: Number,
    default: 0
  },

  transactions: [transactionSchema], // 🔥 ADD THIS

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubAdmin"
  }
});

module.exports = mongoose.model("User", userSchema);
