const mineflayer = require('mineflayer');

// Kita fokus ke 3 Nickname pertama saja supaya stabil
const nicknames = ['RianGamerz', 'DikaAja', 'FahriPro'];
const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🛡️ Menjalankan 3 Bot Stabil - Mode Anti-Idle Aktif');

        const createSingleBot = (name) => {
            if (activeBots.has(name) || activeBots.size >= 3) return;

            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: name,
                version: '1.21.1',
                auth: 'offline',
                checkTimeoutInterval: 120000,
                disableChatSigning: true,
                hideErrors: true
            });

            // --- LOGIKA UTAMA: BERJALAN SEDIKIT UNTUK RESET AFK ---
            const startLiving = () => {
                const stayTask = setInterval(() => {
                    if (!bot.entity) return;

                    // Bot berjalan maju selama 1 detik saja (pindah blok)
                    bot.setControlState('forward', true);
                    
                    setTimeout(() => {
                        if (bot.setControlState) {
                            bot.setControlState('forward', false);
                            // Melompat tipis setelah jalan
                            bot.setControlState('jump', true);
                            setTimeout(() => bot.setControlState('jump', false), 500);
                        }
                    }, 1000); // Jalan 1 detik

                    // Menoleh secara acak
                    const yaw = (Math.random() - 0.5) * 2 * Math.PI;
                    bot.look(yaw, 0);

                }, 30000); // Ulangi setiap 30 detik agar server tidak kick

                bot.once('end', () => clearInterval(stayTask));
            };

            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} Masuk dan Stay.`);
                setTimeout(startLiving, 5000);
            });

            bot.on('death', () => {
                // Beri jeda lama sebelum respawn agar tidak dideteksi spam
                setTimeout(() => { if(bot.respawn) bot.respawn(); }, 20000);
            });

            bot.on('end', () => {
                activeBots.delete(name);
                console.log(`[MC-BOT] 🔌 ${name} Terputus. Menunggu 3 Menit...`);
                // Jeda reconnect diperlama (3 menit) supaya IP dingin dulu
                setTimeout(() => createSingleBot(name), 180000); 
            });

            bot.on('error', (err) => {});
        };

        // LOGIN BERTAHAP (Jeda 3 Menit antar bot)
        // Ini kunci agar server menganggap pemain masuk satu per satu secara normal
        nicknames.forEach((name, i) => {
            setTimeout(() => createSingleBot(name), i * 180000);
        });
    }
};
