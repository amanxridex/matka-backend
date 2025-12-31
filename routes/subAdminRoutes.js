const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SubAdmin = require("../models/SubAdmin");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const sub = await SubAdmin.findOne({ username });
  if (!sub) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, sub.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: sub._id, role: "SUB_ADMIN" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    username: sub.username
  });
});

module.exports = router;
