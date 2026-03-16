// index.js
require("dotenv").config();
require("./modules/globalLogger"); 
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");
const config = require("./config");

// 🧠 Custom modules & data log
const autoGreeting = require("./modules/autoGreeting");
const invitesTracker = require("./modules/invitesTracker");
const { handleIntroInteractions } = require('./modules/introCard');
const { handleInitialRoles, handleVerificationUpdate } = require("./modules/autoBotRole");

// ✅ TAMBAHAN: Import Suggestion & Feedback Systems
const { handleSuggestionMessage, handleSuggestionButtons } = require('./modules/suggestionSystem');
const { 
    sendFeedbackPrompt, 
    handleFeedbackButtons, 
    handleFeedbackModal,
    handleFeedbackView 
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
  const PING_INTERVAL = 5 * 60 * 1000;
  
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

// 📌 Message Handler - ✅ TAMBAHAN: Suggestion handler
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // ✅ Handler untuk Suggestion System
  try {
    await handleSuggestionMessage(message);
  } catch (err) {
    console.error('❌ Suggestion message handler error:', err);
  }

  const webCmds = ["helpweb", "registerweb", "createweb", "listweb", "gettoken", "nukeweb", "sendweb", "broadweb", "clearweb"];
  
  if (message.content.startsWith("!")) {
    const cmd = message.content.slice(1).split(" ")[0].toLowerCase();
    
    if (webCmds.includes(cmd)) {
       // return webhookModule.handleCommand(message);🔥
    }
  }
});

// 🔄 LOG: Perubahan Role
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    await handleVerificationUpdate(oldMember, newMember);

    if (oldRoles.size === newRoles.size) return;

    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
        const added = addedRoles.map(r => r.toString());
        const removed = removedRoles.map(r => r.toString());
        console.log(`✅ LOG ROLE: ${newMember.user.tag} - Ditambah: ${added.join(', ')} | Dicabut: ${removed.join(', ')}`);
    }
});

// 💾 Invite Tracker
client.on('ready', async () => {
    client.guilds.cache.forEach(async guild => {
        try {
            const invites = await guild.invites.fetch();
            inviteCache.set(guild.id, invites);
        } catch (error) {
            console.error(`❌ INVITE TRACKER: Gagal fetch invites untuk guild ${guild.id}.`, error.message);
        }
    });
    
    // ✅ TAMBAHAN: Kirim Feedback Prompt setelah ready (dengan delay)
    setTimeout(async () => {
        await sendFeedbackPrompt(client);
    }, 5000);
});

client.on('inviteCreate', invite => {
    const invites = inviteCache.get(invite.guild.id) || new Collection();
    invites.set(invite.code, invite);
});

client.on('inviteDelete', invite => {
    const invites = inviteCache.get(invite.guild.id);
    if (invites) invites.delete(invite.code);
});

// 🚀 Log ketika user join
client.on("guildMemberAdd", async (member) => {
  autoGreeting(client, member);
  await handleInitialRoles(member);
  
  let inviteUsed = null;

  try {
    const currentInvites = await member.guild.invites.fetch();
    const oldInvites = inviteCache.get(member.guild.id);

    if (oldInvites) {
        inviteUsed = currentInvites.find(i => oldInvites.get(i.code) && oldInvites.get(i.code).uses < i.uses);
    }
    
    inviteCache.set(member.guild.id, currentInvites);

  } catch (error) {
    console.error("❌ INVITE TRACKER: Gagal melacak invite member baru.", error.message);
  }
});

// 🚪 Log ketika user leave
client.on("guildMemberRemove", async (member) => {
    firstMessageCache.delete(member.id);
});

// ✅ TAMBAHAN: Handler untuk Suggestion & Feedback Buttons + Modal
client.on('interactionCreate', async (interaction) => {
    try {
        // Cek suggestion buttons
        const isSuggestion = await handleSuggestionButtons(interaction);
        if (isSuggestion) return;
        
        // Cek feedback buttons
        const isFeedback = await handleFeedbackButtons(interaction);
        if (isFeedback) return;
        
        // Cek feedback view buttons
        const isFeedbackView = await handleFeedbackView(interaction);
        if (isFeedbackView) return;
        
        // Cek feedback modal
        const isFeedbackModal = await handleFeedbackModal(interaction);
        if (isFeedbackModal) return;
        
    } catch (err) {
        console.error('❌ Feedback/Suggestion interaction error:', err);
    }
});

// 🧯 Global Error Handler
process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled Error:", err);
});

startSelfPing();

// 🔐 Login bot
client.login(config.token);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM');
  
  try {
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
