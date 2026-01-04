const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authSubAdmin = require("../middleware/authSubAdmin");

/* ===============================
   SUB ADMIN ANALYTICS
   =============================== */
router.get("/analytics", authSubAdmin, async (req, res) => {
  try {
    const { market = "all", date } = req.query;

    const users = await User.find({ createdBy: req.subAdmin._id }).lean();

    let totalBet = 0, totalWin = 0;
    let marketMap = {}, gameMap = {}, numberMap = {}, userMap = {};

    let start = null, end = null;

    if (date) {
      start = new Date(date);
      start.setHours(0,0,0,0);
      end = new Date(date);
      end.setHours(23,59,59,999);
    }

    users.forEach(u => {
      (u.transactions || []).forEach(t => {

        // DATE FILTER ✅
        if (start && end) {
          const d = new Date(t.date);
          if (d < start || d > end) return;
        }

        // MARKET FILTER ✅
        if (market !== "all" && t.market !== market) return;

        // BET
        if (t.type === "BET") {
          totalBet += t.amount || 0;

          if (t.market) {
            marketMap[t.market] ??= { bet: 0, win: 0 };
            marketMap[t.market].bet += t.amount || 0;
          }

          if (t.gameType) {
            gameMap[t.gameType] ??= { bet: 0, win: 0 };
            gameMap[t.gameType].bet += t.amount || 0;
          }

          (t.bets || []).forEach(b => {
            const key = `${b.digit}_${t.gameType}`;
            numberMap[key] ??= {
              number: b.digit,
              game: t.gameType,
              bet: 0
            };
            numberMap[key].bet += b.amount || 0;
          });

          userMap[u.username] ??= { bet: 0, win: 0 };
          userMap[u.username].bet += t.amount || 0;
        }

        // WIN
        if (t.type === "WIN") {
          totalWin += t.amount || 0;

          if (t.market && marketMap[t.market])
            marketMap[t.market].win += t.amount || 0;

          if (t.gameType && gameMap[t.gameType])
            gameMap[t.gameType].win += t.amount || 0;

          userMap[u.username] ??= { bet: 0, win: 0 };
          userMap[u.username].win += t.amount || 0;
        }

      });
    });

    res.json({
      success: true,
      overall: {
        bet: totalBet,
        win: totalWin,
        pl: totalBet - totalWin
      },
      markets: marketMap,
      games: gameMap,
      numbers: numberMap,
      users: userMap
    });

  } catch (err) {
    console.error("ANALYTICS ERROR", err);
    res.status(500).json({ success: false });
  }
});

/* ===============================
   DYNAMIC MARKET LIST
   =============================== */
router.get("/analytics/markets", authSubAdmin, async (req, res) => {
  try {
    const users = await User.find(
      { createdBy: req.subAdmin._id },
      { transactions: 1 }
    ).lean();

    const set = new Set();

    users.forEach(u => {
      (u.transactions || []).forEach(t => {
        if (
          t.type === "BET" &&
          t.market &&
          typeof t.market === "string"
        ) {
          set.add(t.market.trim());
        }
      });
    });

    res.json({
      success: true,
      markets: Array.from(set)
    });

  } catch (err) {
    console.error("MARKET LOAD ERROR", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
