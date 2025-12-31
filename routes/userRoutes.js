const express = require("express");
const User = require("../models/User");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

/* ===============================
   GET USERS OF LOGGED-IN SUBADMIN
   =============================== */
router.get("/", authSubAdmin, async (req, res) => {
  try {
    const users = await User.find({
      createdBy: req.subAdmin.id
    }).select("username balance");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ===============================
   CREATE USER (+1 USER, +BALANCE)
   =============================== */
router.post("/create", authSubAdmin, async (req, res) => {
  try {
    // 1️⃣ create user
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      createdBy: req.subAdmin.id,
      balance: 0
    });

    // 2️⃣ increment subadmin counters
    await SubAdmin.findByIdAndUpdate(
      req.subAdmin.id,
      {
        $inc: {
          users: 1,
          balance: 100 // reward per user (change if needed)
        }
      }
    );

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User creation failed" });
  }
});

/* ===============================
   DELETE USER (-1 USER, -BALANCE)
   =============================== */
router.delete("/:id", authSubAdmin, async (req, res) => {
  try {
    // 1️⃣ delete only subadmin's own user
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.subAdmin.id
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2️⃣ reverse subadmin counters
    await SubAdmin.findByIdAndUpdate(
      req.subAdmin.id,
      {
        $inc: {
          users: -1,
          balance: -0 // reverse reward
        }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User delete failed" });
  }
});

module.exports = router;
