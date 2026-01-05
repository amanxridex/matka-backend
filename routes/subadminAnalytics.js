const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authSubAdmin = require("../middleware/authSubAdmin");
const auth = require("../middleware/auth");

/* ===============================
   SUB ADMIN ANALYTICS
   =============================== */
router.get("/analytics", authSubAdmin, async (req, res) => {
  try {
    const { market = "all", date } = req.query;

    const users = await User.find({ createdBy: req.subAdmin._id }).lean();

    let totalBet = 0, totalWin = 0;
    let marketMap = {}, gameMap = {}, numberMap = {}, userMap = {};

    let start = null, end = null;

    if (date) {
      start = new Date(date);
      start.setHours(0,0,0,0);
      end = new Date(date);
      end.setHours(23,59,59,999);
    }

    users.forEach(u => {
      (u.transactions || []).forEach(t => {

        // DATE FILTER ✅
        if (start && end) {
          const d = new Date(t.date);
          if (d < start || d > end) return;
        }

        // MARKET FILTER ✅
        if (market !== "all" && t.market !== market) return;

        // BET
        if (t.type === "BET") {
          totalBet += t.amount || 0;

          if (t.market) {
            marketMap[t.market] ??= { bet: 0, win: 0 };
            marketMap[t.market].bet += t.amount || 0;
          }

          if (t.gameType) {
            gameMap[t.gameType] ??= { bet: 0, win: 0 };
            gameMap[t.gameType].bet += t.amount || 0;
          }

          (t.bets || []).forEach(b => {
            const key = `${b.digit}_${t.gameType}`;
            numberMap[key] ??= {
              number: b.digit,
              game: t.gameType,
              bet: 0
            };
            numberMap[key].bet += b.amount || 0;
          });

          userMap[u.username] ??= { bet: 0, win: 0 };
          userMap[u.username].bet += t.amount || 0;
        }

        // WIN
        if (t.type === "WIN") {
          totalWin += t.amount || 0;

          if (t.market && marketMap[t.market])
            marketMap[t.market].win += t.amount || 0;

          if (t.gameType && gameMap[t.gameType])
            gameMap[t.gameType].win += t.amount || 0;

          userMap[u.username] ??= { bet: 0, win: 0 };
          userMap[u.username].win += t.amount || 0;
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
    console.error("ANALYTICS ERROR", err);
    res.status(500).json({ success: false });
  }
});

/* =====================================
   SUBADMIN SETTLEMENT (LIVE / DATE WISE)
===================================== */
router.get("/subadmin-settlement", auth("SUPER_ADMIN"), async (req, res) => {
  try {
    const { subAdminId, date } = req.query;
    if (!subAdminId) {
      return res.status(400).json({ message: "subAdminId required" });
    }

    // 1️⃣ SubAdmin + commission (LIVE)
    const subAdmin = await SubAdmin.findById(subAdminId).lean();
    if (!subAdmin) {
      return res.status(404).json({ message: "SubAdmin not found" });
    }

    const fixed = subAdmin.commission?.fixed || 0;
    const variable = subAdmin.commission?.variable || 0;
    const subPercent = fixed + variable;

    // 2️⃣ Overall P/L from analytics (already LIVE)
    const analytics = await getSubAdminAnalytics(subAdminId, date);
    const overallPL = analytics?.overallPL || 0;

    // 3️⃣ Settlement calculation
    const settlementAmount =
      Math.round(Math.abs(overallPL) * subPercent / 100);

    const direction =
      overallPL >= 0
        ? "SUPER_PAYS_SUB"
        : "SUB_PAYS_SUPER";

    res.json({
      date: date || "today",
      overallPL,
      subPercent,
      settlementAmount,
      direction,
      breakdown: {
        fixed,
        variable
      }
    });

  } catch (err) {
    console.error("SUBADMIN SETTLEMENT ERROR:", err);
    res.status(500).json({ message: "Settlement failed" });
  }
});

/* ===============================
   DYNAMIC MARKET LIST
   =============================== */
router.get("/analytics/markets", authSubAdmin, async (req, res) => {
  try {
    const users = await User.find(
      { createdBy: req.subAdmin.id },
      { transactions: 1 }
    ).lean();

    const set = new Set();

    users.forEach(u => {
      u.transactions?.forEach(t => {
        if (t.market) {
          set.add(t.market);
        }
      });
    });

    res.json({
      success: true,
      markets: Array.from(set)
    });

  } catch (err) {
    console.error("MARKET DROPDOWN ERROR", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
