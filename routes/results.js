const express = require("express");
const router = express.Router();

const Market = require("../models/Market");
const Result = require("../models/Result");
const User = require("../models/User");
const SubAdmin = require("../models/SubAdmin");

/* ===============================
   GET ALL MARKETS
   =============================== */
router.get("/markets", async (req, res) => {
  try {
    const markets = await Market.find().select("name");
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   PUBLISH RESULT + AUTO WIN LOGIC
   =============================== */
router.post("/results/publish", async (req, res) => {
  try {
    const { market, result } = req.body;

    if (!market || !result) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ✅ One result per market per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exists = await Result.findOne({
      market,
      date: { $gte: today }
    });

    if (exists) {
      return res.status(400).json({
        error: "Result already published for this market today"
      });
    }

    // ✅ Save result
    const newResult = await Result.create({ market, result });

    // 🔥 Derive results
    const jodiResult = result;
    const akharResult = result[result.length - 1];

    // 🔥 Fetch all users
    const users = await User.find();

    for (const user of users) {
      let totalWin = 0;

      // SubAdmin of user
      const subAdmin = await SubAdmin.findById(user.createdBy);
      if (!subAdmin) continue;

      for (const txn of user.transactions) {

        // only unsettled BETs of this market
        if (
          txn.type !== "BET" ||
          txn.market !== market ||
          txn.settled === true
        ) {
          continue;
        }

        for (const b of txn.bets) {

          // ===== AKHAR =====
          if (txn.gameType === "AKHAR" && b.digit === akharResult) {
            totalWin += b.amount * 9.5;
          }

          // ===== JODI =====
          if (txn.gameType === "JODI" && b.digit === jodiResult) {
            totalWin += b.amount * 95;
          }
        }

        // mark bet settled
        txn.settled = true;
      }

      // payout
      if (totalWin > 0) {
        user.balance += totalWin;

        user.transactions.push({
          type: "WIN",
          amount: totalWin,
          market,
          result
        });

        // subadmin can go negative
        subAdmin.balance -= totalWin;

        await subAdmin.save();
        await user.save();
      } else {
        await user.save(); // save settled flag
      }
    }

    res.json({
      success: true,
      market,
      result,
      jodi: jodiResult,
      akhar: akharResult
    });

  } catch (err) {
    console.error("RESULT PUBLISH ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   GET ALL RESULTS
   =============================== */
router.get("/results", async (req, res) => {
  try {
    const results = await Result.find().sort({ date: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
