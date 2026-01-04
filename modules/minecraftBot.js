// modules/minecraftBot.js
const mineflayer = require('mineflayer');

const nicknames = ['RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy'];
const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🛡️ MEMULAI MODE PATROLI: Bot Tidak Akan Keluar!');

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

            // --- LOGIKA PATROLI (BERJALAN BOLAK-BALIK) ---
            const startPatrol = () => {
                const patrolTask = setInterval(() => {
                    if (!bot.entity) return;

                    // 1. Maju selama 3 detik
                    bot.setControlState('forward', true);
                    setTimeout(() => {
                        if (bot.setControlState) {
                            bot.setControlState('forward', false);
                            
                            // 2. Putar balik (180 derajat)
                            const currentYaw = bot.entity.yaw;
                            bot.look(currentYaw + Math.PI, 0);

                            // 3. Mundur/Maju lagi ke posisi awal selama 3 detik
                            setTimeout(() => {
                                if (bot.setControlState) {
                                    bot.setControlState('forward', true);
                                    setTimeout(() => {
                                        if (bot.setControlState) bot.setControlState('forward', false);
                                    }, 3000);
                                }
                            }, 500);
                        }
                    }, 3000);

                    // 4. Melompat agar lebih meyakinkan
                    bot.setControlState('jump', true);
                    setTimeout(() => { if(bot.setControlState) bot.setControlState('jump', false); }, 500);

                }, 45000); // Ulangi setiap 45 detik agar timer AFK reset terus

                bot.once('end', () => clearInterval(patrolTask));
            };

            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} Sudah Online dan Mulai Patroli.`);
                setTimeout(startPatrol, 10000);
            });

            bot.on('death', () => {
                setTimeout(() => { if(bot.respawn) bot.respawn(); }, 20000);
            });

            bot.on('end', (reason) => {
                activeBots.delete(name);
                console.log(`[MC-BOT] 🔌 ${name} Terputus: ${reason}. Masuk lagi dalam 120 detik...`);
                setTimeout(() => createSingleBot(name), 120000); 
            });

            bot.on('error', () => {});
        };

        // LOGIN BERTAHAP (Kunci agar tidak di-limit IP)
        nicknames.forEach((name, i) => {
            setTimeout(() => createSingleBot(name), i * 120000);
        });
    }
};
                                
