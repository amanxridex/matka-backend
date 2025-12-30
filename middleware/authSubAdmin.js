const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "SUB_ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.subadmin = decoded; // id + username
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
