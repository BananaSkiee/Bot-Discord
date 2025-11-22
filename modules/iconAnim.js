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
    // Error 50035 (Invalid Form Body) atau 40003 (Rate Limit) sering terjadi
    console.error("❌ Gagal ubah icon:", err.message);
  }
}

async function startAutoAnimation(client) {
  // Hanya jalankan jika ada icon dan belum berjalan
  if (isRunning || icons.length === 0) return;
  isRunning = true;

  try {
    // 💡 KRITIS: Dapatkan ID Guild dari environment variable
    const guildId = process.env.GUILD_ID; 

    if (!guildId) {
        console.error("❌ GUILD_ID tidak ditemukan di environment variable. Animasi dihentikan.");
        isRunning = false;
        return;
    }
    
    // Dapatkan Guild yang spesifik menggunakan ID
    const guild = client.guilds.cache.get(guildId); 
    
    if (!guild) {
      console.error(`❌ Guild dengan ID ${guildId} tidak ditemukan dalam cache.`);
      isRunning = false;
      return;
    }

    await updateIcon(guild); // update pertama
    interval = setInterval(() => updateIcon(guild), 30 * 1000); // tiap 30 detik
    console.log("▶️ Auto animation icon dimulai...");
  } catch (err) {
    console.error("❌ Gagal start auto animation:", err.message);
    isRunning = false;
  }
}

module.exports = {
  startAutoAnimation,
};
