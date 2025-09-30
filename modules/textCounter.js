const fs = require("fs");
const cron = require("node-cron");

const CHANNEL_ID = "1355219286502932802"; // GANTI ke ID text channel kamu
const FILE_PATH = "./data/textCounter.json";

// Buat folder data jika belum ada
if (!fs.existsSync("./data")) fs.mkdirSync("./data");

// Mulai dari 115 kalau file belum ada
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify({ count: 122 }, null, 2));
}

module.exports = (client) => {
  cron.schedule("* * * * *", async () => {
    try {
      const data = JSON.parse(fs.readFileSync(FILE_PATH));
      const count = data.count;

      const channel = await client.channels.fetch(CHANNEL_ID);
      if (!channel || !channel.send) return;

      await channel.send(`${count}`);

      fs.writeFileSync(FILE_PATH, JSON.stringify({ count: count + 1 }, null, 2));
      console.log(`🧮 Counter dikirim: ${count}`);
    } catch (err) {
      console.error("❌ Gagal kirim counter:", err.message);
    }
  });
};
