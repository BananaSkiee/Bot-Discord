//modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botLobby = null;
let botSurvival = null;

module.exports = {
    init: (client) => {
        const host = 'dynamic-8.magmanode.com';
        const proxyPort = 25643; // Port Proxy Velocity
        const passwordBot = 'BananaSkiee';

        const createMcBot = (username, target) => {
            console.log(`[MC-SYSTEM] 🔄 Bot ${username} sedang menuju Proxy...`);

            const bot = mineflayer.createBot({
                host: host,
                port: proxyPort,
                username: username,
                version: '1.21.8', // Sesuaikan dengan versi Paper kamu
                auth: 'offline',
                keepAlive: true
            });

            bot.on('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ ${username} berhasil mendarat di Lobby!`);
                
                // Proses Login & Perpindahan Server
                setTimeout(() => {
                    if (bot) {
                        bot.chat(`/register ${passwordBot} ${passwordBot}`);
                        bot.chat(`/login ${passwordBot}`);
                        
                        // Jika ini bot khusus survival, dia akan pindah server
                        if (target === 'survival') {
                            setTimeout(() => {
                                bot.chat('/server survival');
                                console.log(`[MC-INFO] ${username} sedang berpindah ke server Survival...`);
                            }, 3000);
                        }
                    }
                }, 5000);
            });

            // Anti-AFK agar tidak kena kick oleh sistem internal Minecraft
            setInterval(() => {
                if (bot && bot.entity) {
                    bot.swingArm('right');
                }
            }, 20000);

            bot.on('end', (reason) => {
                console.log(`[MC-RETRY] ${username} terputus: ${reason}. Login ulang dalam 30 detik...`);
                setTimeout(() => createMcBot(username, target), 30000);
            });

            bot.on('error', (err) => console.log(`[MC-ERR] ${username} Error: ${err.message}`));

            return bot;
        };

        // Menjalankan 2 Bot: Satu stay di Lobby, satu pergi ke Survival
        setTimeout(() => {
            botLobby = createMcBot('LobbyBS', 'lobby');
            botSurvival = createMcBot('SurvivalBS', 'survival');
        }, 10000);
    }
};
