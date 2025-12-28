const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const SubAdmin = require("../models/Subadmin");
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
  });

  res.json(sa);
});

/* ---------- LIST SUB ADMINS ---------- */
router.get("/subadmins", auth("SUPER_ADMIN"), async (req, res) => {
  const subs = await SubAdmin.find().select("-password");
  res.json(subs);
});

module.exports = router;
