const updateOnline = require("../online");
const stickyHandler = require("../sticky");
const autoGreeting = require("../modules/autoGreeting");
const joinvoice = require("../modules/joinvoice");
const countValidator = require("../modules/countValidator");
const simulateBTC = require("../modules/cryptoSimulator");
const updateCryptoMessage = require("../modules/updateCrypto");
const autoSendMeme = require("../modules/autoMeme");
const autoDelete = require("../modules/autoDeleteCryptoMessages.js");
const slashCommandSetup = require("../modules/slashCommandSetup");
const autoChat = require("../modules/autoChat");
const beritaModule = require("../modules/autoNews");
const rainbowRole = require("../modules/rainbowRole");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`🤖 Bot siap sebagai ${client.user.tag}`);

    // Menampilkan semua server tempat bot bergabung
    console.log(`🧩 Bot berada di ${client.guilds.cache.size} server:`);
    client.guilds.cache.forEach((guild) => {
      console.log(`- ${guild.name} (ID: ${guild.id})`);
    });

    const guild = client.guilds.cache.first();
    if (!guild) return;

    console.log("🔧 Memulai inisialisasi module...");

    // 🟩 Setup slash command - PRIORITAS UTAMA
    try {
      await slashCommandSetup(client);
      console.log("✅ slashCommandSetup: Completed");
    } catch (err) {
      console.error("❌ Gagal setup slash command:", err.message);
    }

    // Update online VC
    try {
      await updateOnline(guild);
      setInterval(() => updateOnline(guild), 10000);
      console.log("✅ updateOnline: Active");
    } catch (err) {
      console.error("❌ updateOnline error:", err.message);
    }

    // Sticky Message
    try {
      stickyHandler(client);
      console.log("✅ stickyHandler: Active");
    } catch (err) {
      console.error("❌ stickyHandler error:", err.message);
    }

    // Auto Greeting
    try {
      autoGreeting(client);
      console.log("✅ autoGreeting: Active");
    } catch (err) {
      console.error("❌ autoGreeting error:", err.message);
    }

    // 🔢 Counter
    try {
      countValidator(client);
      console.log("✅ countValidator: Active");
    } catch (err) {
      console.error("❌ countValidator error:", err.message);
    }

    // Simulasi BTC
    try {
      simulateBTC(client);
      console.log("✅ simulateBTC: Active");
    } catch (err) {
      console.error("❌ simulateBTC error:", err.message);
    }

    // Auto Chat
    try { 
      autoChat(client);
      console.log("✅ autoChat: Active");
    } catch (err) { 
      console.error("❌ Auto chat error:", err.message); 
    }

    // 🔁 Auto berita
    try { 
      beritaModule(client);
      console.log("✅ beritaModule: Active");
    } catch (err) { 
      console.error("❌ Auto berita error:", err.message); 
    }
    
    // Rainbow Role
    try { 
      rainbowRole(client, 60_000);
      console.log("✅ rainbowRole: Active");
    } catch (err) { 
      console.error("❌ Rainbow role error:", err.message); 
    }
    
    // Update pesan grafik BTC
    try {
      setInterval(() => {
        const newContent = "📈 BTC: $65,000 (+0.4%)";
        updateCryptoMessage(client, newContent);
      }, 60_000);
      console.log("✅ BTC message updater: Active");
    } catch (err) {
      console.error("❌ BTC message updater error:", err.message);
    }

    // Status berkelas berganti-ganti
    const statuses = [
      "🌌 Menembus batas kemungkinan",
      "📖 Membaca alur takdir",
      "🎧 Mendengarkan suara hati server",
      "🧠 Belajar tanpa akhir",
      "🗝️ Menjaga kedamaian digital",
      "🕊️ Menyebar aura positif",
      "⚙️ Melayani tanpa lelah",
      "🌙 Diam tapi ada",
      "🔮 Menerawang masa depan",
      "🌟 Jadi cahaya di kegelapan",
      "🛡️ Mengamankan dunia maya",
      "📡 Terhubung dengan dimensi lain",
      "⏳ Waktu terus berjalan... dan aku tetap di sini",
    ];

    try {
      let index = 0;
      const updateStatus = () => {
        const status = statuses[index % statuses.length];
        client.user.setActivity(status, { type: 0 });
        index++;
      };
      updateStatus();
      setInterval(updateStatus, 60_000);
      console.log("✅ Status rotation: Active");
    } catch (err) {
      console.error("❌ Status rotation error:", err.message);
    }

    // ✅ Auto meme tiap 1 jam
    try {
      const channel = await client.channels.fetch("1352404777513783336");
      setInterval(() => autoSendMeme(channel), 3600000);
      console.log("✅ autoSendMeme: Active");
    } catch (err) {
      console.error("❌ Gagal setup auto meme:", err.message);
    }

    // ✅ Join voice channel saat online
    try {
      await joinvoice(client);
      console.log("✅ joinvoice: Completed");
    } catch (err) {
      console.error("❌ Gagal join voice channel:", err.message);
    }

    console.log("🎉 Semua module initialized!");
  },
};
