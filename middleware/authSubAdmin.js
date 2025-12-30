const jwt = require("jsonwebtoken");
const SubAdmin = require("../models/SubAdmin");

module.exports = async function authSubAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "SUB_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const subAdmin = await SubAdmin.findById(decoded.id);
    if (!subAdmin) {
      return res.status(401).json({ message: "Invalid sub admin" });
    }

    req.subAdmin = subAdmin; // 🔥 important
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
