// modules/minecraftBot.js
const mineflayer = require('mineflayer');

module.exports = {
    init: (client) => {
        // IP Proxy Utama (MagmaNode)
        const host = 'legacybs.funserver.top';
        const proxyPort = 33096;
        const passwordBot = 'BananaSkiee';

        const createMcBot = (username, target) => {
            // Log awal saat mulai
            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ${username}...`);

            const bot = mineflayer.createBot({
                host: host,
                port: proxyPort,
                username: username,
                version: '1.20.1',
                auth: 'offline'
            });

            let spamInterval = null;

            bot.on('spawn', () => {
                // Log sukses join saja
                console.log(`[MC-SUCCESS] ✅ ${username} Berhasil Join!`);
                
                setTimeout(() => {
                    bot.chat(`/register ${passwordBot} ${passwordBot}`);
                    bot.chat(`/login ${passwordBot}`);

                    // Logic pindah server untuk Survival & Creative
                    if ((target === 'survival' || target === 'creative') && !spamInterval) {
                        setTimeout(() => {
                            bot.chat(`/server ${target}`);
                        }, 15000); // Jeda 15 detik setelah login baru pindah

                        // Spam setiap 5 menit (300.000 ms) - Tanpa log di console
                        spamInterval = setInterval(() => {
                            if (bot && bot.entity) {
                                bot.chat(`/server ${target}`);
                            }
                        }, 300000); 
                    }
                }, 5000);
            });

            bot.on('end', (reason) => {
                console.log(`[MC-RETRY] 🔌 ${username} Terputus. Mencoba lagi dalam 1 menit...`);
                if (spamInterval) {
                    clearInterval(spamInterval);
                    spamInterval = null;
                }
                setTimeout(() => createMcBot(username, target), 60000);
            });

            // Error tetap ditampilkan sedikit buat jaga-jaga kalau IP mati
            bot.on('error', (err) => {
                if (!err.message.includes('ECONNREFUSED')) {
                    console.log(`[MC-ERR] ${username}: Error terdeteksi.`);
                }
            });
        };

        // Urutan Login Bot (Bertahap agar RAM Koyeb stabil)
        
        // 1. Bot Lobby (Muncul setelah 1 Menit)
        setTimeout(() => {
            createMcBot('LobbyBS', 'lobby');
            
            // 2. Bot Survival (Muncul 2 Menit setelah Lobby)
            setTimeout(() => {
                createMcBot('SurvivalBS', 'survival');
                
                // 3. Bot Creative (Muncul 2 Menit setelah Survival)
                setTimeout(() => {
                    createMcBot('CreativeBS', 'creative');
                }, 120000);

            }, 120000); 

        }, 60000);
    }
};
