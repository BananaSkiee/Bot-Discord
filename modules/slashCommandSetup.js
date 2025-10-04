const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  // Tunggu sampai client ready dan punya token
  if (!client.isReady()) {
    console.log("⏳ Menunggu client ready untuk slash command...");
    return;
  }

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
    // 🔧 Gunakan GUILD ID biar pasti
    const guild = await client.guilds.fetch("1347233781391560837").catch(console.error);
    if (guild) {
      await guild.commands.set(commands);
      console.log(`✅ Slash command berhasil didaftarkan di guild "${guild.name}" (${guild.id})`);
    } else {
      console.error("❌ Gagal fetch guild untuk slash command");
    }

  } catch (error) {
    console.error("❌ Gagal mendaftarkan slash command:", error.message);
  }
};
