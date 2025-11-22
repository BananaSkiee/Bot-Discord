require("dotenv").config();
require("./modules/globalLogger"); 
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");
const config = require("./config");

// 🧠 Custom modules & data log
const stickyHandler = require("./sticky");
const autoGreeting = require("./modules/autoGreeting");
const updateTimeChannel = require("./modules/updateTimeChannel");
const welcomecard = require("./modules/welcomeCard");
const invitesTracker = require("./modules/invitesTracker");
const srvName = require("./modules/srvName.js"); 
const { startAutoAnimation } = require("./modules/iconAnim");
const { logMemberAction, logFirstMessage, createLogEntryEmbed } = require("./modules/memberLogForum"); 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences, // PENTING: Untuk status online/dnd/mobile
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildInvites, // PENTING: Untuk Invite Tracker
  ],
});

require('./modules/rateLimiter')(client);     
require('./modules/autoSafeRename')(client);  

client.commands = new Collection();

// --- CACHE KHUSUS UNTUK LOG (Penting untuk menghindari duplikasi log/rate limit) ---
const inviteCache = new Collection();
const firstMessageCache = new Collection(); // Untuk melacak ID member yang sudah mengirim pesan pertama

// 🌐 Web server (Koyeb)
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get("/", (_, res) => res.send("✅ Bot Akira aktif"));
app.get("/health", (_, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

const server = app.listen(PORT, () => {
  console.log("🌐 Web server hidup di port " + PORT);
});

// 🔄 Self-ping system
function startSelfPing() {
  const SELF_PING_URL = `https://${process.env.KOYEB_APP_NAME || 'parallel-helaine-bananaskiee-701c062c'}.koyeb.app/health`;
  const PING_INTERVAL = 3 * 60 * 1000; 
  
  console.log(`🔄 Starting self-ping system to: ${SELF_PING_URL}`);
  
  setInterval(async () => {
    try {
      await fetch(SELF_PING_URL);
    } catch (error) {
      console.log('❌ Self-ping failed:', error.message);
    }
  }, PING_INTERVAL);
}

// 📂 Load events
fs.readdirSync("./events").forEach((file) => {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
});

srvName(client);


// 📌 Sticky Message Handler & Custom Commands
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild || !message.member) return;

  stickyHandler(client, message);
  invitesTracker(client);
  
  const member = message.member;
  const content = message.content.toLowerCase();
  
  // --- A. LOG PESAN PERTAMA ---
  if (!firstMessageCache.has(member.id)) {
    // Catat pesan pertama, lalu masukkan ke cache agar tidak dicatat lagi
    await logFirstMessage(message); 
    firstMessageCache.set(member.id, true);
  }

  // --- B. COMMAND SIMULASI LOG: !1, !2, !3 ---
  if (content === "!1" || content === "!2" || content === "!3") {
      const isOwnerOrAdmin = member?.permissions.has("ADMINISTRATOR") || member?.guild.ownerId === member.id;
      
      if (!isOwnerOrAdmin) {
          return message.reply({ content: "❌ Perintah simulasi ini hanya bisa digunakan oleh Administrator/Owner.", ephemeral: true });
      }
      
      let logTypeText;
      if (content === '!1') { logTypeText = 'Simulasi: Member Bergabung'; }
      else if (content === '!2') { logTypeText = 'Simulasi: Member Keluar'; }
      else if (content === '!3') { logTypeText = 'Simulasi: Member Masuk Kembali'; }

      // Catat aksi di Forum Log Persisten
      const confirmationEmbed = await createLogEntryEmbed(member, 'CMD_SIM', { command: content });
      await logMemberAction(member, 'CMD_SIM', { command: content }); 

      // Kirim balasan konfirmasi
      await message.channel.send({ 
          content: `**[KONFIRMASI]** ${member.user.tag} memicu simulasi: ${logTypeText}`,
          embeds: [confirmationEmbed] 
      }).catch(err => console.error("❌ Gagal mengirim konfirmasi simulasi:", err.message));
      
      if (message.deletable) await message.delete().catch(err => console.error("❌ Gagal delete pesan perintah:", err));
      return;
  }
});

// 💾 Invite Tracker (Pre-cache semua invite)
client.on('ready', async () => {
    client.guilds.cache.forEach(async guild => {
        try {
            const invites = await guild.invites.fetch();
            inviteCache.set(guild.id, invites);
        } catch (error) {
            console.error(`❌ INVITE TRACKER: Gagal fetch invites untuk guild ${guild.id}.`, error.message);
        }
    });
});

client.on('inviteCreate', invite => {
    const invites = inviteCache.get(invite.guild.id) || new Collection();
    invites.set(invite.code, invite);
});

client.on('inviteDelete', invite => {
    const invites = inviteCache.get(invite.guild.id);
    if (invites) invites.delete(invite.code);
});


// 🚀 Log ketika user join (Event nyata)
client.on("guildMemberAdd", async (member) => {
  autoGreeting(client, member);
  
  let inviteUsed = null;

  try {
    const currentInvites = await member.guild.invites.fetch();
    const oldInvites = inviteCache.get(member.guild.id);

    // Bandingkan cache lama dan baru untuk menemukan invite yang digunakan
    if (oldInvites) {
        inviteUsed = currentInvites.find(i => oldInvites.get(i.code) && oldInvites.get(i.code).uses < i.uses);
    }
    
    // Update cache
    inviteCache.set(member.guild.id, currentInvites);

  } catch (error) {
    console.error("❌ INVITE TRACKER: Gagal melacak invite member baru.", error.message);
  }

  // Log event Join nyata ke Forum (otomatis membuat thread)
  const extraData = {
    invite: inviteUsed ? { code: inviteUsed.code, inviter: inviteUsed.inviter } : null
  };
  await logMemberAction(member, 'JOIN', extraData); 
});

// 🚪 Log ketika user leave (Event nyata)
client.on("guildMemberRemove", async (member) => {
    // Hapus dari cache pesan pertama
    firstMessageCache.delete(member.id);
    // Log event Leave nyata ke Forum
    await logMemberAction(member, 'LEAVE'); 
});


// ⏱ Update waktu di voice channel tiap 30 detik
setInterval(() => {
  updateTimeChannel(client);
}, 30 * 1000);

// 🧯 Global Error Handler
process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled Error:", err);
});

// 🚀 Start bot dan self-ping system
client.once("ready", () => {
  console.log(`✅ ${client.user.tag} is now online!`);
  startSelfPing(); 
  try {
    const onlineCounter = require("./modules/online");
    onlineCounter(client);
    console.log("✅ Sistem online counter aktif");
  } catch (err) {
    console.error("❌ Gagal inisialisasi onlineCounter:", err);
  }
});

// 🔐 Login bot
client.login(config.token);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  client.destroy();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
