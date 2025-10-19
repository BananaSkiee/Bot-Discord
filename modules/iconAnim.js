const fs = require("fs");
const path = require("path");

let isRunning = false;
let currentIndex = 0;
let interval = null;

const iconDir = path.join(__dirname, "../assets/icon-frames");
const icons = fs.readdirSync(iconDir).filter(file =>
  file.endsWith(".png") || file.endsWith(".jpg")
);

if (icons.length === 0) {
  console.warn("⚠️ Tidak ada file icon ditemukan di folder:", iconDir);
}

async function updateIcon(guild) {
  if (!guild || icons.length === 0) return;

  const iconPath = path.join(iconDir, icons[currentIndex]);
  const iconBuffer = fs.readFileSync(iconPath);

  try {
    await guild.setIcon(iconBuffer);
    console.log(`✅ Icon server diubah ke: ${icons[currentIndex]}`);
    currentIndex = (currentIndex + 1) % icons.length;
  } catch (err) {
    console.error("❌ Gagal ubah icon:", err.message);
  }
}

async function startAutoAnimation(client) {
  if (isRunning || icons.length === 0) return;
  isRunning = true;

  try {
    const guild = client.guilds.cache.first(); // Atau gunakan client.guilds.fetch("ID_GUILD")
    if (!guild) {
      console.error("❌ Guild tidak ditemukan.");
      return;
    }

    await updateIcon(guild); // update pertama
    interval = setInterval(() => updateIcon(guild), 5 * 60 * 1000); // 5 menit
    console.log("▶️ Auto animation icon dimulai...");
  } catch (err) {
    console.error("❌ Gagal start auto animation:", err.message);
  }
}

module.exports = {
  startAutoAnimation,
};
