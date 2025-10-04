const { REST, Routes } = require("discord.js");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { CLIENT_ID, GUILD_ID, TOKEN } = process.env;

if (!CLIENT_ID || !GUILD_ID || !TOKEN) {
  console.error("❌ CLIENT_ID, GUILD_ID, atau TOKEN belum diatur di .env");
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command?.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log(`🚀 Registering ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Slash commands berhasil didaftarkan!");
  } catch (error) {
    console.error("❌ Gagal daftar commands:", error);
  }
})();
