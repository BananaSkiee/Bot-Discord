// events/ready.js
const autoGreeting = require("../modules/autoGreeting");
const slashCommandSetup = require("../modules/slashCommandSetup");
const VerifySystem = require("../modules/verify");
const VerifyInviteSystem = require("../modules/verifyInvite");
const { setInitialBotRoles } = require("../modules/autoBotRole");
const { initAutoDelete } = require('../modules/autoDelete');
const roleManager = require('../modules/roleManager');
const autoThread = require('../modules/autoThread');
const sociabuzz = require("../modules/sociabuzz");
const welcomeHandler = require("../modules/welcomeHandler");
const banManager = require("../modules/banManager");
// const { sendInitialCard } = require('../modules/introCard');
const beritaModule = require("../modules/autoNews");
// const autoSendMeme = require("../modules/autoMeme");
// const { sendFeedbackPrompt } = require("../modules/feedbackSystem");
const partnership = require('../modules/partnership');
const app = require("../index");

const verifySystem = new VerifySystem();
let verifyInviteSystem = null;

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`🤖 ${client.user.tag} siap melayani BananaSkiee Community!`);

    try { beritaModule(client); } catch (err) { console.error("❌ Auto berita error:", err); }
    try { banManager(client); } catch (err) { console.error("❌ Gagal inisialisasi BanManager:", err); }
    // try { await sendInitialCard(client, '1498935928994140253'); } catch (err) { console.error("❌ Intro Card gagal dipicu:", err.message); }
    // try { await sendFeedbackPrompt(client); } catch (err) { console.error("❌ Feedback prompt error:", err); }
try {
  partnership.init(client);
  await partnership.sendDashboard(client);
} catch (err) { console.error("❌ Partnership Module error:", err); }
    
    try {
      welcomeHandler(client);
      console.log("✅ Welcome Module Active");
    } catch (err) { console.error("❌ Gagal inisialisasi Welcome Module:", err); }

    try {
      sociabuzz(client, app);
      console.log("✅ SociaBuzz Active");
    } catch (err) { console.error("❌ Gagal inisialisasi SociaBuzz Module:", err); }

    try { autoThread(client); } catch (err) { console.error("❌ Gagal inisialisasi AutoThread:", err); }

    try {
      verifyInviteSystem = new VerifyInviteSystem(client);
      await verifyInviteSystem.connect();
      client.verifyInviteSystem = verifyInviteSystem;
      console.log("✅ VerifyInvite System Active");
    } catch (err) { console.error("❌ Gagal inisialisasi VerifyInvite System:", err); }

    try {
      roleManager(client);
      console.log("✅ RoleManager Active");
    } catch (err) { console.error("❌ Gagal inisialisasi RoleManager:", err); }

    try {
      initAutoDelete(client);
      console.log("✅ AutoDelete Module Active");
    } catch (err) { console.error("❌ Gagal inisialisasi AutoDelete Module:", err); }

    try {
      await verifySystem.initialize(client);
      console.log("✅ Verify system initialized");
    } catch (error) { console.error("❌ Gagal initialize verify system:", error); }

    console.log(`🧩 Bot berada di ${client.guilds.cache.size} server:`);
    client.guilds.cache.forEach((g) => console.log(`- ${g.name} (ID: ${g.id})`));

    try { autoGreeting(client); } catch (err) { console.error("❌ Auto greeting error:", err); }
    try { await slashCommandSetup(client); } catch (err) { console.error("❌ Gagal setup slash command:", err); }

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

    try { await setInitialBotRoles(client); } catch (err) { console.error("❌ Auto Bot Role error:", err); }

    /*
    // ── AUTO MEME (dinonaktifkan) ──────────────────────────────────────────────
    const memeChannelId = process.env.MEME_CHANNEL_ID;
    if (memeChannelId) {
      const memeChannel = client.channels.cache.get(memeChannelId);
      if (memeChannel) {
        autoSendMeme(memeChannel);
        setInterval(() => autoSendMeme(memeChannel), 10_800_000);
        console.log("✅ Fitur auto meme aktif.");
      } else {
        console.warn("⚠️ Channel meme tidak ditemukan.");
      }
    } else {
      console.warn("⚠️ MEME_CHANNEL_ID tidak dikonfigurasi di .env.");
    }
    // ─────────────────────────────────────────────────────────────────────────
    */
  },
};
