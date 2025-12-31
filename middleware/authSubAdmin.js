const jwt = require("jsonwebtoken");

module.exports = function authSubAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "SUB_ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.subAdmin = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
