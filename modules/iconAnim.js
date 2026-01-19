//modules/iconAnim.js
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
    // Log di sini dihapus agar tidak spam konsol setiap ganti frame
    currentIndex = (currentIndex + 1) % icons.length;
  } catch (err) {
    // Error tetap ditampilkan untuk memantau jika terkena Rate Limit
    console.error("❌ Gagal ubah icon:", err.message);
  }
}

async function startAutoAnimation(client) {
  if (isRunning || icons.length === 0) return;
  isRunning = true;

  try {
    const guildId = process.env.GUILD_ID; 

    if (!guildId) {
        console.error("❌ GUILD_ID tidak ditemukan di environment variable.");
        isRunning = false;
        return;
    }
    
    const guild = client.guilds.cache.get(guildId); 
    
    if (!guild) {
      console.error(`❌ Guild dengan ID ${guildId} tidak ditemukan dalam cache.`);
      isRunning = false;
      return;
    }

    await updateIcon(guild); 
    interval = setInterval(() => updateIcon(guild), 30 * 1000); 
    
    // Ini satu-satunya log yang akan muncul saat program dijalankan
    console.log(`▶️ Auto animation icon dimulai (${icons.length} frame ditemukan).`);
    
  } catch (err) {
    console.error("❌ Gagal start auto animation:", err.message);
    isRunning = false;
  }
}

module.exports = {
  startAutoAnimation,
};
