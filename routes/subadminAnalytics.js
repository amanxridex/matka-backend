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
    const subAdminId = req.subAdmin._id;

    let startDate = null;
    let endDate = null;

    if (date) {
      startDate = new Date(date);
      startDate.setHours(0,0,0,0);

      endDate = new Date(date);
      endDate.setHours(23,59,59,999);
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

    for (const u of users) {
      usersMap[u.username] ??= { bet: 0, win: 0 };

      for (const t of u.transactions || []) {

        if (date && !(t.date >= startDate && t.date <= endDate)) continue;

        const tMarket = t.market?.toUpperCase();

        /* ===== BET ===== */
        if (
          t.type === "BET" &&
          t.amount > 0 &&
          t.market &&
          t.gameType
        ) {
          if (market !== "all" && tMarket !== market.toUpperCase()) continue;

          overall.bet += t.amount;
          usersMap[u.username].bet += t.amount;

          markets[tMarket] ??= { bet: 0, win: 0 };
          markets[tMarket].bet += t.amount;

          games[t.gameType] ??= { bet: 0, win: 0 };
          games[t.gameType].bet += t.amount;

          (t.bets || []).forEach(b => {
            if (!b.digit || !b.amount) return;
            const key = `${b.digit}_${t.gameType}`;
            numbers[key] ??= {
              number: b.digit,
              game: t.gameType,
              bet: 0
            };
            numbers[key].bet += b.amount;
          });
        }

        /* ===== WIN ===== */
        if (t.type === "WIN" && t.amount > 0 && t.market) {
          if (market !== "all" && tMarket !== market.toUpperCase()) continue;

          overall.win += t.amount;
          usersMap[u.username].win += t.amount;

          markets[tMarket] ??= { bet: 0, win: 0 };
          markets[tMarket].win += t.amount;
        }
      }
    }

    overall.pl = overall.bet - overall.win;

    Object.values(markets).forEach(m => m.pl = m.bet - m.win);
    Object.values(games).forEach(g => g.pl = g.bet - g.win);

    res.json({
      success: true,
      overall,
      markets,
      games,
      numbers,
      users: usersMap
    });

  } catch (e) {
    console.error("ANALYTICS ERROR", e);
    res.status(500).json({ success: false });
  }
});


/* ===============================
   DYNAMIC MARKET LIST
   =============================== */
router.get("/analytics/markets", authSubAdmin, async (req, res) => {
  const users = await User.find(
    { createdBy: req.subAdmin._id },
    { transactions: 1 }
  ).lean();

  const set = new Set();

  users.forEach(u => {
    u.transactions?.forEach(t => {
      if (t.market) set.add(t.market);
    });
  });

  res.json({ markets: Array.from(set) });
});

module.exports = router;
