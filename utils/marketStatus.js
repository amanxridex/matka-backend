function getStatus(openTime, closeTime) {
  const now = new Date();

  const [oh, om] = openTime.split(":");
  const [ch, cm] = closeTime.split(":");

  const open = new Date();
  open.setHours(oh, om, 0);

  const close = new Date();
  close.setHours(ch, cm, 0);

  if (now < open) return "CLOSED";
  if (now >= open && now <= close) return "OPEN";
  return "CLOSED";
}

module.exports = getStatus;
