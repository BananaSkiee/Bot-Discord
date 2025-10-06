require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");
const config = require("./config");

// 🧠 Custom modules
const stickyHandler = require("./sticky");
const updateOnline = require("./online");
const autoGreeting = require("./modules/autoGreeting");
const updateTimeChannel = require("./modules/updateTimeChannel");
const generateTextGraph = require('./modules/generateTextGraph');
const startCryptoSimulation = require("./modules/cryptoSimulator");
const welcomecard = require("./modules/welcomeCard");
const invitesTracker = require("./modules/invitesTracker");
const slashCommandSetup = require("./modules/slashCommandSetup");
const srvName = require("./modules/srvName.js"); 

// 🎮 Minecraft Module - SIMPLE
const { initMinecraft } = require("./modules/minecraft");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

require("./modules/slashCommandSetup")(client);
client.commands = new Collection();

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

// 🎮 Minecraft Config - SIMPLE
const minecraftConfig = {
  host: process.env.MINECRAFT_HOST || 'localhost',
  port: parseInt(process.env.MINECRAFT_PORT) || 25565,
  username: process.env.MINECRAFT_USERNAME || 'DiscordBot',
  password: process.env.MINECRAFT_PASSWORD || '',
  version: process.env.MINECRAFT_VERSION || '1.20.1',
  auth: process.env.MINECRAFT_AUTH || 'mojang'
};

let minecraftManager;

// 🔄 Self-ping system
function startSelfPing() {
  const SELF_PING_URL = `https://${process.env.KOYEB_APP_NAME || 'parallel-helaine-bananaskiee-701c062c'}.koyeb.app/health`;
  const PING_INTERVAL = 3 * 60 * 1000;
  
  console.log(`🔄 Starting self-ping system to: ${SELF_PING_URL}`);
  
  setInterval(async () => {
    try {
      const response = await fetch(SELF_PING_URL);
      if (response.ok) {
        console.log('✅ Self-ping successful');
      }
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

// 🟩 Slash Commands
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction, client);
  } catch (error) {
    console.error("❌ Interaction Error:", error);
  }
});

// 📌 Sticky Message Handler
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  await slashCommandSetup(client);
  stickyHandler(client, message);
  invitesTracker(client);
});

// 🚀 Auto Greeting
client.on("guildMemberAdd", async (member) => {
  autoGreeting(client, member);
});

// 🔁 Update jumlah online
client.on("presenceUpdate", () => {
  const guild = client.guilds.cache.first();
  if (guild) updateOnline(guild);
});
client.on("voiceStateUpdate", () => {
  const guild = client.guilds.cache.first();
  if (guild) updateOnline(guild);
});

// ⏱ Update waktu di voice channel
setInterval(() => {
  updateTimeChannel(client);
}, 30 * 1000);

// 🧯 Global Error Handler
process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled Error:", err);
});

// 🚀 Start bot
client.once("ready", () => {
  console.log(`✅ ${client.user.tag} is now online!`);
  startSelfPing();
  
  // 🎮 Start Minecraft bot - SIMPLE
  if (process.env.ENABLE_MINECRAFT === 'true') {
    console.log('🎮 Starting Minecraft bot...');
    minecraftManager = initMinecraft(client, minecraftConfig);
  }
});

// 🔐 Login bot
client.login(config.token);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down...');
  if (minecraftManager) {
    minecraftManager.disconnect();
  }
  client.destroy();
  server.close(() => {
    process.exit(0);
  });
});
