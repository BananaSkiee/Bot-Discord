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

// 🔄 Self-ping system untuk menjaga Koyeb tetap aktif
function startSelfPing() {
  const SELF_PING_URL = `https://${process.env.KOYEB_APP_NAME || 'parallel-helaine-bananaskiee-701c062c'}.koyeb.app/health`;
  const PING_INTERVAL = 3 * 60 * 1000; // 3 menit
  
  console.log(`🔄 Starting self-ping system to: ${SELF_PING_URL}`);
  
  setInterval(async () => {
    try {
      const response = await fetch(SELF_PING_URL);
      if (response.ok) {
        console.log('✅ Self-ping successful -', new Date().toLocaleTimeString());
      } else {
        console.log('⚠️ Self-ping returned status:', response.status);
      }
    } catch (error) {
      console.log('❌ Self-ping failed:', error.message);
    }
  }, PING_INTERVAL);
  
  // Ping immediately on startup
  setTimeout(() => {
    fetch(`https://${process.env.KOYEB_APP_NAME || 'parallel-helaine-bananaskiee-701c062c'}.koyeb.app/`)
      .then(() => console.log('✅ Initial ping successful'))
      .catch(err => console.log('❌ Initial ping failed:', err.message));
  }, 5000);
}

// 📂 Load events dari folder /events
fs.readdirSync("./events").forEach((file) => {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
});

srvName(client);

// 🟩 Slash Commands + 🟦 Button Handler
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction, client);
  } catch (error) {
    console.error("❌ Interaction Error:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Terjadi error saat menjalankan perintah.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ Terjadi error saat menjalankan perintah.",
        ephemeral: true,
      });
    }
  }
});

// 📌 Sticky Message Handler
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  await slashCommandSetup(client);
  stickyHandler(client, message);
  invitesTracker(client);
});

// 🚀 Auto Greeting ketika user join
client.on("guildMemberAdd", async (member) => {
  // 1. Jalankan greeting tambahan (opsional)
  autoGreeting(client, member);
});

// 🔁 Update jumlah user online di VC
client.on("presenceUpdate", () => updateOnline(client));
client.on("voiceStateUpdate", () => updateOnline(client));

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
  startSelfPing(); // Start self-ping setelah bot ready
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
