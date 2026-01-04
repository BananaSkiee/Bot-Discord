// modules/minecraftBot.js
const mineflayer = require('mineflayer');

const nicknames = ['RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy'];
const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🏃 Anti-Idle Walking Mode Aktif...');

        const createSingleBot = (name) => {
            if (activeBots.has(name)) return;

            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: name,
                version: '1.21.1',
                auth: 'offline',
                checkTimeoutInterval: 120000,
                disableChatSigning: true
            });

            // --- LOGIKA BERJALAN AGAR TIDAK DI-KICK ---
            const startWalkingAI = () => {
                const moveTask = setInterval(() => {
                    if (!bot.entity) return;

                    // Bot berjalan maju selama 2 detik
                    bot.setControlState('forward', true);
                    
                    setTimeout(() => {
                        if (bot.setControlState) {
                            bot.setControlState('forward', false);
                            // Setelah maju, bot melompat sekali
                            bot.setControlState('jump', true);
                            setTimeout(() => bot.setControlState('jump', false), 500);
                        }
                    }, 2000);

                    // Menoleh secara acak agar lebih natural
                    const yaw = Math.random() * Math.PI * 2;
                    bot.look(yaw, 0);

                }, 40000); // Dilakukan setiap 40 detik (sebelum kena kick idle)

                bot.once('end', () => clearInterval(moveTask));
            };

            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} Online.`);
                setTimeout(startWalkingAI, 5000);
            });

            bot.on('death', () => {
                setTimeout(() => { if(bot.respawn) bot.respawn(); }, 20000);
            });

            bot.on('end', () => {
                activeBots.delete(name);
                console.log(`[MC-BOT] 🔌 ${name} Off. Reconnecting...`);
                setTimeout(() => createSingleBot(name), 120000); 
            });

            bot.on('error', () => {});
        };

        // LOGIN BERTAHAP (120 Detik antar bot)
        nicknames.forEach((name, i) => {
            setTimeout(() => createSingleBot(name), i * 120000);
        });
    }
};
