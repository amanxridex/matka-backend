require("dotenv").config();
require("./cron");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const adminRoutes = require("./routes/adminRoutes");
const marketRoutes = require("./routes/marketRoutes"); // 👈 ADD

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/admin", adminRoutes);
app.use("/subadmin", require("./routes/subAdminRoutes"));
app.use("/api/markets", marketRoutes); // 👈 ADD (VERY IMPORTANT)
app.use("/subadmin/users", require("./routes/userRoutes"));

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
