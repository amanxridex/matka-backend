const express = require("express");
const User = require("../models/User");
const Bet = require("../models/Bet");
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
    }).select("username balance transactions");

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
/* ADD / DEDUCT USER WALLET + SUBADMIN WALLET SYNC */
router.post("/wallet/:id", authSubAdmin, async (req, res) => {
  try {
    const { amount, type } = req.body;
    const amt = Number(amount);

    if (!amt || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // 🔎 Fetch user
    const user = await User.findOne({
      _id: req.params.id,
      createdBy: req.subAdmin.id
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🔎 Fetch subadmin
    const subAdmin = await SubAdmin.findById(req.subAdmin.id);
    if (!subAdmin) {
      return res.status(404).json({ error: "SubAdmin not found" });
    }

    /* ======================
       ADD → User ↑ , Sub ↓
       ====================== */
    if (type === "ADD") {
      if (subAdmin.balance < amt) {
        return res.status(400).json({
          error: "Insufficient SubAdmin balance"
        });
      }

      // user + 
      user.balance += amt;
      user.transactions.push({
        type: "ADD",
        amount: amt
      });

      // subadmin -
      subAdmin.balance -= amt;
    }

    /* ======================
       DEDUCT → User ↓ , Sub ↑
       ====================== */
    else if (type === "DEDUCT") {
      if (user.balance < amt) {
        return res.status(400).json({
          error: "Insufficient User balance"
        });
      }

      // user -
      user.balance -= amt;
      user.transactions.push({
        type: "DEDUCT",
        amount: amt
      });

      // subadmin +
      subAdmin.balance += amt;
    }

    else {
      return res.status(400).json({ error: "Invalid type" });
    }

    // 💾 SAVE BOTH
    await user.save();
    await subAdmin.save();

    res.json({
      success: true,
      userBalance: user.balance,
      subAdminBalance: subAdmin.balance,
      user
    });

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

/* ===============================
   USER BALANCE HISTORY
   =============================== */
router.get("/transactions", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({ error: "No token" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("transactions");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.transactions.reverse()); // latest first
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

/* ===============================
   PLACE BET (USER → SUBADMIN)
   =============================== */
router.post("/place-bet", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { market, gameType, bets, totalAmount } = req.body;

    if (!market || !gameType || !bets || !totalAmount) {
      return res.status(400).json({ error: "Invalid bet data" });
    }

    // 1️⃣ USER FETCH
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < totalAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 2️⃣ SUBADMIN FETCH (🔥 MISSING PIECE)
    const subAdmin = await SubAdmin.findById(user.createdBy);
    if (!subAdmin) {
      return res.status(404).json({ error: "SubAdmin not found" });
    }

    // 🔥🔥🔥 PAISA MOVE 🔥🔥🔥

    // USER SE PAISA KATTA
    user.balance -= totalAmount;

    user.transactions.push({
      type: "BET",
      amount: totalAmount,
      market,
      gameType,
      bets
    });

    // SUBADMIN KO PAISA MILTA
    subAdmin.balance += totalAmount;

    // 3️⃣ SAVE BOTH
    await user.save();
    await subAdmin.save();

    // (OPTIONAL) BET COLLECTION SAVE — baad me use hoga
    for (const b of bets) {
      await Bet.create({
        userId: user._id,
        subAdminId: subAdmin._id,
        market,
        gameType,
        number: b.digit,
        amount: b.amount
      });
    }

    res.json({
      success: true,
      newBalance: user.balance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bet placement failed" });
  }
});


module.exports = router;
