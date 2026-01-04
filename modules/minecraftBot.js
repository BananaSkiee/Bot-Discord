const mineflayer = require('mineflayer');

const nicknames = ['RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy'];
const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🛡️ Menjalankan Mode Anti-Kick...');

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

            // ANTI-IDLE: Gerakan kecil yang tidak memicu anti-cheat
            const startStayActive = () => {
                const stayTask = setInterval(() => {
                    if (!bot.entity) return;
                    
                    // Lompat sekali
                    bot.setControlState('jump', true);
                    setTimeout(() => { if(bot.setControlState) bot.setControlState('jump', false); }, 500);
                    
                    // Menoleh sedikit (Yaw) agar tidak dianggap AFK
                    bot.look(bot.entity.yaw + 0.1, 0);
                }, 15000); // Setiap 15 detik

                bot.once('end', () => clearInterval(stayTask));
            };

            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} Masuk.`);
                setTimeout(startStayActive, 5000);
            });

            // Respawn lebih lambat agar tidak dianggap spam death
            bot.on('death', () => {
                setTimeout(() => { if(bot.respawn) bot.respawn(); }, 20000);
            });

            bot.on('end', () => {
                activeBots.delete(name);
                console.log(`[MC-BOT] 🔌 ${name} Off. Tunggu 2 menit...`);
                setTimeout(() => createSingleBot(name), 120000); 
            });

            bot.on('error', () => {});
        };

        // LOGIN BERTAHAP: Ini WAJIB, jangan barengan!
        nicknames.forEach((name, i) => {
            setTimeout(() => createSingleBot(name), i * 120000);
        });
    }
};
