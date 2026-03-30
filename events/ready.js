// events/ready.js
const { ChannelType } = require("discord.js");
// const stickyHandler = require("../sticky");
const autoGreeting = require("../modules/autoGreeting");
// Menghapus: const countValidator = require("../modules/countValidator");
// const autoSendMeme = require("../modules/autoMeme");
const slashCommandSetup = require("../modules/slashCommandSetup");
// const beritaModule = require("../modules/autoNews");
// const rainbowRole = require("../modules/rainbowRole");
const VerifySystem = require("../modules/verify");
// const { startAutoAnimation } = require("../modules/iconAnim");
const { setInitialBotRoles } = require("../modules/autoBotRole"); 
// const { sendInitialCard } = require('../modules/introCard');
// const minecraftBot = require("../modules/minecraftBot");
// const statusMC = require("../modules/statusMC");
// const minecraftChecker = require('../modules/checker');
const { initAutoDelete } = require('../modules/autoDelete');
const verifyEngine = require('../modules/verifyEngine');
const bioMonitor = require('../modules/bioMonitorSystem');
const tripleVerify = require('../modules/tripleVerifySystem');

// ✅ TAMBAHAN: Import Feedback System
// const { sendFeedbackPrompt } = require("../modules/feedbackSystem");

const verifySystem = new VerifySystem();

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`🤖 ${client.user.tag} siap melayani BananaSkiee Community!`);

        const verifyConfig = {
        clientId:     process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET, // Ambil dari Koyeb
        redirectUri:  process.env.REDIRECT_URI,  // Ambil dari Koyeb
        roleId:       process.env.VERIFIED_ROLE_ID, // Sesuai ID Role 15
        guildId:      process.env.GUILD_ID,      // Sesuai GUILD_ID di .env lu
        inviteLink:   process.env.REQUIRED_BIO_LINK,
        port:         process.env.PORT || 3000
    };
    
    const ROLE_NON_VERIFY = "1444248589051367435";
    const ROLE_MEMBER = "1352286235233620108";
    
    /*    // ⛏️ Minecraft bot init (New Module)
    try {
        minecraftBot.init(client); 
      console.log("✅ Minecraft Bot Module Active");
    } catch (err) {
        console.error("❌ Gagal inisialisasi Minecraft bot:", err);
    } */

    // Tambahkan ini di bawah minecraftBot.init(client);
/* try {
    await statusMC.init(client);
    console.log("✅ StatusMC Module Active (Channel: 1457830508867223626)");
} catch (err) {
    console.error("❌ Gagal inisialisasi StatusMC:", err);
} */
        
/*    // ⛏️ Minecraft Status Checker (New Module)
    try {
      minecraftChecker(client);
      console.log("✅ Minecraft Checker Module Active");
    } catch (err) {
      console.error("❌ Gagal inisialisasi Minecraft checker:", err);
    } */

    try {
    await tripleVerify.init(client);
    console.log("✅ Triple Verify System: Auto-progression active");
} catch (err) {
    console.error("❌ Triple Verify init error:", err);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BIO MONITOR SYSTEM - DENGAN AUTO-CLEANUP CHANNEL
    // ═══════════════════════════════════════════════════════════════
    try {
      // STEP 1: Hapus semua pesan di channel verifikasi
      const verifyCh = client.channels.cache.get('1487876267339681813');
      if (verifyCh) {
        console.log('🧹 Membersihkan channel verifikasi...');
        
        let deletedCount = 0;
        let fetched;
        
        // Loop hapus sampai bersih (handle bulk delete)
        do {
          fetched = await verifyCh.messages.fetch({ limit: 100 });
          
          if (fetched.size > 0) {
            // Bulk delete jika < 14 hari, individual jika > 14 hari
            const deletable = fetched.filter(m => (Date.now() - m.createdTimestamp) < 1209600000);
            const oldMessages = fetched.filter(m => (Date.now() - m.createdTimestamp) >= 1209600000);
            
            if (deletable.size > 0) {
              await verifyCh.bulkDelete(deletable, true);
              deletedCount += deletable.size;
            }
            
            // Hapus pesan lama satu per satu
            for (const [, msg] of oldMessages) {
              await msg.delete().catch(() => {});
              deletedCount++;
              await new Promise(r => setTimeout(r, 100)); // Rate limit safety
            }
          }
        } while (fetched.size >= 100);
        
        console.log(`✅ Channel dibersihkan: ${deletedCount} pesan dihapus`);
      }

      // STEP 2: Inisialisasi bio monitor
      await bioMonitor.init(client);
      
      // STEP 3: Kirim pesan verifikasi baru (setelah channel bersih)
      if (verifyCh) {
        await bioMonitor.setupMessage(verifyCh);
        console.log("✅ Bio Monitor: Embed verifikasi baru dikirim");
      }
      
    } catch (err) {
      console.error("❌ Bio Monitor init error:", err);
            }

   // AutoDelete Module - EmpireBS
        try {
            initAutoDelete(client);
            console.log("✅ AutoDelete Module Active | Channel: 1487876267339681813");
        } catch (err) {
            console.error("❌ Gagal inisialisasi AutoDelete Module:", err);
        }

  // Verify Member Dan Verify Hosting
    try {
      // Jalankan sistem lama (Tombol/Chat)
      await verifySystem.initialize(client);
      console.log("✅ Verify System (Lama) initialized");

      // Jalankan sistem baru (Numpang Port 3000 index.js)
      await verifyEngine(client, verifyConfig);
      console.log("✅ Bio Verify Engine (Baru) Integrated");
    } catch (error) {
      console.error("❌ Gagal initialize verifikasi:", error);
    }

    // 🧭 Server Info
    console.log(`🧩 Bot berada di ${client.guilds.cache.size} server:`);
    client.guilds.cache.forEach((g) => console.log(`- ${g.name} (ID: ${g.id})`));
    
/*    //🌈 Rainbow role (interval aman 45 detik)
    try {
      rainbowRole(client, 45_000); // DIUBAH MENJADI 45.000 ms (45 detik)
    } catch (err) {
      console.error("❌ Rainbow role error:", err);
    } "/

// Leaderboard voice dan massage
    
/*    try {
        // Hapus/Comment baris di bawah ini setelah pesan masuk ke Discord!
        await sendInitialCard(client, ''); 
    } catch (err) {
        console.error("❌ Intro Card gagal dipicu:", err.message);
    } */
    
/*    // 🧷 Sticky handler
    try {
      stickyHandler(client);
    } catch (err) {
      console.error("❌ Sticky handler error:", err);
    } */

    // 👋 Auto greeting
    try {
      autoGreeting(client);
    } catch (err) {
      console.error("❌ Auto greeting error:", err);
    }

/*    // 🧠 Auto animasi icon server
    try {
      startAutoAnimation(client);
    } catch (err) {
      console.error("❌ Icon anim error:", err);
    }.  */

    // 📝 Slash command register
    try {
      await slashCommandSetup(client);
    } catch (err) {
      console.error("❌ Gagal setup slash command:", err);
    }

/*    // 📰 Auto berita
    try {
      beritaModule(client);
    } catch (err) {
      console.error("❌ Auto berita error:", err);
    } */

/*    // 🟡 Auto status rotasi tiap 1 menit
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
    setInterval(updateStatus, 60_000); */
    
const logChannel = client.channels.cache.get("1352800131933802547");
if (logChannel) {
  logChannel.send({
    embeds: [{
      color: 0x3498db, // Biru (Reload/Online)
      title: "🔄 Sistem Reload",
      description: "✅ **Status:** Online & Siap Melayani.",
      timestamp: new Date()
    }]
  });
}

/*    // 🤣 Auto meme tiap 3 jam
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
    } */

    // ✅ TAMBAHAN: Kirim Feedback Prompt (hanya sekali saat ready)
   /* try {
      await sendFeedbackPrompt(client);
    } catch (err) {
      console.error("❌ Feedback prompt error:", err);
    } */

    // 🛡️ ROLE BOT OTOMATIS (Sesuai permintaan Anda: Semua bot yang sudah ada)
    try {
        await setInitialBotRoles(client); // <--- TAMBAHKAN BARIS INI
    } catch (err) {
        console.error("❌ Auto Bot Role (Initial) error:", err);
    }
    
  },
};
