//events/ready.js
const { ChannelType } = require("discord.js");
const autoGreeting = require("../modules/autoGreeting");
const slashCommandSetup = require("../modules/slashCommandSetup");
const VerifySystem = require("../modules/verify");
const VerifyInviteSystem = require("../modules/verifyInvite");
const { setInitialBotRoles } = require("../modules/autoBotRole"); 
const { initAutoDelete } = require('../modules/autoDelete');
const roleManager = require('../modules/roleManager');
const autoThread = require('../modules/autoThread');
const sociabuzz = require("../modules/sociabuzz");
const welcomeHandler = require("../modules/welcomeHandler"); // Tambahkan ini
const banManager = require("../modules/banManager"); // Tambahkan ini
const { sendInitialCard } = require('../modules/introCard');
const beritaModule = require("../modules/autoNews");
const autoSendMeme = require("../modules/autoMeme");
const { sendFeedbackPrompt } = require("../modules/feedbackSystem");

const app = require("../index");

const verifySystem = new VerifySystem();
let verifyInviteSystem = null;

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`🤖 ${client.user.tag} siap melayani BananaSkiee Community!`);
    
    const ROLE_NON_VERIFY = "1444248589051367435";
    const ROLE_MEMBER = "1352286235233620108";

    // 📰 Auto berita
    try {
      beritaModule(client);
    } catch (err) {
      console.error("❌ Auto berita error:", err);
    }
    
  try {
      banManager(client);
    } catch (err) {
      console.error("❌ Gagal inisialisasi BanManager:", err);
  }
    
        try {
        // Hapus/Comment baris di bawah ini setelah pesan masuk ke Discord!
        await sendInitialCard(client, '1498935928994140253'); 
    } catch (err) {
        console.error("❌ Intro Card gagal dipicu:", err.message);
    }
    
    try {
      await sendFeedbackPrompt(client);
    } catch (err) {
      console.error("❌ Feedback prompt error:", err);
    }
    
    // --- Module Welcome (Components V2) ---
    try {
      welcomeHandler(client);
      console.log("✅ Welcome Module (Components V2) Active");
    } catch (err) {
      console.error("❌ Gagal inisialisasi Welcome Module:", err);
    }

    // --- SociaBuzz Integration ---
    try {
      sociabuzz(client, app);
      console.log("✅ SociaBuzz Webhook Integration Active");
    } catch (err) {
      console.error("❌ Gagal inisialisasi SociaBuzz Module:", err);
    }
    
    try {
        autoThread(client);
    } catch (err) {
        console.error("Gagal inisialisasi AutoThread:", err);
    }
    
    try {
      verifyInviteSystem = new VerifyInviteSystem(client);
      await verifyInviteSystem.connect();
      client.verifyInviteSystem = verifyInviteSystem;
      console.log("✅ VerifyInvite System (Anti-Tumbal) Active");
    } catch (err) {
      console.error("❌ Gagal inisialisasi VerifyInvite System:", err);
    }
    
    try {
      roleManager(client);
      console.log("✅ RoleManager (Tier System) Active");
    } catch (err) {
      console.error("❌ Gagal inisialisasi RoleManager:", err);
    }
    
    try {
      initAutoDelete(client);
      console.log("✅ AutoDelete Module Active | Channel: 1487876267339681813");
    } catch (err) {
      console.error("❌ Gagal inisialisasi AutoDelete Module:", err);
    }

    try {
      await verifySystem.initialize(client);
      console.log("✅ Verify system initialized");
    } catch (error) {
      console.error("❌ Gagal initialize verify system:", error);
    }

    console.log(`🧩 Bot berada di ${client.guilds.cache.size} server:`);
    client.guilds.cache.forEach((g) => console.log(`- ${g.name} (ID: ${g.id})`));
    
    try {
      autoGreeting(client);
    } catch (err) {
      console.error("❌ Auto greeting error:", err);
    }

    try {
      await slashCommandSetup(client);
    } catch (err) {
      console.error("❌ Gagal setup slash command:", err);
    }
    
    const logChannel = client.channels.cache.get("1352800131933802547");
    if (logChannel) {
      logChannel.send({
        embeds: [{
          color: 0x3498db,
          title: "🔄 Sistem Reload",
          description: "✅ **Status:** Online & Siap Melayani.",
          timestamp: new Date()
        }]
      });
    }

    try {
      await setInitialBotRoles(client);
    } catch (err) {
      console.error("❌ Auto Bot Role (Initial) error:", err);
    }
  },
}

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
