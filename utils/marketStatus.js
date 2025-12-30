module.exports = function getStatus(openTime, closeTime) {
  if (!openTime || !closeTime) {
    return "CLOSED"; // safety fallback
  }

  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes
    ? "OPEN"
    : "CLOSED";
};
