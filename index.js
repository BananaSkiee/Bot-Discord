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

// 🌐 Web server (Railway)
const app = express();
app.get("/", (_, res) => res.send("✅ Bot Akira aktif"));
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web server hidup di port 3000");
});

// 📂 Load events dari folder /events
fs.readdirSync("./events").forEach((file) => {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
});

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
  stickyHandler(client, message);
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

// 🔐 Login bot
client.login(config.token);
