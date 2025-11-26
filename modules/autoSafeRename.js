// modules/autoSafeRename.js
module.exports = (client) => {
  console.log("🧠 Auto-safe rename patch aktif (versi aman).");

  const lastRename = new Map(); // Simpan waktu rename terakhir per guild

  client.on("ready", () => {
    setInterval(async () => {
      for (const guild of client.guilds.cache.values()) {
        try {
          const now = Date.now();
          const last = lastRename.get(guild.id) || 0;

          // Batasi rename max setiap 10 menit
          if (now - last < 10 * 60 * 1000) continue;

          const newName = "dsc.gg/BananaSkiee"; // contoh nama tetap
          if (guild.name !== newName) {
            await guild.setName(newName);
            console.log(`📝 [AutoSafeRename] Nama server diubah ke: ${newName}`);
            lastRename.set(guild.id, now);
          }
        } catch (err) {
          if (err.status === 429) {
            console.warn("⚠️ [AutoSafeRename] Rate limit, skip 15 menit...");
            await new Promise((r) => setTimeout(r, 15 * 60 * 1000));
          } else {
            console.error("❌ [AutoSafeRename] Error:", err.message);
          }
        }
      }
    }, 60_000); // Cek tiap 1 menit, tapi rename max 1x/10menit
  });
};
