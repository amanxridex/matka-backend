const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

const User = require("../models/User");

/* ===============================
   SUB ADMIN ANALYTICS (FULL)
   =============================== */
router.get("/analytics", authSubAdmin, async (req, res) => {
  try {
    const market = req.query.market || "all";
    const subAdminId = req.subAdmin.id;

    const pipeline = [
      { $match: { createdBy: subAdminId } },
      { $unwind: "$transactions" },
      {
        $match: {
          "transactions.type": { $in: ["BET", "WIN"] },
          ...(market !== "all" && { "transactions.market": market })
        }
      }
    ];

    const txns = await User.aggregate(pipeline);

    let overall = { bet: 0, win: 0 };
    let markets = {};
    let games = {};
    let numbers = {};
    let users = {};

    txns.forEach(u => {
      const t = u.transactions;
      const amt = t.amount || 0;

      // OVERALL
      if (t.type === "BET") overall.bet += amt;
      if (t.type === "WIN") overall.win += amt;

      // MARKET
      markets[t.market] ??= { bet: 0, win: 0 };
      if (t.type === "BET") markets[t.market].bet += amt;
      if (t.type === "WIN") markets[t.market].win += amt;

      // GAME
      games[t.gameType] ??= { bet: 0, win: 0 };
      if (t.type === "BET") games[t.gameType].bet += amt;
      if (t.type === "WIN") games[t.gameType].win += amt;

      // NUMBER (liability)
      if (t.type === "BET") {
        const key = `${t.digit}_${t.gameType}`;
        numbers[key] ??= {
          number: t.digit,
          game: t.gameType,
          bet: 0
        };
        numbers[key].bet += amt;
      }

      // USER
      users[u.username] ??= { bet: 0, win: 0 };
      if (t.type === "BET") users[u.username].bet += amt;
      if (t.type === "WIN") users[u.username].win += amt;
    });

    res.json({
      success: true,
      overall: {
        bet: overall.bet,
        win: overall.win,
        pl: overall.bet - overall.win
      },
      markets,
      games,
      numbers,
      users
    });

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ success: false, message: "Analytics failed" });
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
