// events/ready.js
const { ChannelType } = require("discord.js");
const stickyHandler = require("../sticky");
const autoGreeting = require("../modules/autoGreeting");
const joinvoice = require("../modules/joinvoice");
const autoSendMeme = require("../modules/autoMeme");
const slashCommandSetup = require("../modules/slashCommandSetup");
const beritaModule = require("../modules/autoNews");
const minecraftBot = require("../modules/minecraftBot");
const VerifySystem = require("../modules/verify");
const { startAutoAnimation } = require("../modules/iconAnim");
const { setInitialBotRoles } = require("../modules/autoBotRole"); 
const activitySystem = require("../modules/activitySystem");
const tracker = require("../modules/activityTracker");

const verifySystem = new VerifySystem();

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`🤖 ${client.user.tag} siap melayani BananaSkiee Community!`);

    // ==========================================
    // 1. MINECRAFT BOT (DIJALANKAN PERTAMA)
    // ==========================================
    // Di dalam execute(client)
try {
    // Memastikan modul dipanggil dengan benar baik sebagai fungsi atau objek
    if (typeof minecraftBot === 'function') {
        minecraftBot(client);
    } else if (minecraftBot.init) {
        minecraftBot.init(client);
    }
    console.log("✅ Minecraft Bot Module Active");
} catch (err) {
    console.error("❌ Gagal inisialisasi Minecraft bot:", err);
}

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

    // 🏆 Activity & Tracker
    try {
        activitySystem(client);
        tracker(client);
        console.log("✅ Activity & Tracker Systems Active");
    } catch (err) {
        console.error("❌ Tracker system error:", err);
    }
    
    // 🧷 Sticky, Greeting, & Icon Anim
    try {
      stickyHandler(client);
      autoGreeting(client);
      startAutoAnimation(client);
    } catch (err) {
      console.error("❌ Basic handlers error:", err);
    }

    // 📝 Slash Command & News
    try {
      await slashCommandSetup(client);
      beritaModule(client);
    } catch (err) {
      console.error("❌ Setup modules error:", err);
    }

    // 🟡 Status Rotation
    const statuses = ["🌌 BananaSkiee", "🛡️ Proteksi Maksimal", "🌙 Standby 24/7"];
    let index = 0;
    setInterval(() => {
        client.user.setActivity(statuses[index % statuses.length], { type: 0 });
        index++;
    }, 60000);

    // 🤣 Auto Meme
    const memeChannelId = process.env.MEME_CHANNEL_ID;
    if (memeChannelId) {
      const memeChannel = client.channels.cache.get(memeChannelId);
      if (memeChannel) setInterval(() => autoSendMeme(memeChannel), 10800000);
    }

    // 🎙️ Join Voice
    try {
      await joinvoice(client);
    } catch (err) {
      console.error("❌ Gagal join voice channel:", err);
    }

    // ==========================================
    // 2. PROSES BERAT (DIJALANKAN TERAKHIR)
    // ==========================================
    
    // Pengecekan Role Member (Non-Verify)
    console.log("🔍 Melakukan pengecekan role seluruh member...");
    const ROLE_NON_VERIFY = "1444248589051367435";
    const ROLE_MEMBER = "1352286235233620108";

    client.guilds.cache.forEach(async (guild) => {
      try {
        const members = await guild.members.fetch();
        members.forEach(member => {
          if (member.user.bot) return;
          const hasMember = member.roles.cache.has(ROLE_MEMBER);
          const hasNonV = member.roles.cache.has(ROLE_NON_VERIFY);
          if (!hasMember && !hasNonV) member.roles.add(ROLE_NON_VERIFY).catch(() => {});
          if (hasMember && hasNonV) member.roles.remove(ROLE_NON_VERIFY).catch(() => {});
        });
      } catch (err) { console.error(`Gagal scan member: ${guild.name}`); }
    });

    // Pengecekan Role Bot
    try {
        await setInitialBotRoles(client);
    } catch (err) {
        console.error("❌ Auto Bot Role (Initial) error:", err);
    }
  },
};
