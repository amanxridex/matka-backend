const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

/* ===============================
   SUB ADMIN LOGIN
   =============================== */
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
      { id: sub._id, role: "SUB_ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      username: sub.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ===============================
   GET LOGGED-IN SUBADMIN (ME)
   =============================== */
router.get("/me", authSubAdmin, async (req, res) => {
  try {
    const subAdmin = await SubAdmin.findById(req.subAdmin.id)
      .select("username balance users");

    if (!subAdmin) {
      return res.status(404).json({ message: "SubAdmin not found" });
    }

    res.json(subAdmin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch subadmin" });
  }
});

module.exports = router;
