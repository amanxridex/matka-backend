const mongoose = require("mongoose");

const subAdminSchema = new mongoose.Schema({
  username: String,
  password: String,

  role: {
    type: String,
    default: "SUB_ADMIN"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },

  // 🔥 EXISTING FIELDS (NO CHANGE)
  users: {
    type: Number,
    default: 0
  },

  balance: {
    type: Number,
    default: 0
  },

  // 🔥 PARTNERSHIP / COMMISSION (LIVE)
  commission: {
    fixed: {
      type: Number,
      default: 5      // system fixed
    },
    variable: {
      type: Number,
      default: 20     // superadmin editable
    }
  }

}, { timestamps: true });

module.exports = mongoose.model("SubAdmin", subAdminSchema);
