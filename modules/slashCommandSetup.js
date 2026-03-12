//  modules/slashCommandSetup.js
const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
    client.commands = client.commands || new Map();
    const commands = [];
    const commandsPath = path.join(__dirname, "../commands");
    
    if (!fs.existsSync(commandsPath)) return console.error("❌ Folder commands tidak ditemukan!");

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        try {
            const command = require(`${commandsPath}/${file}`);
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
            }
        } catch (err) {
            console.error(`❌ Gagal load command ${file}:`, err);
        }
    }

    try {
        const guildId = process.env.GUILD_ID || "1347233781391560837";
        const guild = await client.guilds.fetch(guildId);
        if (guild) {
            await guild.commands.set(commands);
            console.log(`✅ Berhasil mendaftarkan ${commands.length} slash commands di ${guild.name}`);
        }
    } catch (error) {
        console.error("❌ Gagal mendaftarkan slash command:", error);
    }
};
