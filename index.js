// index.js
require("dotenv").config();
require("./modules/globalLogger"); 
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");
const config = require("./config");

// 🎯 TARGET SERVER ID - Hanya server ini yang bisa pakai fitur bot
const TARGET_SERVER_ID = "1347233781391560837";

// 🧠 Custom modules & data log
// const stickyHandler = require("./sticky");
const autoGreeting = require("./modules/autoGreeting");
// const welcomecard = require("./modules/welcomeCard");
const invitesTracker = require("./modules/invitesTracker");
// const webhookModule = require("./modules/webhook");
// const srvName = require("./modules/srvName.js"); 
// const { startAutoAnimation } = require("./modules/iconAnim");
// const { logMemberAction, logFirstMessage, createLogEntryEmbed } = require("./modules/memberLogForum"); 
const { handleIntroInteractions } = require('./modules/introCard');
const { handleInitialRoles, handleVerificationUpdate } = require("./modules/autoBotRole");

// ✅ TAMBAHAN: Import Suggestion & Feedback Systems
const { handleSuggestionMessage, handleSuggestionButtons } = require('./modules/suggestionSystem');
const { 
    handleFeedbackButtons, 
    handleFeedbackModal
} = require('./modules/feedbackSystem');

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

module.exports = app; // <--- WAJIB ADA

app.get("/", (_, res) => res.send("✅ Bot Akira aktif"));
app.get("/health", (_, res) => res.status(200).json({ status: 'OK' }));

const server = app.listen(PORT, () => {
  console.log("🌐 Web server pusat hidup di port " + PORT);
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

// ⛔⛔⛔ SERVER GUARD FUNCTION ⛔⛔⛔
// Cek apakah event dari server yang diizinkan
function isTargetServer(guild) {
  if (!guild) return false;
  return guild.id === TARGET_SERVER_ID;
}

// Wrapper untuk silent ignore
function guard(eventName, handler) {
  return async (...args) => {
    // Cari guild dari berbagai event patterns
    const guild = args[0]?.guild || 
                  args[0]?.member?.guild || 
                  args[0]?.message?.guild || 
                  args[0];
    
    // Jika bukan dari target server, silent return
    if (!isTargetServer(guild)) {
      // Debug mode: Uncomment baris bawah untuk log block
      // console.log(`⛔ Blocked ${eventName} from: ${guild?.name || 'Unknown'} (${guild?.id || 'N/A'})`);
      return;
    }
    
    // Lanjutkan ke handler asli
    return handler(...args);
  };
}

// 📂 Load events (dengan guard)
fs.readdirSync("./events").forEach((file) => {
  const event = require(`./events/${file}`);
  
  if (event.once) {
    // Event once (ready, dll) - tidak perlu guard
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    // Event lainnya - pakai guard
    client.on(event.name, guard(event.name, (...args) => event.execute(...args, client)));
  }
});

// srvName(client); 🔥

// 📌 Message Handler - DENGAN GUARD
client.on("messageCreate", guard("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // ✅ Handler untuk Suggestion System (chat langsung di channel suggestion)
  try {
    await handleSuggestionMessage(message);
  } catch (err) {
    console.error('❌ Suggestion message handler error:', err);
  }

    // ✅ VERIFY INVITE COMMAND - PAKAI INSTANCE DARI READY.JS
    if (message.content.toLowerCase().startsWith("bs!verify invite")) {
        try {
            if (client.verifyInviteSystem) {
                await client.verifyInviteSystem.handleVerifyCommand(message, {
                    VERIFY_CHANNEL_ID: "1487876516971806730",
                    VERIFIED_ROLE_ID: "1444248590305202247"
                });
            } else {
                message.reply("❌ Sistem verify belum siap. Coba lagi nanti!");
            }
        } catch (err) {
            console.error("❌ Verify Invite Error:", err);
            message.reply("❌ Terjadi error saat verify. Coba lagi nanti!");
        }
        return;
    }

    // ✅ BONUS COMMAND
if (message.content.toLowerCase().startsWith("bs!bonus")) {
    try {
        if (client.verifyInviteSystem) {
            const args = message.content.trim().split(/\s+/).slice(1);
            await client.verifyInviteSystem.handleBonusCommand(message, args);
        }
    } catch (err) {
        console.error("❌ Bonus error:", err);
    }
    return;
}
    
  const webCmds = ["helpweb", "registerweb", "createweb", "listweb", "gettoken", "nukeweb", "sendweb", "broadweb", "clearweb"];
  
  if (message.content.startsWith("!")) {
    const cmd = message.content.slice(1).split(" ")[0].toLowerCase();
    
    if (webCmds.includes(cmd)) {
       // return webhookModule.handleCommand(message);🔥
    }
  } // Tutup blok IF Startswith
})); // Tutup event MessageCreate

// 🔄 LOG: Perubahan Role (DENGAN GUARD)
client.on('guildMemberUpdate', guard("guildMemberUpdate", async (oldMember, newMember) => {
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
        /* await logMemberAction(newMember, 'ROLE_UPDATE', { 
            roleChanges: { added, removed }
        });
      */
    }
}));

// 💾 Invite Tracker (Pre-cache semua invite) - DENGAN GUARD
client.on('ready', async () => {
    // Hanya fetch invites dari target server
    const targetGuild = client.guilds.cache.get(TARGET_SERVER_ID);
    if (targetGuild) {
        try {
            const invites = await targetGuild.invites.fetch();
            inviteCache.set(targetGuild.id, invites);
            console.log(`✅ Invite cache ready untuk server: ${targetGuild.name}`);
        } catch (error) {
            console.error(`❌ INVITE TRACKER: Gagal fetch invites.`, error.message);
        }
    } else {
        console.warn(`⚠️ Target server ${TARGET_SERVER_ID} tidak ditemukan di cache!`);
    }
});

client.on('inviteCreate', guard("inviteCreate", invite => {
    const invites = inviteCache.get(invite.guild.id) || new Collection();
    invites.set(invite.code, invite);
}));

client.on('inviteDelete', guard("inviteDelete", invite => {
    const invites = inviteCache.get(invite.guild.id);
    if (invites) invites.delete(invite.code);
}));

// 🚀 Log ketika user join (DENGAN GUARD)
client.on("guildMemberAdd", guard("guildMemberAdd", async (member) => {
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

    // ✅ PAKAI INSTANCE DARI READY.JS
    if (inviteUsed && client.verifyInviteSystem) {
    await client.verifyInviteSystem.trackInvite(member, inviteUsed);
 }

  } catch (error) {
    console.error("❌ INVITE TRACKER: Gagal melacak invite member baru.", error.message);
  }

  // Log event Join nyata ke Forum (otomatis membuat thread)
  const extraData = {
    invite: inviteUsed ? { code: inviteUsed.code, inviter: inviteUsed.inviter } : null
  };
//  await logMemberAction(member, 'JOIN', extraData); 🔥
}));

// 🚪 Log ketika user leave (DENGAN GUARD)
client.on("guildMemberRemove", guard("guildMemberRemove", async (member) => {
    // Hapus dari cache pesan pertama
    firstMessageCache.delete(member.id);
    // Log event Leave nyata ke Forum
//    await logMemberAction(member, 'LEAVE'); 🔥
}));

// ✅ TAMBAHAN: Handler untuk Suggestion & Feedback Buttons + Modal (DENGAN GUARD)
client.on('interactionCreate', guard("interactionCreate", async (interaction) => {
    try {
        // Cek suggestion buttons
        const isSuggestion = await handleSuggestionButtons(interaction);
        if (isSuggestion) return;
        
        // Cek feedback buttons
        const isFeedback = await handleFeedbackButtons(interaction);
        if (isFeedback) return;
        
        // Cek feedback modal
        const isFeedbackModal = await handleFeedbackModal(interaction);
        if (isFeedbackModal) return;
        
    } catch (err) {
        console.error('❌ Feedback/Suggestion interaction error:', err);
    }
}));

// 🧯 Global Error Handler
process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled Error:", err);
});

startSelfPing();

// Monitoring Webhook Baru Otomatis (DENGAN GUARD)
client.on("webhookUpdate", guard("webhookUpdate", async (channel) => {
   /* setTimeout(async () => {
        try {
            const webhooks = await channel.fetchWebhooks();
            const latest = webhooks.first();
            if (latest) await webhookModule.monitorNewWebhook(latest);
        } catch (e) {}
    }, 1500);
  */
}));

// 🔐 Login bot
client.login(config.token);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM');

try {
        if (client.verifyInviteSystem) {
            await client.verifyInviteSystem.close();
        }
    } catch (err) {
        console.error("Error closing MongoDB:", err);
}
    
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
