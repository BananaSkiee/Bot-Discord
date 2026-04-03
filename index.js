// index.js
require("dotenv").config();
require("./modules/globalLogger"); 
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");
const config = require("./config");

const TARGET_SERVER_ID = "1347233781391560837";

const autoGreeting = require("./modules/autoGreeting");
const invitesTracker = require("./modules/invitesTracker");
const { handleIntroInteractions } = require('./modules/introCard');
const { handleInitialRoles, handleVerificationUpdate } = require("./modules/autoBotRole");
const { handleSuggestionMessage, handleSuggestionButtons } = require('./modules/suggestionSystem');
const { handleFeedbackButtons, handleFeedbackModal } = require('./modules/feedbackSystem');
const generator = require('./modules/generator.js');
// const sociabuzz = require('./modules/sociabuzz');

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

const inviteCache = new Collection();
const firstMessageCache = new Collection(); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); 

module.exports = app;

app.get("/", (_, res) => res.send("✅ Bot Akira aktif"));
app.get("/health", (_, res) => res.status(200).json({ status: 'OK' }));

//sociabuzz.initWebhook(client, app);

const server = app.listen(PORT, () => {
  console.log("🌐 Web server pusat hidup di port " + PORT);
});

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

function isTargetServer(guild) {
  if (!guild) return false;
  return guild.id === TARGET_SERVER_ID;
}

function guard(eventName, handler) {
  return async (...args) => {
    const guild = args[0]?.guild || args[0]?.member?.guild || args[0]?.message?.guild || args[0];
    if (!isTargetServer(guild)) return;
    return handler(...args);
  };
}

fs.readdirSync("./events").forEach((file) => {
  const event = require(`./events/${file}`);
  
  if (event.once) {
    if (event.name === "ready" || event.name === "clientReady") {
      client.once("ready", (...args) => event.execute(...args, client, app));
    } else {
      client.once(event.name, (...args) => event.execute(...args, client));
    }
  } else {
    client.on(event.name, guard(event.name, (...args) => event.execute(...args, client)));
  }
});

client.on("messageCreate", guard("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  await generator.execute(message);
  
  try {
    await handleSuggestionMessage(message);
  } catch (err) {
    console.error('❌ Suggestion error:', err);
  }

  // ✅ VERIFY INVITE COMMAND
  if (message.content.toLowerCase() === "bs!verify invite") {
    try {
      if (client.verifyInviteSystem) {
        await client.verifyInviteSystem.handleVerifyCommand(message);
      } else {
        message.reply("❌ Sistem verify belum siap!");
      }
    } catch (err) {
      console.error("❌ Verify error:", err);
      message.reply("❌ Error saat verify!");
    }
    return;
  }

  // ✅ STATS COMMANDS
  if (message.content.toLowerCase().startsWith("bs!invites") || message.content.toLowerCase().startsWith("bs!leaderboard")) {
    try {
      if (client.verifyInviteSystem) {
        const args = message.content.trim().split(/\s+/).slice(1);
        await client.verifyInviteSystem.handleStatsCommand(message, args);
      }
    } catch (err) {
      console.error("❌ Stats error:", err);
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
    if (webCmds.includes(cmd)) {}
  }
}));

client.on('guildMemberUpdate', guard("guildMemberUpdate", async (oldMember, newMember) => {
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
}));

client.on('ready', async () => {
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

client.on("guildMemberAdd", guard("guildMemberAdd", async (member) => {
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
    if (inviteUsed && client.verifyInviteSystem) {
      await client.verifyInviteSystem.trackJoin(member, inviteUsed);
    }
  } catch (error) {
    console.error("❌ INVITE TRACKER:", error.message);
  }
}));

client.on("guildMemberRemove", guard("guildMemberRemove", async (member) => {
  firstMessageCache.delete(member.id);
  if (client.verifyInviteSystem) {
    await client.verifyInviteSystem.trackLeave(member);
  }
}));

client.on('interactionCreate', guard("interactionCreate", async (interaction) => {
    try {
    // 1. Cek apakah ini tombol Like Donasi
if (interaction.isButton() && interaction.customId.startsWith('like_')) {
    const sociabuzz = require('./modules/sociabuzz');
    await sociabuzz.handleLike(interaction);
    return;
}

    // 2. Cek Suggestion
    const isSuggestion = await handleSuggestionButtons(interaction);
    if (isSuggestion) return;

    // 3. Cek Feedback
    const isFeedback = await handleFeedbackButtons(interaction);
    if (isFeedback) return;

    const isFeedbackModal = await handleFeedbackModal(interaction);
    if (isFeedbackModal) return;

  } catch (err) {
    console.error('❌ Interaction error:', err);
    // Anti-crash jika interaksi gagal
    if (!interaction.replied && !interaction.deferred) {
       await interaction.reply({ content: 'Terjadi kesalahan sistem.', flags: 64 }).catch(() => null);
    }
  }
}));
process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled Error:", err);
});

startSelfPing();

client.on("webhookUpdate", guard("webhookUpdate", async (channel) => {}));

client.login(config.token);

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
