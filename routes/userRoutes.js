const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

/* GET USERS */
router.get("/", authSubAdmin, async (req, res) => {
  const users = await User.find({
    createdBy: req.subAdmin.id
  }).select("-password");

  res.json(users);
});

/* CREATE USER */
router.post("/create", authSubAdmin, async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hash,
    createdBy: req.subAdmin.id
  });

  // 🔥 INCREMENT SUBADMIN USER COUNT
  await SubAdmin.findByIdAndUpdate(req.subAdmin.id, {
    $inc: { users: 1 }
  });

  res.json(user);
});

module.exports = router;
