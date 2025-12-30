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


/* ---------- LIST SUB ADMINS ---------- */
router.get("/subadmins", auth("SUPER_ADMIN"), async (req, res) => {
  const subs = await SubAdmin.find().select("-password");
  res.json(subs);
});

module.exports = router;
