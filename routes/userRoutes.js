const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

/* CREATE USER */
router.post("/create", authSubAdmin, async (req, res) => {
  const { username, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashed,
    createdBy: req.subAdmin.id
  });

  // 🔥 VERY IMPORTANT: increment subadmin users count
  await SubAdmin.findByIdAndUpdate(req.subAdmin.id, {
    $inc: { users: 1 }
  });

  res.json(user);
});

/* GET USERS OF LOGGED SUBADMIN */
router.get("/", authSubAdmin, async (req, res) => {
  const users = await User.find({ createdBy: req.subAdmin.id });
  res.json(users);
});

module.exports = router;

router.post("/wallet/:id", authSubAdmin, async (req, res) => {
  const { amount, type } = req.body; // ADD / DEDUCT

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ msg: "User not found" });

  if (type === "ADD") user.balance += amount;
  if (type === "DEDUCT") user.balance -= amount;

  user.transactions.unshift({
    type,
    amount
  });

  await user.save();

  res.json(user);
});
