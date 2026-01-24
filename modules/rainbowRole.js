//modules/rainbowRole.js
require("dotenv").config();
const { schedule } = require("./apiLimiter");

const log = global.log || console;

// Warna ditambah lebih banyak agar transisi lebih keren
const COLORS = [
  "#FF0000", "#FF7F00", "#FFFF00", "#00FF00", 
  "#00FFFF", "#0000FF", "#8B00FF", "#FF00FF",
  "#FF1493", "#00FA9A", "#FFD700", "#FF4500"
];

module.exports = function rainbowRole(client, interval = 20000) { // Waktu tetap 20 detik
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return log.error("Guild tidak ditemukan untuk rainbow role.");

  const roleIds = process.env.RAINBOW_ROLE_IDS?.split(",").map(id => id.trim());
  if (!roleIds?.length) return log.warn("RAINBOW_ROLE_IDS belum dikonfigurasi di .env");

  roleIds.forEach(roleId => {
    log.info(`🌈 Inisialisasi rainbow role: ${roleId}`);
    let index = 0;
    let isFirstRun = true;

    const changeColor = async () => {
      try {
        const role = guild.roles.cache.get(roleId);
        if (!role) {
          log.warn(`Role ${roleId} tidak ditemukan.`);
          return setTimeout(changeColor, interval);
        }

        const color = COLORS[index % COLORS.length];

        // Edit role tanpa spamming log setiap ganti warna
        await schedule(() => role.edit({ color }));

        // Log hanya muncul sekali saat berhasil jalan
        if (isFirstRun) {
          log.info(`✅ Rainbow role untuk [${role.name}] berhasil berjalan!`);
          isFirstRun = false;
        }

        index++;
        setTimeout(changeColor, interval);

      } catch (err) {
        if (err?.status === 429 || err?.code === 50013) {
          log.warn(`⚠️ Rate limit / No Perms untuk role ${roleId}, mencoba lagi nanti...`);
          setTimeout(changeColor, 30_000); 
        } else {
          log.error(`❌ Error rainbow role: ${err.message}`);
          setTimeout(changeColor, interval);
        }
      }
    };

    changeColor();
  });
};
