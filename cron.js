const cron = require("node-cron");
const Market = require("./models/Market");

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0,5); // HH:mm

  const markets = await Market.find();

  for (let m of markets) {
    if (m.openAt === currentTime && m.status !== "OPEN") {
      m.status = "OPEN";
      await m.save();
    }

    if (m.closeAt === currentTime && m.status !== "CLOSED") {
      m.status = "CLOSED";
      await m.save();
    }
  }

  console.log("⏱ Market auto-check done:", currentTime);
});
