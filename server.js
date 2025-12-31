require("dotenv").config();
require("./cron");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const adminRoutes = require("./routes/adminRoutes");
const marketRoutes = require("./routes/marketRoutes");
const subAdminRoutes = require("./routes/subAdminRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// ================= ROUTES =================

// SUPER ADMIN
app.use("/admin", adminRoutes);

// SUB ADMIN
app.use("/subadmin", subAdminRoutes);

// SUB ADMIN → USERS (create, list, wallet etc.)
app.use("/subadmin/users", userRoutes);

// 🔥 USER (LOGIN, PLAY, ME etc.)
app.use("/user", userRoutes);

// MARKETS (PLAY PAGE)
app.use("/api/markets", marketRoutes);

// ================= SERVER =================

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch(err => {
    console.error("DB Error:", err.message);
  });
