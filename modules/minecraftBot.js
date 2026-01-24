// modules/minecraftBot.js
const mineflayer = require('mineflayer');

module.exports = {
    init: (client) => {
        const host = 'emerald.magmanode.com';
        const proxyPort = 33096;
        const passwordBot = 'BananaSkiee';
        let reconnectTimeout = null;
        let rotationInterval = null;

        const createMcBot = () => {
            console.log(`[MC-SYSTEM] 🔄 EmpireBS sedang mencoba masuk...`);

            const bot = mineflayer.createBot({
                host: host,
                port: proxyPort,
                username: 'EmpireBS',
                version: '1.20.1', // Sesuaikan dengan versi servermu
                auth: 'offline',
                checkTimeoutInterval: 60000 // Menambah batas waktu agar tidak gampang timeout
            });

            // Mencegah spam error di console saat server offline
            bot.on('error', (err) => {
                if (err.code !== 'ECONNREFUSED') {
                    // Hanya log jika bukan error koneksi biasa
                }
            });

            bot.on('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ EmpireBS Online di Server!`);
                
                // 1. REGISTER & LOGIN (Hanya 1x di awal)
                setTimeout(() => {
                    bot.chat(`/register ${passwordBot} ${passwordBot}`);
                    bot.chat(`/login ${passwordBot}`);
                }, 5000);

                // 2. ROTASI SERVER (Setiap 2 Menit pindah server)
                // Kita pakai 2 menit supaya lebih aman dari kick BungeeGuard
                const servers = ['lobby', 'survival', 'creative'];
                let index = 0;

                if (!rotationInterval) {
                    rotationInterval = setInterval(() => {
                        if (bot && bot.entity) {
                            const targetServer = servers[index];
                            console.log(`[MC-INFO] EmpireBS pindah ke: ${targetServer}`);
                            bot.chat(`/server ${targetServer}`);
                            
                            index = (index + 1) % servers.length;
                        }
                    }, 120000); // 120.000 ms = 2 Menit
                }
            });

            bot.on('end', (reason) => {
                // Hentikan rotasi jika bot DC
                if (rotationInterval) {
                    clearInterval(rotationInterval);
                    rotationInterval = null;
                }

                // Reconnect otomatis tapi jangan nyepam (Jeda 1 menit)
                if (!reconnectTimeout) {
                    console.log(`[MC-RETRY] 🔌 Terputus (${reason}). Reconnect dalam 1 menit...`);
                    reconnectTimeout = setTimeout(() => {
                        reconnectTimeout = null;
                        createMcBot();
                    }, 60000);
                }
            });
        };

        createMcBot();
    }
};
