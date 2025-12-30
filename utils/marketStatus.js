function getStatus(openTime, closeTime) {
  if (!openTime || !closeTime) return "CLOSED";

  const now = new Date();

  // IST conversion
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const current = ist.toTimeString().slice(0,5);

  if (current >= openTime && current < closeTime) {
    return "OPEN";
  }
  return "CLOSED";
}

module.exports = getStatus;
