const express = require("express");
const router = express.Router();

const Market = require("../models/Market");
const Result = require("../models/Result");

/* ✅ GET ALL MARKETS */
router.get("/markets", async (req, res) => {
  try {
    const markets = await Market.find().select("name");
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ✅ PUBLISH RESULT (NO SESSION ANYWHERE) */
router.post("/results/publish", async (req, res) => {
  try {
    const { market, result } = req.body;

    if (!market || !result) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ❌ Duplicate result protection (1 result per market per day)
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

    const newResult = await Result.create({
      market,
      result
    });

    res.json({
      success: true,
      result: newResult
    });

  } catch (err) {
    console.error("RESULT PUBLISH ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ✅ GET ALL RESULTS */
router.get("/results", async (req, res) => {
  try {
    const results = await Result.find().sort({ date: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
