const express = require("express");
const Market = require("../models/Market");
const getStatus = require("../utils/marketStatus");

const router = express.Router();

/* ADD MARKET (ADMIN) */
router.post("/add", async (req, res) => {
  const market = await Market.create(req.body);
  res.json(market);
});

/* UPDATE MARKET (ADMIN) */
router.put("/:id", async (req, res) => {
  try {
    const { name, openTime, closeTime } = req.body;

    const market = await Market.findByIdAndUpdate(
      req.params.id,
      { name, openTime, closeTime },
      { new: true }
    );

    if (!market) {
      return res.status(404).json({ error: "Market not found" });
    }

    res.json({ success: true, market });

  } catch (err) {
    console.error("MARKET UPDATE ERROR:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* DELETE MARKET (ADMIN) */
router.delete("/:id", async (req, res) => {
  await Market.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* GET MARKETS (USER) */
router.get("/", async (req, res) => {
  const markets = await Market.find();

  const data = markets.map(m => ({
    _id: m._id,
    name: m.name,
    openTime: m.openTime,
    closeTime: m.closeTime,
    status: getStatus(m.openTime, m.closeTime)
  }));

  res.json(data);
});

module.exports = router;
