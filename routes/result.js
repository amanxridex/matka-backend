const express = require("express");
const router = express.Router();

const Market = require("../models/Market");
const Result = require("../models/Result");

/* ✅ GET LIVE MARKETS */
router.get("/markets/live", async (req, res) => {
  try {
    const markets = await Market.find({ status: "OPEN" })
      .select("name");

    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ✅ PUBLISH RESULT */
router.post("/results/publish", async (req, res) => {
  try {
    const { market, result, session } = req.body;

    if (!market || !result || !session) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ❌ Duplicate protection (same market + session + date)
    const exists = await Result.findOne({
      market,
      session,
      date: {
        $gte: new Date().setHours(0,0,0,0)
      }
    });

    if (exists) {
      return res.status(400).json({
        error: "Result already published"
      });
    }

    const newResult = await Result.create({
      market,
      result,
      session
    });

    // 🔒 Close market after result
    await Market.updateOne(
      { name: market },
      { status: "CLOSED" }
    );

    res.json({
      success: true,
      result: newResult
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ✅ GET ALL RESULTS */
router.get("/results", async (req, res) => {
  try {
    const results = await Result.find()
      .sort({ date: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
