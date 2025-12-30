const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

/* CREATE USER */
router.post("/create", authSubAdmin, async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hash,
    createdBy: req.subAdmin._id
  });

  res.json(user);
});

/* LIST USERS (only own) */
router.get("/", authSubAdmin, async (req, res) => {
  const users = await User.find({ createdBy: req.subAdmin._id });
  res.json(users);
});

/* ADD / DEDUCT BALANCE */
router.put("/wallet/:id", authSubAdmin, async (req, res) => {
  const { amount } = req.body; // + or -
  const user = await User.findOne({
    _id: req.params.id,
    createdBy: req.subAdmin._id
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  user.balance += amount;
  await user.save();

  res.json(user);
});

module.exports = router;
