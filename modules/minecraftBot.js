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
                console.log(`[MC-SUCCESS] ✅ ${username} masuk ke server.`);
                
                // Login awal tetap butuh jeda singkat biar gak error (5 detik)
                setTimeout(() => {
                    bot.chat(`/register ${passwordBot} ${passwordBot}`);
                    bot.chat(`/login ${passwordBot}`);
                }, 5000);

                // Spam command /server survival setiap 2 menit
                if (target === 'survival' && !spamInterval) {
                    spamInterval = setInterval(() => {
                        if (bot && bot.entity) {
                            bot.chat('/server survival');
                            console.log(`[MC-SPAM] ${username} mengirim /server survival (Interval 2 menit)`);
                        }
                    }, 120000); // 2 Menit
                }
            });

            bot.on('end', (reason) => {
                console.log(`[MC-RETRY] 🔌 ${username} terputus: ${reason}.`);
                
                // Bersihkan interval biar gak numpuk di RAM
                if (spamInterval) {
                    clearInterval(spamInterval);
                    spamInterval = null;
                }

                // Jeda 1 menit sebelum paksa masuk lagi (biar gak dianggap spam attack)
                console.log(`[MC-WAIT] ${username} menunggu 1 menit sebelum mencoba masuk lagi...`);
                setTimeout(() => createMcBot(username, target), 60000); // 1 Menit
            });

            bot.on('error', (err) => {
                console.log(`[MC-ERR] ${username} Error: ${err.message}`);
            });
        };

        // Delay awal saat bot pertama kali jalan (1 menit)
        setTimeout(() => {
            createMcBot('LobbyBS', 'lobby');
            
            // Jeda 2 menit sebelum bot kedua masuk
            setTimeout(() => {
                createMcBot('SurvivalBS', 'survival');
            }, 120000); 

        }, 60000);
    }
};
