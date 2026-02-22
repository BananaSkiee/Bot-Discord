// modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;

module.exports = {
    init: (client) => {
        const botName = 'EmpireBS';
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            if (botInstance) return;

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                auth: 'offline',
                keepAlive: true,
                hideErrors: true,
                checkTimeoutInterval: 60000,
                maxRetries: 10,
            });

            // Fungsi Helper untuk pindah server dengan log
            const moveServer = (serverName, delay) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        if (botInstance && botInstance.entity) {
                            console.log(`[MC-MOVE] ✈️  Mencoba pindah ke: ${serverName}...`);
                            botInstance.chat(`/server ${serverName}`);
                            resolve();
                        }
                    }, delay);
                });
            };

            botInstance.once('spawn', async () => {
                console.log(`[MC-SUCCESS] ✅ Bot berhasil masuk ke Proxy/Lobby.`);
                
                // 1. Login/Register AuthMe (Dahulukan ini agar tidak di-kick lobby)
                setTimeout(() => {
                    if (!botInstance) return;
                    console.log('[MC-LOGIN] 🔐 Mengirim perintah login...');
                    botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                    botInstance.chat(`/login ${passwordBot}`);
                }, 3000);

                // --- LOGIKA NAVIGASI BERURUTAN ---
                
                // Tunggu 15 detik di lobby awal agar stabil
                await moveServer('survival', 15000); 
                console.log(`[MC-INFO] 🟢 Bot seharusnya sekarang di SURVIVAL.`);

                // Tunggu 20 detik di survival, lalu ke creative
                await moveServer('creative', 20000);
                console.log(`[MC-INFO] 🔵 Bot seharusnya sekarang di CREATIVE.`);

                // Tunggu 20 detik di creative, lalu balik ke lobby
                await moveServer('lobby', 20000);
                console.log(`[MC-INFO] 🟡 Bot kembali ke LOBBY utama.`);

                // --- AKHIR LOGIKA NAVIGASI ---

                // Anti-AFK Aktif terus menerus
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                    }
                }, 45000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            botInstance.on('error', (err) => {
                console.log(`[MC-ERROR] ⚠️ ${err.message || err.code}`);
            });

            botInstance.on('kicked', (reason) => {
                let cleanReason = reason;
                try {
                    const parsed = JSON.parse(reason);
                    cleanReason = parsed.text || parsed.extra?.[0]?.text || reason;
                } catch (e) {}
                
                console.log(`[MC-KICK] Keluar server: ${cleanReason}`);

                // Penanganan khusus jika terkena ReadTimeout (sering terjadi saat pindah server)
                if (cleanReason.includes('ReadTimeout') || cleanReason.includes('void future')) {
                    console.log('[MC-FIX] 🔧 Masalah koneksi terdeteksi, cooldown reconnect 90 detik...');
                    if (botInstance) botInstance.end();
                    setTimeout(startBot, 90000);
                    return;
                }
            });

            botInstance.on('end', () => {
                console.log(`[MC-RETRY] 🔌 Koneksi terputus. Reconnect dalam 60 detik...`);
                botInstance = null;
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        setTimeout(startBot, 10000);
    }
};
