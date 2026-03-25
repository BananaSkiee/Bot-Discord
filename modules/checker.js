const { status } = require('node-mcstatus');
const { EmbedBuilder } = require('discord.js');

// Konfigurasi
const IP = 'eclcommunity.aternos.me';
const PORT = 14436;
const CHANNEL_ID = '1352800131933802547';
const ROLE_ID = '1031007901302657157';

let isOnline = false; // Status terakhir

module.exports = (client) => {
    setInterval(async () => {
        try {
            const result = await status(IP, PORT);
            
            // Jika server baru saja online (sebelumnya offline)
            if (result.online && !isOnline) {
                isOnline = true;
                const channel = client.channels.cache.get(CHANNEL_ID);
                
                if (channel) {
                    await channel.send({
                        flags: 32768,
                        components: [
                            {
                                type: 17,
                                components: [
                                    { type: 10, content: "## 🟢 Server Online " },
                                    { type: 14 },
                                    { type: 10, content: `Hey <@${ROLE_ID}>, Server ecl Online Buruan Join\n` },
                                    { type: 14 },
                                    { type: 10, content: "-# Detect The Server Online - By Zyoxc." }
                                ]
                            }
                        ]
                    });
                }
            } 
            
            // Reset status jika server mati
            if (!result.online) {
                isOnline = false;
            }
        } catch (error) {
            console.error('Error checking Minecraft status:', error);
        }
    }, 30000); // Cek setiap 30 detik
};
