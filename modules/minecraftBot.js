// modules/minecraftBot.js
const mineflayer = require('mineflayer');

module.exports = {
    init: (client) => {
        const host = 'emerald.magmanode.com';
        const proxyPort = 33096;
        const passwordBot = 'BananaSkiee';
        let reconnectTimeout = null;

        const createMcBot = () => {
            console.log(`[MC-SYSTEM] 🔄 Mencoba menghubungkan EmpireBS...`);

            const bot = mineflayer.createBot({
                host: host,
                port: proxyPort,
                username: 'EmpireBS',
                version: '1.20.1',
                auth: 'offline'
            });

            // Handler agar tidak spam di console saat server offline
            bot.on('error', (err) => {
                if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                    // Diam saja, tidak perlu log ribuan baris
                } else {
                    console.log(`[MC-ERR] Terjadi kendala koneksi.`);
                }
            });

            bot.on('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ EmpireBS berhasil masuk ke server!`);
                
                // Urutan eksekusi command agar tidak dianggap spamming oleh server
                setTimeout(() => {
                    bot.chat(`/register ${passwordBot} ${passwordBot}`);
                    bot.chat(`/login ${passwordBot}`);
                    
                    // Pindah-pindah server secara bertahap (Total delay 30 detik)
                    setTimeout(() => bot.chat('/server lobby'), 5000);
                    setTimeout(() => bot.chat('/server survival'), 15000);
                    setTimeout(() => bot.chat('/server creative'), 25000);
                }, 5000);
            });

            bot.on('end', () => {
                // Jika terputus, tunggu 2 menit baru coba lagi (biar Koyeb gak panas/limit)
                if (!reconnectTimeout) {
                    console.log(`[MC-RETRY] 🔌 Terputus. Mencoba reconnect dalam 2 menit...`);
                    reconnectTimeout = setTimeout(() => {
                        reconnectTimeout = null;
                        createMcBot();
                    }, 120000); 
                }
            });
        };

        // Jalankan bot pertama kali setelah 30 detik startup
        setTimeout(createMcBot, 30000);
    }
};
