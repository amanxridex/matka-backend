const express = require("express");
const User = require("../models/User");
const authSubAdmin = require("../middleware/authSubAdmin");

const router = express.Router();

/* GET USERS OF LOGGED-IN SUBADMIN */
router.get("/", authSubAdmin, async (req, res) => {
  const users = await User.find({
    createdBy: req.subAdmin.id
  }).select("username balance");

  res.json(users);
});

/* CREATE USER */
router.post("/create", authSubAdmin, async (req, res) => {
  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    createdBy: req.subAdmin.id,
    balance: 0
  });

  res.json(user);
});

module.exports = router;
