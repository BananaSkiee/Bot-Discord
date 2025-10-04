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

    // Update online VC
    await updateOnline(guild);
    setInterval(() => updateOnline(guild), 10000);

    // Sticky Message
    stickyHandler(client);

    // Auto Greeting
    autoGreeting(client);

    // Simulasi BTC
    simulateBTC(client);

    try { autoChat(client); } catch (err) { console.error("❌ Auto chat error:", err); }

    // 🟩 Setup slash command
    try {
      await slashCommandSetup(client);
    } catch (err) {
      console.error("❌ Gagal setup slash command:", err);
    }

    // 🔁 Auto berita
    try { beritaModule(client); } catch (err) { console.error("❌ Auto berita error:", err); }
    
    try { rainbowRole(client, 60_000); } catch (err) { console.error("❌ Rainbow role error:", err); }
    
    // Update pesan grafik BTC
    setInterval(() => {
      const newContent = "📈 BTC: $65,000 (+0.4%)"; // bisa dari API
      updateCryptoMessage(client, newContent);
    }, 60_000);
    
    // 💡 Status bot berganti tiap 1 menit
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

    // 📸 Auto meme tiap 3 jam
    const memeChannel = client.channels.cache.get(memeChannelId);
    if (memeChannel) {
        setInterval(() => {
          autoSendMeme(memeChannel);
        }, 10_800_000); // 3 jam dalam milidetik
        console.log("✅ Fitur auto meme aktif.");
    } else {
        console.error("❌ Channel meme tidak ditemukan. Fitur auto meme dinonaktifkan.");
    }

    // 🔊 Join VC otomatis saat bot online
    try { await joinvoice(client); } catch (err) { console.error("❌ Gagal join voice channel:", err); }
  },
};
            
