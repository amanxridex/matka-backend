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

    let startDate, endDate;
    if (date) {
      startDate = new Date(date + "T00:00:00.000Z");
      endDate   = new Date(date + "T23:59:59.999Z");
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

        // DATE FILTER
        if (date && !(t.date >= startDate && t.date <= endDate)) continue;

        /* ================= BET ================= */
        if (
          t.type === "BET" &&
          t.market &&
          t.gameType &&
          t.amount > 0
        ) {
          if (market !== "all" && t.market !== market) continue;

          overall.bet += t.amount;
          usersMap[u.username].bet += t.amount;

          // MARKET
          markets[t.market] ??= { bet: 0, win: 0 };
          markets[t.market].bet += t.amount;

          // GAME
          games[t.gameType] ??= { bet: 0, win: 0 };
          games[t.gameType].bet += t.amount;

          // NUMBER LIABILITY
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

        /* ================= WIN ================= */
        if (t.type === "WIN" && t.market && t.amount > 0) {
          if (market !== "all" && t.market !== market) continue;

          overall.win += t.amount;
          usersMap[u.username].win += t.amount;

          markets[t.market] ??= { bet: 0, win: 0 };
          markets[t.market].win += t.amount;
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

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
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
