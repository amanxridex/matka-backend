const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * GET /api/bets?market=MADHUR MORNING&date=2026-01-12
 * Returns aggregated AKHAR / JODI totals (DATE WISE)
 */
router.get("/", async (req, res) => {
  try {
    const { market, date } = req.query;

    if (!market) {
      return res.status(400).json({ error: "Market required" });
    }

    // 🔥 fetch only BET transactions of this market
    const users = await User.find(
      {
        "transactions.type": "BET",
        "transactions.market": market
      },
      { transactions: 1 }
    );

    const akhar = {};
    const jodi = {};

    users.forEach(user => {
      user.transactions.forEach(tx => {
        if (tx.type !== "BET") return;
        if (tx.market !== market) return;

        // 🔥 DATE FILTER (IMPORTANT)
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
        });
      });
    });

    return res.json({ akhar, jodi });

  } catch (err) {
    console.error("BET FETCH ERROR", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
