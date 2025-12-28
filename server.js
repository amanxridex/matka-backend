const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const marketRoutes = require("./routes/marketRoutes");

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/markets", marketRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
