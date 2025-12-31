const express = require("express");
const User = require("../models/User");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // ✅ ONLY ONCE

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
   CREATE USER (+1 USER)
   =============================== */
router.post("/create", authSubAdmin, async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      username: req.body.username,
      password: hashed,
      createdBy: req.subAdmin.id,
      balance: 0
    });

    await SubAdmin.findByIdAndUpdate(req.subAdmin.id, {
      $inc: { users: 1 }
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User creation failed" });
  }
});

/* ===============================
   DELETE USER (-1 USER)
   =============================== */
router.delete("/:id", authSubAdmin, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.subAdmin.id
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await SubAdmin.findByIdAndUpdate(req.subAdmin.id, {
      $inc: { users: -1 }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User delete failed" });
  }
});

/* ===============================
   ADD / DEDUCT USER WALLET
   =============================== */
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
      user.transactions.push({ type: "ADD", amount });
    } else if (type === "DEDUCT") {
      if (user.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      user.balance -= amount;
      user.transactions.push({ type: "DEDUCT", amount });
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Wallet update failed" });
  }
});

/* ===============================
   USER LOGIN (PLAY PAGE)
   =============================== */
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

/* ===============================
   GET LOGGED-IN USER (ME)
   =============================== */
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({ error: "No token" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "username balance"
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
