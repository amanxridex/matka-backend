const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 THIS WAS MISSING / WRONG BEFORE
    req.subAdmin = {
      id: decoded.id,
      username: decoded.username
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
