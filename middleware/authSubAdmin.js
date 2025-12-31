const jwt = require("jsonwebtoken");
const SubAdmin = require("../models/SubAdmin");

module.exports = async function (req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 DATABASE SE SUBADMIN NIKALO
    const subAdmin = await SubAdmin.findById(decoded.id);
    if (!subAdmin) {
      return res.status(401).json({ message: "Invalid sub admin" });
    }

    // 🔥 YAHI SABSE IMPORTANT LINE
    req.subAdmin = subAdmin;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Auth failed" });
  }
};
