const mineflayer = require('mineflayer');

// Kita fokus ke 3 bot saja agar IP kamu tidak diblokir permanen oleh server
const nicknames = ['RianGamerz', 'DikaAja', 'FahriPro'];
const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🛡️ Menjalankan Solusi Anti-Kick: Mode Stay-Online Aktif');

        const createSingleBot = (name) => {
            if (activeBots.has(name) || activeBots.size >= 3) return;

            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: name,
                version: '1.21.1',
                auth: 'offline',
                checkTimeoutInterval: 60000,
                disableChatSigning: true
            });

            // LOGIKA AGAR TIDAK DIANGGAP AFK (BERJALAN MONDAR-MANDIR)
            const startAntiAFK = () => {
                const afkTask = setInterval(() => {
                    if (!bot.entity) return;

                    // Langkah 1: Jalan maju sebentar
                    bot.setControlState('forward', true);
                    
                    setTimeout(() => {
                        if (bot.setControlState) {
                            bot.setControlState('forward', false);
                            
                            // Langkah 2: Mundur ke posisi semula
                            bot.setControlState('back', true);
                            setTimeout(() => {
                                if (bot.setControlState) bot.setControlState('back', false);
                            }, 1000);
                        }
                    }, 1000);

                }, 40000); // Ulangi setiap 40 detik

                bot.once('end', () => clearInterval(afkTask));
            };

            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} Join dan Stay.`);
                setTimeout(startAntiAFK, 5000);
            });

            bot.on('death', () => {
                setTimeout(() => { if(bot.respawn) bot.respawn(); }, 15000);
            });

            bot.on('end', () => {
                activeBots.delete(name);
                // INI SOLUSINYA: Kasih jeda 5 menit (300000ms) kalau bot terputus
                // Supaya log server tidak penuh (ngespam) dan IP kamu aman
                console.log(`[MC-BOT] 🔌 ${name} Off. Menunggu 5 Menit sebelum masuk lagi...`);
                setTimeout(() => createSingleBot(name), 300000); 
            });

            bot.on('error', (err) => {});
        };

        // LOGIN BERTAHAP (Kasih jeda 3 menit antar bot)
        nicknames.forEach((name, i) => {
            setTimeout(() => createSingleBot(name), i * 180000);
        });
    }
};
