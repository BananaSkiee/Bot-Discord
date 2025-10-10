const updateOnline = require("../online");
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

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`🤖 Bot siap sebagai ${client.user.tag}`);

    // Pindahkan init ke dalam execute
    if (minecraft.init) {
      minecraft.init(client);
    }
    
    // 🆕 FITUR AUTO SEND RULES
    try {
        const RULES_CHANNEL_ID = '1401061819195592785'; // ID RULES YANG KAMU KASIH
        const rulesChannel = await client.channels.fetch(RULES_CHANNEL_ID);
        
        if (rulesChannel) {
            // Hapus pesan lama satu per satu
            const messages = await rulesChannel.messages.fetch({ limit: 50 });
            if (messages.size > 0) {
                for (const message of messages.values()) {
                    try {
                        await message.delete();
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.log('⚠️ Tidak bisa hapus pesan lama:', error.message);
                    }
                }
                console.log('🗑️ Pesan lama dihapus');
            }

            const rules = await rulesModule.execute(client);

            // Kirim semua embed berurutan dengan delay
            await rulesChannel.send({ embeds: [rules.welcomeHeaderEmbed] });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await rulesChannel.send({ 
                embeds: [rules.welcomeMainEmbed],
                components: [rules.welcomeButtons]
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await rulesChannel.send({ 
                embeds: [rules.guidebookEmbed],
                components: [rules.guideButton]
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await rulesChannel.send({ embeds: [rules.guidelinesEmbed] });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await rulesChannel.send({ 
                content: '**🔍 Jelajahi informasi lebih lanjut:**',
                components: [rules.infoSelectMenu] 
            });
            
            console.log('✅ Rules premium berhasil dikirim ke channel');
        }
    } catch (error) {
        console.error('❌ Gagal mengirim rules:', error.message);
    }

    // ... KODE LAINNYA TETAP SAMA ...
    console.log(`🧩 Bot berada di ${client.guilds.cache.size} server:`);
    client.guilds.cache.forEach((guild) => {
      console.log(`- ${guild.name} (ID: ${guild.id})`);
    });

    const guild = client.guilds.cache.first();
    if (!guild) return;

    if (guild) {
      try {
        await updateOnline(guild);
        setInterval(() => updateOnline(guild), 60_000);
      } catch (err) {
        console.error("❌ Gagal update online VC:", err);
      }
    }

    try { stickyHandler(client); } catch (err) { console.error("❌ Sticky handler error:", err); }
    try { autoGreeting(client); } catch (err) { console.error("❌ Auto greeting error:", err); }
    try { simulateBTC(client); } catch (err) { console.error("❌ Simulasi BTC error:", err); }

    try {
      await slashCommandSetup(client);
    } catch (err) {
      console.error("❌ Gagal setup slash command:", err);
    }

    try { beritaModule(client); } catch (err) { console.error("❌ Auto berita error:", err); }
    
    if (rainbowRole) {
      try { rainbowRole(client, 60_000); } catch (err) { console.error("❌ Rainbow role error:", err); }
    }
    
    // Update crypto message dengan channel ID yang valid
    setInterval(async () => {
      try {
        const newContent = "📈 BTC: $65,000 (+0.4%)";
        await updateCryptoMessage(client, newContent);
      } catch (error) {
        console.error('❌ Gagal update crypto:', error.message);
      }
    }, 60_000);
    
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
    
    try { await joinvoice(client); } catch (err) { console.error("❌ Gagal join voice channel:", err); }
  },
};
