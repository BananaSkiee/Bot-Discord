const moment = require("moment-timezone");
const cron = require("node-cron");

// ID voice channel kamu
const CHANNEL_ID = "1360303391175217343"; // GANTI YAAA!

// Mapping hari ke Bahasa Indonesia
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
  cron.schedule("* * * * *", async () => {
    try {
      // GUNAKAN CACHE, JANGAN FETCH
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (!channel || !channel.setName) {
        console.log("❌ Channel tidak ditemukan di cache atau bukan voice channel");
        return;
      }

      const now = moment().tz("Asia/Jakarta");

      const hariEN = now.format("dddd");
      const hariID = hariIndonesia[hariEN] || hariEN;

      const tanggal = now.format("D"); // Contoh: 16 Juli
      const jam = now.format("HH:mm");

      const namaBaru = `「 ${hariID}, ${tanggal} - ${jam} Jam 」`;

      if (channel.name !== namaBaru) {
        await channel.setName(namaBaru);
        console.log(`✅ Nama channel diupdate: ${namaBaru}`);
      }
    } catch (error) {
      console.error("❌ Gagal update voice channel waktu:", error.message);
    }
  });
};
