const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const SubAdmin = require("../models/SubAdmin");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

/* GET USERS */
router.post("/create", authSubAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashed,
      createdBy: req.subAdmin.id
    });

    // 🔥 SUBADMIN USERS +1
    await SubAdmin.findByIdAndUpdate(req.subAdmin.id, {
      $inc: { users: 1 }
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

module.exports = router;