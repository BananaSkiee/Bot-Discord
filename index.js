require("dotenv").config();
require("./modules/globalLogger"); 
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");
const config = require("./config");

// 🧠 Custom modules
const stickyHandler = require("./sticky");
const autoGreeting = require("./modules/autoGreeting");
const updateTimeChannel = require("./modules/updateTimeChannel");
const welcomecard = require("./modules/welcomeCard");
const invitesTracker = require("./modules/invitesTracker");
const srvName = require("./modules/srvName.js"); 
const { startAutoAnimation } = require("./modules/iconAnim");
const { updateMemberLog } = require("./modules/memberLogForum"); // <-- BARIS DIPERBARUI
const { createPOVEmbed } = require("./modules/storyPOV"); // <-- BARIS BARU: Import logika POV

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

require('./modules/rateLimiter')(client);     // log semua rate limit
require('./modules/autoSafeRename')(client);  // lindungi rename otomatis

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

// 📌 Sticky Message Handler & Custom Commands
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  
  stickyHandler(client, message);
  invitesTracker(client);
  
  const member = message.member;
  const content = message.content.toLowerCase();
  
  // --- COMMAND LOGGING & POV ---
  if (content === "!1" || content === "!2" || content === "!3") {
      const isOwnerOrAdmin = member?.permissions.has("ADMINISTRATOR") || member?.guild.ownerId === member.id;
      
      if (!isOwnerOrAdmin) {
          return message.reply({ content: "❌ Perintah ini hanya bisa digunakan oleh Administrator/Owner.", ephemeral: true });
      }
      
      // 1. Kirim balasan ke channel chat (untuk POV interaktif)
      const povEmbed = createPOVEmbed(content.substring(1));
      await message.channel.send({ 
          content: `**${member.user.tag}** memicu perubahan POV: \`${content}\``,
          embeds: [povEmbed] 
      }).catch(err => console.error("❌ Gagal mengirim pesan POV:", err.message));
      
      // 2. Catat aksi di Forum Log Persisten
      await updateMemberLog(client, member, 'POV', content);

      // 3. Hapus pesan perintah
      if (message.deletable) await message.delete().catch(err => console.error("❌ Gagal delete pesan perintah:", err));
      return;
  }
});

// 🚀 Auto Greeting ketika user join
client.on("guildMemberAdd", async (member) => {
  autoGreeting(client, member);
  // Panggil fungsi log member join ke Forum
  updateMemberLog(client, member, 'JOIN'); 
});

// 🚪 Log ketika user leave
client.on("guildMemberRemove", async (member) => {
    // Panggil fungsi log member leave ke Forum
    updateMemberLog(client, member, 'LEAVE'); 
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
  startSelfPing(); // Start self-ping setelah bot ready

  // 🔄 Jalankan sistem penghitung online setelah bot login
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
