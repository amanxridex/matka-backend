const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Market = require("../models/Market");
const Admin = require("../models/Admin");
const SubAdmin = require("../models/SubAdmin"); // ✅ FIX HERE
const auth = require("../middleware/auth");

const router = express.Router();

/* ---------- ADMIN LOGIN ---------- */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return res.json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});

/* ---------- CREATE SUB ADMIN ---------- */
router.post("/create-subadmin", auth("SUPER_ADMIN"), async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const sa = await SubAdmin.create({
    username,
    password: hash,
    createdBy: req.user.id
    // ❌ users & balance yahan likhne ki zarurat nahi
  });

  res.json(sa);
});

/* ---------- SUB ADMIN STATS ---------- */
router.get("/subadmin-stats", auth("SUPER_ADMIN"), async (req, res) => {
  try {
    const subs = await SubAdmin.find({}, "username users balance");

    const totalSubAdmins = subs.length;
    const totalUsers = subs.reduce((sum, s) => sum + (s.users || 0), 0);
    const totalWallet = subs.reduce((sum, s) => sum + (s.balance || 0), 0);

    res.json({
      totalSubAdmins,
      totalUsers,
      totalWallet,
      subAdmins: subs
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------- UPDATE MARKET (NAME + TIME) ---------- */
router.put("/market/:id", auth("SUPER_ADMIN"), async (req, res) => {
  try {
    const { name, openTime, closeTime } = req.body;

    const market = await Market.findByIdAndUpdate(
      req.params.id,
      {
        name,
        openTime,
        closeTime
      },
      { new: true }
    );

    if (!market) {
      return res.status(404).json({ message: "Market not found" });
    }

    res.json(market);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   SUPERADMIN GLOBAL P&L SUMMARY (DATE FILTERED)
===================================== */
router.get("/pl/summary", auth("SUPER_ADMIN"), async (req, res) => {
  try {
    const { date } = req.query;

    let start = null, end = null;

    if (date) {
      const [y, m, d] = date.split("-").map(Number);

      // IST DAY RANGE
      start = new Date(Date.UTC(y, m - 1, d, -5, -30, 0));
      end   = new Date(Date.UTC(y, m - 1, d, 18, 29, 59, 999));
    }

    const User = require("../models/User");
    const users = await User.find({}, { transactions: 1 }).lean();

    let totalBet = 0;
    let totalWin = 0;

    users.forEach(u => {
      (u.transactions || []).forEach(tx => {
        if (!tx.date) return;

        if (start && end) {
          const t = new Date(tx.date);
          if (t < start || t > end) return;
        }

        if (tx.type === "BET") totalBet += tx.amount || 0;
        if (tx.type === "WIN") totalWin += tx.amount || 0;
      });
    });

    res.json({
      totalProfit: totalBet,
      totalLoss: totalWin,
      netPL: totalBet - totalWin
    });

  } catch (err) {
    console.error("P/L SUMMARY ERROR:", err);
    res.status(500).json({ message: "P/L calculation failed" });
  }
});

/* =====================================
   SUPERADMIN P/L BREAKDOWN (DATE FILTERED)
===================================== */
router.get("/pl/breakdown", auth("SUPER_ADMIN"), async (req, res) => {
  try {
    const { date } = req.query;

    let start = null, end = null;

    if (date) {
      const [y, m, d] = date.split("-").map(Number);
      start = new Date(Date.UTC(y, m - 1, d, -5, -30, 0));
      end   = new Date(Date.UTC(y, m - 1, d, 18, 29, 59, 999));
    }

    const User = require("../models/User");
    const users = await User.find({}, { transactions: 1 }).lean();

    const markets = {};
    const games = {};
    const numbers = {};

    users.forEach(u => {
      (u.transactions || []).forEach(tx => {
        if (!tx.date) return;

        if (start && end) {
          const t = new Date(tx.date);
          if (t < start || t > end) return;
        }

        if (tx.market) {
          markets[tx.market] ??= { bet: 0, win: 0 };
          if (tx.type === "BET") markets[tx.market].bet += tx.amount || 0;
          if (tx.type === "WIN") markets[tx.market].win += tx.amount || 0;
        }

        if (tx.gameType && tx.type === "BET") {
          games[tx.gameType] ??= { bet: 0 };
          games[tx.gameType].bet += tx.amount || 0;
        }

        if (tx.type === "BET") {
          (tx.bets || []).forEach(b => {
            const key = `${b.digit}_${tx.gameType}`;
            numbers[key] ??= {
              number: b.digit,
              game: tx.gameType,
              bet: 0
            };
            numbers[key].bet += b.amount || 0;
          });
        }
      });
    });

    Object.values(markets).forEach(m => {
      m.pl = m.bet - m.win;
    });

    res.json({ markets, games, numbers });

  } catch (err) {
    console.error("P/L BREAKDOWN ERROR:", err);
    res.status(500).json({ message: "Breakdown failed" });
  }
});

// 🔥 GET ADMIN WALLET
router.get("/wallet", auth("SUPER_ADMIN"), async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).lean();

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      success: true,
      balance: admin.balance || 0
    });

  } catch (err) {
    console.error("ADMIN WALLET ERROR", err);
    res.status(500).json({ success: false });
  }
});

/* ---------- LIST SUB ADMINS ---------- */
router.get("/subadmins", auth("SUPER_ADMIN"), async (req, res) => {
  const subs = await SubAdmin.find().select("-password");
  res.json(subs);
});

module.exports = router;
