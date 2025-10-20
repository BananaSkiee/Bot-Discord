// modules/autoSafeRename.js
module.exports = (client) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  client.once("ready", async () => {
    console.log("🧠 Auto-safe rename patch aktif untuk semua guild.");

    // Ganti perilaku default .setName()
    const originalSetName = client.guilds.cache.first()?.setName?.constructor?.prototype;

    if (!originalSetName) return console.error("❌ Tidak bisa hook ke setName.");

    const proto = Object.getPrototypeOf(client.guilds.cache.first());
    const original = proto.setName;

    proto.setName = async function (name, reason) {
      try {
        const res = await original.call(this, name, reason);
        console.log(`📝 [AutoSafeRename] Nama server diubah ke: ${name}`);
        return res;
      } catch (err) {
        if (err.status === 429 || (err.message && err.message.includes("rate limit"))) {
          console.warn("⚠️ [AutoSafeRename] Terkena rate limit Discord! Tunggu 15 menit...");
          await sleep(15 * 60 * 1000);
        } else if (err.code === 50013) {
          console.error("🚫 [AutoSafeRename] Bot tidak punya izin MANAGE_GUILD!");
          await sleep(60000);
        } else {
          console.error("❌ [AutoSafeRename] Gagal ubah nama:", err.message);
          await sleep(5000);
        }
      }
    };
  });
};
