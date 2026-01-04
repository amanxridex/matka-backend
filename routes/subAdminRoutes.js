const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");
const Market = require("../models/Market");
const User = require("../models/User");

const router = express.Router();

/* ===============================
   SUB ADMIN ANALYTICS (CLEAN + DATE FILTER)
   =============================== */
router.get("/analytics", authSubAdmin, async (req, res) => {
  try {
    const marketFilter = req.query.market || "all";
    const date = req.query.date || null;
    const subAdminId = req.subAdmin.id;

    let start = null, end = null;
    if (date) {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    }

    const users = await User.find(
      { createdBy: subAdminId },
      { username: 1, transactions: 1 }
    ).lean();

    let overall = { bet: 0, win: 0, pl: 0 };
    let markets = {};
    let games = {};
    let numbers = {};
    let usersMap = {};

    for (const user of users) {
      usersMap[user.username] ??= { bet: 0, win: 0 };

      for (const tx of user.transactions || []) {

        /* ===== IGNORE DIRTY / OLD DATA ===== */
        if (!tx.market) continue;
        if (tx.type === "BET" && !tx.gameType) continue;
        if (marketFilter !== "all" && tx.market !== marketFilter) continue;

        /* ===== DATE FILTER ===== */
        if (start && end) {
          const txDate = new Date(tx.date);
          if (txDate < start || txDate > end) continue;
        }

        /* ===== BET ===== */
        if (tx.type === "BET") {
          overall.bet += tx.amount;
          usersMap[user.username].bet += tx.amount;

          markets[tx.market] ??= { bet: 0, win: 0 };
          markets[tx.market].bet += tx.amount;

          games[tx.gameType] ??= { bet: 0, win: 0 };
          games[tx.gameType].bet += tx.amount;

          for (const b of tx.bets || []) {
            const key = `${b.digit}_${tx.gameType}`;
            numbers[key] ??= {
              number: b.digit,
              game: tx.gameType,
              bet: 0
            };
            numbers[key].bet += b.amount;
          }
        }

        /* ===== WIN ===== */
        if (tx.type === "WIN") {
          overall.win += tx.amount;
          usersMap[user.username].win += tx.amount;

          markets[tx.market] ??= { bet: 0, win: 0 };
          markets[tx.market].win += tx.amount;

          // gameType optional in WIN
          if (tx.gameType) {
            games[tx.gameType] ??= { bet: 0, win: 0 };
            games[tx.gameType].win += tx.amount;
          }
        }
      }
    }

    /* ===== CALCULATE P/L ===== */
    overall.pl = overall.bet - overall.win;

    Object.values(markets).forEach(m => {
      m.pl = m.bet - m.win;
    });

    Object.values(games).forEach(g => {
      g.pl = g.bet - g.win;
    });

    res.json({
      success: true,
      overall,
      markets,
      games,
      numbers,
      users: usersMap
    });

  } catch (err) {
    console.error("SUBADMIN ANALYTICS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Analytics failed"
    });
  }
});

/* ===============================
   MARKET DROPDOWN (LIVE)
   =============================== */
router.get("/analytics/markets", authSubAdmin, async (req, res) => {
  try {
    const markets = await Market.find(
      { status: "CLOSED" },
      { name: 1, _id: 0 }
    ).lean();

    res.json({
      success: true,
      markets: markets.map(m => m.name)
    });
  } catch (err) {
    console.error("MARKET DROPDOWN ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* ===============================
   SUB ADMIN LOGIN
   =============================== */
router.post("/login", async (req, res) => {
  try {
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

    res.json({ token, username: sub.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ===============================
   GET LOGGED-IN SUBADMIN
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
