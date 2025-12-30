cron.schedule("* * * * *", async () => {
  const now = new Date();
  const current = now.getHours().toString().padStart(2,"0") + ":" +
                  now.getMinutes().toString().padStart(2,"0");

  const markets = await Market.find();

  for (let m of markets) {
    if (m.openTime === current) {
      m.status = "OPEN";
      await m.save();
    }

    if (m.closeTime === current) {
      m.status = "CLOSED";
      await m.save();
    }
  }

  console.log("⏱ Market auto-check done:", current);
});
