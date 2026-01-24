// modules/minecraftBot.js
const mineflayer = require('mineflayer');

module.exports = {
    init: (client) => {
        const host = 'emerald.magmanode.com';
        const proxyPort = 33096;
        const passwordBot = 'BananaSkiee';
        let rotationInterval = null;
        let isReconnecting = false;

        const createMcBot = () => {
            if (isReconnecting) return;
            console.log(`[MC-SYSTEM] 🔄 EmpireBS sedang bersiap...`);

            const bot = mineflayer.createBot({
                host: host,
                port: proxyPort,
                username: 'EmpireBS',
                version: '1.20.1',
                auth: 'offline',
                keepAlive: true, // Penting agar tidak gampang Time Out
                checkTimeoutInterval: 90000 // Menunggu lebih lama sebelum menyerah
            });

            // Mencegah console penuh kalau server mati
            bot.on('error', (err) => {
                // Diam tanpa spam log
            });

            bot.on('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ EmpireBS Online!`);
                
                // Jeda 7 detik setelah masuk baru Login (Biar gak IllegalStateException)
                setTimeout(() => {
                    if (bot && bot.entity) {
                        bot.chat(`/register ${passwordBot} ${passwordBot}`);
                        bot.chat(`/login ${passwordBot}`);
                    }
                }, 7000);

                // Rotasi Server setiap 3 menit (Pilih 3 menit agar RAM Koyeb tetap dingin)
                const servers = ['lobby', 'survival', 'creative'];
                let index = 0;

                if (!rotationInterval) {
                    rotationInterval = setInterval(() => {
                        if (bot && bot.entity) {
                            const targetServer = servers[index];
                            console.log(`[MC-INFO] Memindahkan bot ke: ${targetServer}`);
                            bot.chat(`/server ${targetServer}`);
                            index = (index + 1) % servers.length;
                        }
                    }, 180000); // 180.000ms = 3 Menit
                }
            });

            bot.on('end', (reason) => {
                if (rotationInterval) {
                    clearInterval(rotationInterval);
                    rotationInterval = null;
                }

                if (!isReconnecting) {
                    isReconnecting = true;
                    // Jeda 1 Menit baru masuk lagi (Mencegah Spam & Lag di Koyeb)
                    console.log(`[MC-RETRY] 🔌 Terputus. Menunggu 1 menit...`);
                    setTimeout(() => {
                        isReconnecting = false;
                        createMcBot();
                    }, 60000);
                }
            });
        };

        createMcBot();
    }
};
