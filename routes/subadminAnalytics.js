const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authSubAdmin = require("../middleware/authSubAdmin");

router.get("/analytics", authSubAdmin, async (req, res) => {
  try {
    const { market = "all" } = req.query;

    const users = await User.find({
      createdBy: req.subAdmin._id
    });

    let totalBet = 0;
    let totalWin = 0;

    let marketMap = {};
    let gameMap = {};
    let numberMap = {};
    let userMap = {};

    users.forEach(u => {
      u.transactions.forEach(t => {

        if (t.type === "BET") {
          if (market !== "all" && t.market !== market) return;

          totalBet += t.amount;

          // MARKET
          marketMap[t.market] ??= { bet: 0, win: 0 };
          marketMap[t.market].bet += t.amount;

          // GAME
          gameMap[t.gameType] ??= { bet: 0, win: 0 };
          gameMap[t.gameType].bet += t.amount;

          // NUMBERS
          t.bets.forEach(b => {
            const key = `${b.digit}_${t.gameType}`;
            numberMap[key] ??= {
              number: b.digit,
              game: t.gameType,
              bet: 0
            };
            numberMap[key].bet += b.amount;
          });
        }

        if (t.type === "WIN") {
          if (market !== "all" && t.market !== market) return;

          totalWin += t.amount;

          marketMap[t.market].win += t.amount;
          gameMap[t.gameType].win += t.amount;

          userMap[u.username] ??= { bet: 0, win: 0 };
          userMap[u.username].win += t.amount;
        }

        if (t.type === "BET") {
          userMap[u.username] ??= { bet: 0, win: 0 };
          userMap[u.username].bet += t.amount;
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
    console.error(err);
    res.status(500).json({ error: "Analytics error" });
  }
});

module.exports = router;
