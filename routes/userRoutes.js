const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

/* CREATE USER (SUB ADMIN) */
router.post("/create", auth("SUB_ADMIN"), async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hash,
      balance: 0,
      createdBy: req.user.id   // 👈 subadmin id
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
