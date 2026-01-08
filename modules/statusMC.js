const util = require('minecraft-server-util');

const CONFIG = {
    host: 'serverbs.elixir.host',
    port: 37152,
    bedrockHost: 'empirebs.elixirno.de',
    channelId: '1457830508867223626',
    uptimeStart: 1767646200
};

const cooldowns = new Set();
let statusMessage = null;

async function fetchStatus() {
    try {
        const result = await util.status(CONFIG.host, CONFIG.port);
        return {
            online: true,
            motd: result.motd.clean.split('\n')[0] || "Empire BS",
            players: result.players.online,
            maxPlayers: result.players.max,
            playerList: result.players.sample ? result.players.sample.map(p => p.name).join('\n- ') : "None"
        };
    } catch (e) {
        return {
            online: false,
            motd: "Offline",
            players: 0,
            maxPlayers: 0,
            playerList: "None"
        };
    }
}

function getMainPayload(data) {
    return {
        flags: 32768,
        components: [
            {
                type: 17,
                components: [
                    {
                        type: 12,
                        items: [{ media: { url: "https://i.ibb.co.com/cSC5tGzp/Empire-BS-20260108-165301-0000.png" }, spoiler: false }]
                    },
                    { type: 14 },
                    {
                        type: 9,
                        components: [
                            {
                                type: 10,
                                content: `(${data.motd})\n\nStatus: ${data.online ? 'Online 24/7' : 'Offline'}\nHost: \`${CONFIG.host}\`/\`${CONFIG.bedrockHost}\`\nPort: \`${CONFIG.port}\`\nPlayers: ${data.players}/${data.maxPlayers}\nUptime: <t:${CONFIG.uptimeStart}:R>\n`
                            }
                        ],
                        accessory: {
                            type: 11,
                            media: { url: "https://i.ibb.co.com/9mWCFGvx/animated-1.gif" }
                        }
                    },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: 2, type: 2, label: "Refresh", custom_id: "mc_refresh" },
                            { style: 2, type: 2, label: "Players List", custom_id: "mc_players" },
                            { style: 2, type: 2, label: "Version", custom_id: "mc_version" },
                            { style: 2, type: 2, label: "Information", custom_id: "mc_info", disabled: true },
                            { type: 2, style: 5, label: "Vote", url: "https://discohook.app/" }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: "-# © Server Minecraft by BananaSkiee" }
                ]
            }
        ]
    };
}

module.exports = {
    async init(client) {
        const channel = client.channels.cache.get(CONFIG.channelId);
        if (!channel) return console.error("❌ Channel StatusMC tidak ditemukan!");

        const updateStatus = async () => {
            const data = await fetchStatus();
            const payload = getMainPayload(data);

            if (!statusMessage) {
                // Cari pesan bot sebelumnya agar tidak spam jika bot restart
                const messages = await channel.messages.fetch({ limit: 10 });
                statusMessage = messages.find(m => m.author.id === client.user.id);
                
                if (statusMessage) {
                    await statusMessage.edit(payload);
                } else {
                    statusMessage = await channel.send(payload);
                }
            } else {
                await statusMessage.edit(payload).catch(() => statusMessage = null);
            }
        };

        // Jalankan saat bot start & setiap 1 menit
        updateStatus();
        setInterval(updateStatus, 60000);

        // Handler Interaksi Tombol
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.custom_id === 'mc_refresh') {
                if (cooldowns.has(interaction.user.id)) {
                    return interaction.reply({ content: "Tunggu 10 detik sebelum refresh kembali.", ephemeral: true });
                }
                await interaction.deferUpdate();
                const data = await fetchStatus();
                await interaction.editReply(getMainPayload(data));
                
                cooldowns.add(interaction.user.id);
                setTimeout(() => cooldowns.delete(interaction.user.id), 10000);
            }

            if (interaction.custom_id === 'mc_version') {
                await interaction.reply({
                    ephemeral: true,
                    components: [{
                        type: 17,
                        components: [
                            { type: 10, content: `### Version Server\n> **Java & Pojav**\n- IP: \`${CONFIG.host}\`\n- Version: 1.9 - 1.21.1\n\n> **Bedrock (MCPE)**\n- IP: \`${CONFIG.bedrockHost}\`\n- Port: \`${CONFIG.port}\`\n- Version: 1.21.111 - 1.21.130` },
                            { type: 14, divider: true },
                            { type: 10, content: "-# © Server Minecraft by BananaSkiee" }
                        ]
                    }]
                });
            }

            if (interaction.custom_id === 'mc_players') {
                const data = await fetchStatus();
                await interaction.reply({
                    ephemeral: true,
                    components: [{
                        type: 17,
                        components: [
                            { type: 10, content: `## Playera List\n\n>>> - ${data.playerList}` },
                            { type: 14 },
                            { type: 10, content: "© Server Minecraft by BananaSkiee" }
                        ]
                    }]
                });
            }
        });
    }
};
