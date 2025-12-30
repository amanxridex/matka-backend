const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const SubAdmin = require("../models/SubAdmin");
const auth = require("../middleware/auth");

const router = express.Router();

/* CREATE USER (SUB ADMIN) */
router.post("/create", auth("SUB_ADMIN"), async (req, res) => {
  try {
    const { username, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hash,
      createdBy: req.user.id
    });

    // 🔥🔥🔥 IMPORTANT PART
    await SubAdmin.findByIdAndUpdate(req.user.id, {
      $inc: { users: 1 }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
});

/* GET USERS OF LOGGED IN SUB ADMIN */
router.get("/", auth("SUB_ADMIN"), async (req, res) => {
  const users = await User.find({ createdBy: req.user.id }).select("-password");
  res.json(users);
});

module.exports = router;
