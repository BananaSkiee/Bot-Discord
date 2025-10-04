// modules/slashCommandSetup.js
const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  client.commands = new Map();

  const commands = [];
  const commandsPath = path.join(__dirname, "../commands");
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    try {
      const command = require(`${commandsPath}/${file}`);
      if (command?.data && command?.execute) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      } else {
        console.warn(`⚠️ Command "${file}" tidak punya data atau execute function.`);
      }
    } catch (err) {
      console.error(`❌ Gagal load command "${file}":`, err);
    }
  }

  try {
    const guildId = process.env.GUILD_ID || "1347233781391560837"; // fallback ID
    const guild = await client.guilds.fetch(guildId);

    if (guild) {
      await guild.commands.set(commands);
      console.log(`✅ ${commands.length} slash command terdaftar di guild "${guild.name}" (${guild.id})`);
    } else {
      console.warn("⚠️ Guild tidak ditemukan.");
    }

    // 🌐 Untuk global commands:
    // await client.application.commands.set(commands);

  } catch (error) {
    console.error("❌ Gagal mendaftarkan slash command:", error);
  }
};
