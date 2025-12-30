function getStatus(openTime, closeTime) {
  if (!openTime || !closeTime) return "CLOSED";

  const now = new Date();
  const [oh, om] = openTime.split(":");
  const [ch, cm] = closeTime.split(":");

  const open = new Date();
  open.setHours(oh, om, 0);

  const close = new Date();
  close.setHours(ch, cm, 0);

  return now >= open && now <= close ? "OPEN" : "CLOSED";
}

module.exports = getStatus;
