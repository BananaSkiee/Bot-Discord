// modules/minecraftBot.js
const mineflayer = require('mineflayer');

module.exports = {
    init: (client) => {
        const host = 'dynamic-9.magmanode.com';
        const proxyPort = 25952;
        const passwordBot = 'BananaSkiee';

        const createMcBot = (username, target) => {
            console.log(`[MC-SYSTEM] 🔄 Bot ${username} memulai koneksi...`);

            const bot = mineflayer.createBot({
                host: host,
                port: proxyPort,
                username: username,
                version: '1.20.1',
                auth: 'offline'
            });

            let spamInterval = null;

            bot.on('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ ${username} mendarat di Proxy.`);
                
                // 1. Login (Kasih jeda 5 detik setelah spawn)
                setTimeout(() => {
                    bot.chat(`/register ${passwordBot} ${passwordBot}`);
                    bot.chat(`/login ${passwordBot}`);
                    console.log(`[MC-AUTH] ${username} mencoba login...`);

                    // 2. Khusus bot survival, kasih jeda LAGI (10 detik) setelah login baru pindah server
                    if (target === 'survival' && !spamInterval) {
                        setTimeout(() => {
                            console.log(`[MC-MOVE] ${username} pindah ke Survival...`);
                            bot.chat('/server survival');
                        }, 10000); // Jeda biar gak kena 'void future'

                        // 3. Spam command setiap 2 menit (tetap jalan)
                        spamInterval = setInterval(() => {
                            if (bot && bot.entity) {
                                bot.chat('/server survival');
                                console.log(`[MC-SPAM] ${username} memastikan masih di Survival.`);
                            }
                        }, 120000);
                    }
                }, 5000);
            });

            bot.on('end', (reason) => {
                console.log(`[MC-RETRY] 🔌 ${username} terputus: ${reason}.`);
                if (spamInterval) {
                    clearInterval(spamInterval);
                    spamInterval = null;
                }
                // Cooldown 1 menit biar RAM Koyeb aman & gak kena temp-ban IP
                setTimeout(() => createMcBot(username, target), 60000);
            });

            bot.on('error', (err) => {
                console.log(`[MC-ERR] ${username} Error: ${err.message}`);
            });
        };

        // Mulai bot Lobby (Setelah 1 menit)
        setTimeout(() => {
            createMcBot('LobbyBS', 'lobby');
            
            // Bot Survival masuk 2 menit kemudian
            setTimeout(() => {
                createMcBot('SurvivalBS', 'survival');
            }, 120000); 

        }, 60000);
    }
};
