const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  client.commands = new Map();

  const commands = [];
  const commandsPath = path.join(__dirname, "../commands");
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`${commandsPath}/${file}`);
    if (command?.data && command?.execute) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    }
  }

  try {
    // ✅ Versi untuk DEVELOPMENT (per guild)
    const guild = client.guilds.cache.first();
    if (guild) {
      await guild.commands.set(commands);
      console.log(`✅ Slash command berhasil didaftarkan di guild "${guild.name}" (${guild.id})`);
    } else {
      console.warn("⚠️ Tidak ada guild terdeteksi untuk register command.");
    }

    // ✅ Jika kamu ingin GLOBAL:
    // await client.application.commands.set(commands);
    // console.log(`🌐 Slash command global berhasil didaftarkan.`);
    
  } catch (error) {
    console.error("❌ Gagal mendaftarkan slash command:", error);
  }
};
