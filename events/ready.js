const { ChannelType } = require('discord.js');
const stickyHandler = require("../sticky");
const autoGreeting = require("../modules/autoGreeting");
const joinvoice = require("../modules/joinvoice");
const countValidator = require("../modules/countValidator");
const simulateBTC = require("../modules/cryptoSimulator");
const updateCryptoMessage = require("../modules/updateCrypto");
const autoSendMeme = require("../modules/autoMeme");
const slashCommandSetup = require("../modules/slashCommandSetup");
const beritaModule = require("../modules/autoNews");
const rainbowRole = require("../modules/rainbowRole");
const minecraft = require("../modules/minecraft");
const rulesModule = require("../modules/rules");
const VerifySystem = require('../modules/verify');
const { startAutoAnimation } = require("../modules/iconAnim");
const updateTimeChannel = require("../modules/updateTimeChannel"); // ⏰ Jam channel
const onlineCounter = require("../modules/online"); // 👥 Online real-time

const verifySystem = new VerifySystem();

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`🤖 ${client.user.tag} siap melayani BananaSkiee Community!`);

    // ✅ VERIFY SYSTEM INITIALIZATION
    try {
      await verifySystem.initialize(client);
      console.log('✅ Verify system initialized');
    } catch (error) {
      console.error('❌ Gagal initialize verify system:', error);
    }

    // 🆕 FITUR AUTO SEND RULES
    try {
      const RULES_CHANNEL_ID = '1352326247186694164';
      const rulesChannel = await client.channels.fetch(RULES_CHANNEL_ID);

      if (rulesChannel && rulesChannel.type === ChannelType.GuildText) {
        const messages = await rulesChannel.messages.fetch({ limit: 50 });
        for (const message of messages.values()) {
          try {
            await message.delete();
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.log('⚠️ Tidak bisa hapus pesan lama:', error.message);
          }
        }

        console.log('🗑️ Pesan lama dihapus, mengirim rules baru...');
        const rules = await rulesModule.execute(client);

        await rulesChannel.send({
          embeds: [rules.welcomeEmbed],
          components: [rules.welcomeButtons, rules.infoSelectMenu]
        });

        console.log('✅ Rules BananaSkiee Community berhasil dikirim ke channel');
      } else {
        console.error('❌ Channel rules tidak ditemukan atau bukan text channel');
      }
    } catch (error) {
      console.error('❌ Gagal mengirim rules:', error);
    }

    // 🧭 List server bot aktif
    console.log(`🧩 Bot berada di ${client.guilds.cache.size} server:`);
    client.guilds.cache.forEach((guild) => {
      console.log(`- ${guild.name} (ID: ${guild.id})`);
    });

    // ⏰ Update jam channel tiap 1 menit
    try {
      updateTimeChannel(client);
    } catch (err) {
      console.error("❌ Gagal inisialisasi updateTimeChannel:", err);
    }

    // 👥 Online counter real-time
    try {
      onlineCounter(client);
    } catch (err) {
      console.error("❌ Gagal inisialisasi onlineCounter:", err);
    }

    // 🌈 Rainbow role (interval aman 25 detik)
    try {
      rainbowRole(client, 25000);
    } catch (err) {
      console.error("❌ Rainbow role error:", err);
    }

    // 🧷 Sticky message
    try { stickyHandler(client); } catch (err) { console.error("❌ Sticky handler error:", err); }

    // 👋 Auto greeting
    try { autoGreeting(client); } catch (err) { console.error("❌ Auto greeting error:", err); }

    // 💹 Simulasi BTC
    try { simulateBTC(client); } catch (err) { console.error("❌ Simulasi BTC error:", err); }

    // 🧠 Auto animasi icon server
    try { startAutoAnimation(client); } catch (err) { console.error("❌ Icon anim error:", err); }

    // 📝 Slash command register (sekali di ready)
    try {
      await slashCommandSetup(client);
    } catch (err) {
      console.error("❌ Gagal setup slash command:", err);
    }

    // 📰 Auto berita
    try { beritaModule(client); } catch (err) { console.error("❌ Auto berita error:", err); }

    // 📈 Update pesan crypto tiap 1 menit
    setInterval(async () => {
      try {
        const newContent = "📈 BTC: $65,000 (+0.4%)";
        await updateCryptoMessage(client, newContent);
      } catch (error) {
        console.error('❌ Gagal update crypto:', error.message);
      }
    }, 60_000);

    // 🟡 Auto status rotasi
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

    // 🤣 Auto meme
    const memeChannelId = process.env.MEME_CHANNEL_ID;
    if (memeChannelId) {
      const memeChannel = client.channels.cache.get(memeChannelId);
      if (memeChannel) {
        setInterval(() => {
          autoSendMeme(memeChannel);
        }, 10_800_000);
        console.log("✅ Fitur auto meme aktif.");
      } else {
        console.error("❌ Channel meme tidak ditemukan. Fitur auto meme dinonaktifkan.");
      }
    } else {
      console.error("❌ MEME_CHANNEL_ID tidak dikonfigurasi. Fitur auto meme dinonaktifkan.");
    }

    // 🎙️ Join voice channel saat ready
    try { await joinvoice(client); } catch (err) { console.error("❌ Gagal join voice channel:", err); }

    // ⛏️ Minecraft bot init
    if (minecraft.init) {
      minecraft.init(client);
    }
  },
};
