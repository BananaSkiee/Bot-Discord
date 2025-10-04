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
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (!channel || !channel.setName) return;

      const now = moment().tz("Asia/Jakarta");

      const hariEN = now.format("dddd");
      const hariID = hariIndonesia[hariEN] || hariEN;

      const tanggal = now.format("D"); // Contoh: 16 Juli
      const jam = now.format("HH:mm");

      const namaBaru = `「 ${hariID}, ${tanggal} - ${jam} Jam 」`;

      if (channel.name !== namaBaru) {
        await channel.setName(namaBaru);
        console.log(`✅ Nama channel update: ${namaBaru}`);
      }
    } catch (error) {
      console.error("❌ Gagal update voice channel waktu:", error.message);
    }
  });
};
