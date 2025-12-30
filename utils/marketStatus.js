module.exports = function getStatus(openTime, closeTime) {
  if (!openTime || !closeTime) return "CLOSED";

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);

  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return "OPEN";
  }

  return "CLOSED";
};
