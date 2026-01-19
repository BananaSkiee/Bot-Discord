// modules/minecraftBot.js
const mineflayer = require('mineflayer');

module.exports = {
    init: (client) => {
        const host = 'dynamic-9.magmanode.com';
        const proxyPort = 25952;
        const passwordBot = 'BananaSkiee';

        const createMcBot = (username, target) => {
            console.log(`[MC-SYSTEM] 🔄 Bot ${username} masuk via Bungeecord...`);

            const bot = mineflayer.createBot({
                host: host,
                port: proxyPort,
                username: username,
                version: '1.20.1', // Bungeecord lebih stabil pake versi spesifik
                auth: 'offline'
            });

            bot.on('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ ${username} mendarat di Bungee!`);
                setTimeout(() => {
                    bot.chat(`/register ${passwordBot} ${passwordBot}`);
                    bot.chat(`/login ${passwordBot}`);
                    
                    if (target === 'survival') {
                        // Kasih jeda lebih lama (8 detik) biar Bungee gak bingung
                        setTimeout(() => {
                            bot.chat('/server survival');
                            console.log(`[MC-INFO] ${username} pindah ke Survival.`);
                        }, 8000);
                    }
                }, 5000);
            });

            bot.on('end', (reason) => {
                console.log(`[MC-RETRY] ${username} exit: ${reason}. Reconnect 30s...`);
                setTimeout(() => createMcBot(username, target), 30000);
            });

            bot.on('error', (err) => console.log(`[MC-ERR] ${username}: ${err.message}`));
        };

        // START BOT BERTAHAP
        setTimeout(() => {
            createMcBot('LobbyBS', 'lobby');
            
            // Bot survival masuk 20 detik kemudian
            setTimeout(() => {
                createMcBot('SurvivalBS', 'survival');
            }, 20000);
        }, 10000);
    }
};
