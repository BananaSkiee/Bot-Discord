// modules/minecraftBot.js
const mineflayer = require('mineflayer');

const botName = 'RianGamerz';
const passwordBot = 'BananaSkiee'; // Pastikan ini password yang benar di AuthMe

module.exports = {
    init: () => {
        console.log(`[SYSTEM] 🚀 Memulai Bot ${botName} tanpa gangguan Anti-Cheat.`);

        const runBot = () => {
            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: botName,
                version: '1.21.1',
                auth: 'offline',
                viewDistance: 'tiny', // Tetap pakai tiny supaya hemat RAM server & bot
                checkTimeoutInterval: 90000
            });

            // 1. OTOMATIS LOGIN (Wajib karena ada AuthMe)
            bot.on('spawn', () => {
                console.log(`[LOGIN] ${botName} mendarat di world. Mengirim perintah login...`);
                bot.chat(`/login ${passwordBot}`);
                bot.chat(`/register ${passwordBot} ${passwordBot}`);
                
                // 2. ANTI-AFK SEDERHANA
                // Cukup gerak sedikit setiap 45 detik agar tidak kena Anti-AFK bawaan server/essentials
                const afkInterval = setInterval(() => {
                    if (bot.entity) {
                        bot.swingArm('right'); // Ayun tangan
                        bot.setControlState('jump', true); // Lompat sekali
                        setTimeout(() => bot.setControlState('jump', false), 500);
                    }
                }, 45000);

                bot.once('end', () => clearInterval(afkInterval));
            });

            // 3. AUTO RECONNECT (Jika server restart atau crash)
            bot.on('end', (reason) => {
                console.log(`[DISCONNECT] Bot keluar (${reason}). Menyambung kembali dalam 10 detik...`);
                setTimeout(runBot, 10000);
            });

            bot.on('error', (err) => {
                console.log(`[ERROR] Terjadi masalah: ${err.message}`);
            });

            // Biar ga spam kalau bot dipukul atau mati
            bot.on('death', () => {
                console.log(`[DEATH] Bot mati, respawn otomatis...`);
                bot.respawn();
            });
        };

        runBot();
    }
};
