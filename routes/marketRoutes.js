const express = require("express");
const Market = require("../models/Market");
const getStatus = require("../utils/marketStatus");

const router = express.Router();

/* ADD MARKET (ADMIN) */
router.post("/add", async (req, res) => {
  const market = await Market.create(req.body);
  res.json(market);
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
