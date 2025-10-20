const moment = require("moment-timezone");
const cron = require("node-cron");

const CHANNEL_ID = "1360303391175217343"; // Ganti ID channel jam

const hariIndonesia = {
  Sunday: "Minggu",
  Monday: "Senin",
  Tuesday: "Selasa",
  Wednesday: "Rabu",
  Thursday: "Kamis",
  Friday: "Jumat",
  Saturday: "Sabtu",
};

module.exports = (client) => {
  // 🔁 Update tiap 5 menit aja biar aman
  cron.schedule("*/5 * * * *", async () => {
    try {
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (!channel || !channel.setName) return;

      const now = moment().tz("Asia/Jakarta");
      const hariID = hariIndonesia[now.format("dddd")];
      const tanggal = now.format("D");
      const jam = now.format("HH:mm");
      const namaBaru = `「 ${hariID}, ${tanggal} - ${jam} Jam 」`;

      // 🧠 Cuma ubah kalau beda (biar gak spam Discord API)
      if (channel.name !== namaBaru) {
        await channel.setName(namaBaru);
        console.log(`✅ Nama channel diupdate: ${namaBaru}`);
      } else {
        console.log(`ℹ️ Nama channel sudah sama, skip update.`);
      }
    } catch (err) {
      console.error("❌ Gagal update voice channel waktu:", err.message);
    }
  });
};
