const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

const User = require("../models/User");

/* ===============================
   SUB ADMIN ANALYTICS (CLEAN DATA ONLY)
   =============================== */
router.get("/analytics", authSubAdmin, async (req, res) => {
  try {
    const marketFilter = req.query.market || "all";
    const subAdminId = req.subAdmin.id;

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
      for (const tx of user.transactions || []) {

        /* ===============================
           IGNORE DIRTY / OLD DATA
           =============================== */
        if (!tx.market) continue;
        if (tx.type === "BET" && !tx.gameType) continue;
        if (marketFilter !== "all" && tx.market !== marketFilter) continue;

        /* ===============================
           USER STATS
           =============================== */
        if (!usersMap[user.username]) {
          usersMap[user.username] = { bet: 0, win: 0 };
        }

        /* ===============================
           BET
           =============================== */
        if (tx.type === "BET") {
          overall.bet += tx.amount;
          usersMap[user.username].bet += tx.amount;

          // MARKET
          if (!markets[tx.market]) {
            markets[tx.market] = { bet: 0, win: 0 };
          }
          markets[tx.market].bet += tx.amount;

          // GAME
          if (!games[tx.gameType]) {
            games[tx.gameType] = { bet: 0, win: 0 };
          }
          games[tx.gameType].bet += tx.amount;

          // NUMBER LIABILITY
          for (const b of tx.bets || []) {
            const key = `${b.digit}_${tx.gameType}`;
            if (!numbers[key]) {
              numbers[key] = {
                number: b.digit,
                game: tx.gameType,
                bet: 0
              };
            }
            numbers[key].bet += b.amount;
          }
        }

        /* ===============================
           WIN
           =============================== */
        if (tx.type === "WIN") {
          overall.win += tx.amount;
          usersMap[user.username].win += tx.amount;

          if (!markets[tx.market]) {
            markets[tx.market] = { bet: 0, win: 0 };
          }
          markets[tx.market].win += tx.amount;
        }
      }
    }

    /* ===============================
       CALCULATE P/L
       =============================== */
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
   SUB ADMIN LOGIN
   =============================== */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const sub = await SubAdmin.findOne({ username });
    if (!sub) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, sub.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: sub._id, role: "SUB_ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      username: sub.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ===============================
   GET LOGGED-IN SUBADMIN (ME)
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
