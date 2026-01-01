const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/", async (req, res) => {
  try {
    const { market, date } = req.query;
    if (!market) return res.status(400).json({ error: "Market required" });

    const users = await User.find(
      {
        "transactions.type": "BET",
        "transactions.market": market
      },
      { username: 1, transactions: 1 }
    );

    const akhar = {};
    const jodi = {};
    const logs = [];

    users.forEach(user => {
      user.transactions.forEach(tx => {
        if (tx.type !== "BET") return;
        if (tx.market !== market) return;

        // ✅ DATE FILTER
        if (date) {
          const txDate = new Date(tx.date).toISOString().split("T")[0];
          if (txDate !== date) return;
        }

        tx.bets.forEach(b => {
          if (tx.gameType === "AKHAR") {
            akhar[b.digit] = (akhar[b.digit] || 0) + b.amount;
          }
          if (tx.gameType === "JODI") {
            jodi[b.digit] = (jodi[b.digit] || 0) + b.amount;
          }

          // 🔥 TABLE LOG
          logs.push({
            username: user.username,
            gameType: tx.gameType,
            number: b.digit,
            amount: b.amount,
            time: tx.date
          });
        });
      });
    });

    res.json({ akhar, jodi, logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
