const express = require("express");
const User = require("../models/User");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

/* ===============================
   GET USERS OF LOGGED-IN SUBADMIN
   =============================== */
router.get("/", authSubAdmin, async (req, res) => {
  try {
    const users = await User.find({
      createdBy: req.subAdmin.id
    }).select("username balance");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ===============================
   CREATE USER (+1 USER, +BALANCE)
   =============================== */
router.post("/create", authSubAdmin, async (req, res) => {
  try {
    // 1️⃣ create user
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      createdBy: req.subAdmin.id,
      balance: 0
    });

    // 2️⃣ increment subadmin counters
    await SubAdmin.findByIdAndUpdate(
      req.subAdmin.id,
      {
        $inc: {
          users: 1,
          balance: 0 // reward per user (change if needed)
        }
      }
    );

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User creation failed" });
  }
});

/* ===============================
   DELETE USER (-1 USER, -BALANCE)
   =============================== */
router.delete("/:id", authSubAdmin, async (req, res) => {
  try {
    // 1️⃣ delete only subadmin's own user
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.subAdmin.id
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2️⃣ reverse subadmin counters
    await SubAdmin.findByIdAndUpdate(
      req.subAdmin.id,
      {
        $inc: {
          users: -1,
          balance: -0 // reverse reward
        }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User delete failed" });
  }
});

/* ADD / DEDUCT USER WALLET */
router.post("/wallet/:id", authSubAdmin, async (req, res) => {
  try {
    const { amount, type } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await User.findOne({
      _id: req.params.id,
      createdBy: req.subAdmin.id
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (type === "ADD") {
      user.balance += amount;
      user.transactions.push({
        type: "ADD",
        amount
      });
    } else if (type === "DEDUCT") {
      if (user.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      user.balance -= amount;
      user.transactions.push({
        type: "DEDUCT",
        amount
      });
    }

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Wallet update failed" });
  }
});

/* ===============================
   USER LOGIN (FOR PLAY PAGE)
   =============================== */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: "USER" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});


module.exports = router;
