// modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;

module.exports = {
    init: (client) => {
        const botName = 'EmpireBS';
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            // Hindari duplikasi instance bot
            if (botInstance) {
                try { botInstance.end(); } catch (e) {}
                botInstance = null;
            }

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                auth: 'offline',
                keepAlive: true,
                hideErrors: true,
                checkTimeoutInterval: 60000, // 60 detik
                maxRetries: 10,
                version: "1.21.1" // Sesuaikan dengan versi servermu
            });

            // Fungsi Helper untuk pindah server dengan sistem antrian (Promise)
            const moveServer = (serverName, delay) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        if (botInstance && botInstance.entity) {
                            console.log(`[MC-MOVE] ✈️  Mencoba pindah ke: ${serverName}...`);
                            botInstance.chat(`/server ${serverName}`);
                        }
                        resolve();
                    }, delay);
                });
            };

            botInstance.once('spawn', async () => {
                console.log(`[MC-SUCCESS] ✅ Bot berhasil masuk ke Proxy/Lobby.`);
                
                // 1. Proses Login/Register (3 detik setelah spawn)
                setTimeout(() => {
                    if (botInstance) {
                        console.log('[MC-LOGIN] 🔐 Mengirim perintah auth...');
                        botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                        botInstance.chat(`/login ${passwordBot}`);
                    }
                }, 3000);

                // 2. LOGIKA NAVIGASI BERURUTAN
                // Beri waktu bot benar-benar stabil di lobby sebelum mulai pindah
                await moveServer('survival', 15000); 
                
                await moveServer('creative', 25000); // 25 detik kemudian ke creative
                
                await moveServer('lobby', 25000);    // 25 detik kemudian balik ke lobby

                // 3. Anti-AFK (Tetap berjalan di server manapun bot berada)
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                    }
                }, 45000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            // Handler Error
            botInstance.on('error', (err) => {
                console.log(`[MC-ERROR] ⚠️ ${err.message || err.code}`);
            });

            // Handler Kicked (VERSI ANTI-CRASH)
            botInstance.on('kicked', (reason) => {
                let cleanReason = '';
                
                try {
                    // Cek jika reason adalah JSON string dari Minecraft
                    if (typeof reason === 'string' && reason.startsWith('{')) {
                        const parsed = JSON.parse(reason);
                        cleanReason = parsed.text || (parsed.extra && parsed.extra[0] ? parsed.extra[0].text : reason);
                    } else {
                        cleanReason = reason.toString();
                    }
                } catch (e) {
                    cleanReason = "Terjadi kesalahan saat membaca alasan kick.";
                }

                console.log(`[MC-KICK] Keluar server: ${cleanReason}`);

                // Filter error spesifik untuk reconnect lebih lama
                const msg = cleanReason.toLowerCase();
                if (msg.includes('timeout') || msg.includes('void future') || msg.includes('bungeecord')) {
                    console.log('[MC-FIX] 🔧 Masalah internal server terdeteksi. Cooldown 90 detik...');
                    
                    if (botInstance) botInstance.end();
                    if (reconnectTimeout) clearTimeout(reconnectTimeout);
                    reconnectTimeout = setTimeout(startBot, 90000);
                }
            });

            // Handler End (Terputus biasa)
            botInstance.on('end', () => {
                console.log(`[MC-RETRY] 🔌 Koneksi terputus. Mencoba kembali dalam 60 detik...`);
                botInstance = null;
                
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        // Jalankan bot pertama kali
        setTimeout(startBot, 10000);
    }
};
