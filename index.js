//index.js.
require("dotenv").config();
require("./modules/globalLogger"); 
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");
const config = require("./config");

// 🧠 Custom modules & data log
// const stickyHandler = require("./sticky");
const autoGreeting = require("./modules/autoGreeting");
const welcomecard = require("./modules/welcomeCard");
const invitesTracker = require("./modules/invitesTracker");
const webhookModule = require("./modules/webhook");
const srvName = require("./modules/srvName.js"); 
const { startAutoAnimation } = require("./modules/iconAnim");
const { logMemberAction, logFirstMessage, createLogEntryEmbed } = require("./modules/memberLogForum"); 
const { handleIntroInteractions } = require('./modules/introCard');
const { handleInitialRoles, handleVerificationUpdate } = require("./modules/autoBotRole");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildInvites, 
  ],
});

require('./modules/rateLimiter')(client);     

client.commands = new Collection();

// --- CACHE KHUSUS UNTUK LOG ---
const inviteCache = new Collection();
const firstMessageCache = new Collection(); 

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

// 🔄 Self-ping system (Tanpa Chat)
function startSelfPing() {
  const SELF_PING_URL = `https://${process.env.KOYEB_APP_NAME || 'parallel-helaine-bananaskiee-701c062c'}.koyeb.app/health`;
  const PING_INTERVAL = 5 * 60 * 1000; // Cukup tiap 5 menit
  
  setInterval(async () => {
    try {
      await fetch(SELF_PING_URL);
    } catch (error) {
      console.log('❌ Ping internal gagal:', error.message);
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

// 📌 Message Handler
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const webCmds = ["helpweb", "registerweb", "createweb", "listweb", "gettoken", "nukeweb", "sendweb", "broadweb", "clearweb"];
  
  if (message.content.startsWith("!")) {
    const cmd = message.content.slice(1).split(" ")[0].toLowerCase();
    
    if (webCmds.includes(cmd)) {
        return webhookModule.handleCommand(message);
    }
  } // Tutup blok IF Startswith
}); // Tutup event MessageCreate

// 🔄 LOG: Perubahan Role (Penting!)
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Cek apakah yang berubah HANYA role
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    await handleVerificationUpdate(oldMember, newMember);

    if (oldRoles.size === newRoles.size) return; // Tidak ada perubahan jumlah role

    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

    // Jika ada penambahan atau pencabutan role
    if (addedRoles.size > 0 || removedRoles.size > 0) {
        
        const added = addedRoles.map(r => r.toString());
        const removed = removedRoles.map(r => r.toString());

        console.log(`✅ LOG ROLE: ${newMember.user.tag} - Ditambah: ${added.join(', ')} | Dicabut: ${removed.join(', ')}`);

        // Log aksi ke Forum
        await logMemberAction(newMember, 'ROLE_UPDATE', {
            roleChanges: { added, removed }
        });
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
  await handleInitialRoles(member);
  
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

// 🧯 Global Error Handler
process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled Error:", err);
});

startSelfPing();

// Monitoring Webhook Baru Otomatis
client.on("webhookUpdate", async (channel) => {
    setTimeout(async () => {
        try {
            const webhooks = await channel.fetchWebhooks();
            const latest = webhooks.first();
            if (latest) await webhookModule.monitorNewWebhook(latest);
        } catch (e) {}
    }, 1500);
});

// 🔐 Login bot
client.login(config.token);
// --- HANDLER UNTUK INTRO CARD (MODAL & INFO DESKRIPSI) ---
client.on('interactionCreate', async (interaction) => {
    try {
        await handleIntroInteractions(interaction);
    } catch (err) {
        console.error("❌ Intro Interaction Error:", err);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM');
  
  try {
    // Gunakan fetch supaya pasti dapet channel-nya walaupun cache lagi kosong
    const logChannel = await client.channels.fetch("1352800131933802547");
    if (logChannel) {
      await logChannel.send({
        embeds: [{
          color: 0xe74c3c, 
          description: "🛑 **Status:** Offline / Sedang Restart.",
          timestamp: new Date()
        }]
      });
    }
  } catch (err) {
    console.error("Gagal kirim log shutdown:", err.message);
  }

  client.destroy();
  server.close(() => {
    process.exit(0);
  });
});
