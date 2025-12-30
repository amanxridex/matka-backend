const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SubAdmin = require("../models/SubAdmin");

const router = express.Router();

/* ---------- SUB ADMIN LOGIN ---------- */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const sub = await SubAdmin.findOne({ username });
    if (!sub) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, sub.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: sub._id,
        role: "SUB_ADMIN",
        username: sub.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      username: sub.username
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
