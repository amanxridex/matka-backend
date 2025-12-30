router.get("/", async (req, res) => {
  const markets = await Market.find();

  console.log("DEBUG MARKETS RAW:", markets);

  const data = markets.map(m => ({
    _id: m._id,
    name: m.name,
    openTime: m.openTime,
    closeTime: m.closeTime,
    status: getStatus(m.openTime, m.closeTime)
  }));

  res.json(data);
});
