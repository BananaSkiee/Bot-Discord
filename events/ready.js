// events/ready.js
const { ChannelType } = require("discord.js");
const stickyHandler = require("../sticky");
const autoGreeting = require("../modules/autoGreeting");
const joinvoice = require("../modules/joinvoice");
// Menghapus: const countValidator = require("../modules/countValidator");
const autoSendMeme = require("../modules/autoMeme");
const slashCommandSetup = require("../modules/slashCommandSetup");
const beritaModule = require("../modules/autoNews");
const rainbowRole = require("../modules/rainbowRole");
// Menghapus: const minecraft = require("../modules/minecraft");
const VerifySystem = require("../modules/verify");
const { startAutoAnimation } = require("../modules/iconAnim");

const verifySystem = new VerifySystem();

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`🤖 ${client.user.tag} siap melayani BananaSkiee Community!`);

    // ✅ Verify System
    try {
      await verifySystem.initialize(client);
      console.log("✅ Verify system initialized");
    } catch (error) {
      console.error("❌ Gagal initialize verify system:", error);
    }

    // 🧭 Server Info
    console.log(`🧩 Bot berada di ${client.guilds.cache.size} server:`);
    client.guilds.cache.forEach((g) => console.log(`- ${g.name} (ID: ${g.id})`));

    // 🌈 Rainbow role (interval aman 45 detik)
    try {
      rainbowRole(client, 45_000); // DIUBAH MENJADI 45.000 ms (45 detik)
    } catch (err) {
      console.error("❌ Rainbow role error:", err);
    }

    // 🧷 Sticky handler
    try {
      stickyHandler(client);
    } catch (err) {
      console.error("❌ Sticky handler error:", err);
    }

    // 👋 Auto greeting
    try {
      autoGreeting(client);
    } catch (err) {
      console.error("❌ Auto greeting error:", err);
    }

    // 🧠 Auto animasi icon server
    try {
      startAutoAnimation(client);
    } catch (err) {
      console.error("❌ Icon anim error:", err);
    }

    // 📝 Slash command register
    try {
      await slashCommandSetup(client);
    } catch (err) {
      console.error("❌ Gagal setup slash command:", err);
    }

    // 📰 Auto berita
    try {
      beritaModule(client);
    } catch (err) {
      console.error("❌ Auto berita error:", err);
    }

    // 🟡 Auto status rotasi tiap 1 menit
    const statuses = [
      "🌌 Menjaga BananaSkiee Community",
      "📖 Memandu member baru",
      "🎧 Mendengarkan komunitas",
      "🧠 Belajar bersama member",
      "🗝️ Mengamankan server",
      "🕊️ Menyebar positivity",
      "⚙️ Melayani BananaSkiee",
      "🌙 Standby 24/7",
      "🔮 Masa depan cerah",
      "🌟 Cahaya komunitas",
      "🛡️ Proteksi maksimal",
      "📡 Terhubung dengan semua",
      "⏳ Setia menemani",
    ];
    let index = 0;
    const updateStatus = () => {
      try {
        const status = statuses[index % statuses.length];
        client.user.setActivity(status, { type: 0 });
        index++;
      } catch (err) {
        console.error("❌ Update status error:", err);
      }
    };
    updateStatus();
    setInterval(updateStatus, 60_000);

    // 🤣 Auto meme tiap 3 jam
    const memeChannelId = process.env.MEME_CHANNEL_ID;
    if (memeChannelId) {
      const memeChannel = client.channels.cache.get(memeChannelId);
      if (memeChannel) {
        setInterval(() => autoSendMeme(memeChannel), 10_800_000);
        console.log("✅ Fitur auto meme aktif.");
      } else {
        console.error("❌ Channel meme tidak ditemukan. Fitur auto meme dinonaktifkan.");
      }
    } else {
      console.error("❌ MEME_CHANNEL_ID tidak dikonfigurasi. Fitur auto meme dinonaktifkan.");
    }

    // 🎙️ Join voice channel saat ready
    try {
      await joinvoice(client);
    } catch (err) {
      console.error("❌ Gagal join voice channel:", err);
    }

    // ⛏️ Minecraft bot init
    // KODE INI DIHAPUS untuk menghilangkan ERROR: ECONNREFUSED
    // try {
    //   if (minecraft.init) minecraft.init(client);
    // } catch (err) {
    //   console.error("❌ Gagal inisialisasi Minecraft bot:", err);
    // }
  },
};
