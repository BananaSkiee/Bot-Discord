const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;

module.exports = {
    init: (client) => {
        const botName = 'EmpireBS';
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            if (botInstance) {
                console.log("[MC-CLEAN] Membersihkan instance bot lama...");
                botInstance.removeAllListeners();
                try { botInstance.end(); } catch (e) {}
                botInstance = null;
            }

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                auth: 'offline',
                version: "1.21.1", // WAJIB spesifik untuk 1.21.1
                keepAlive: true,
                hideErrors: false, // Set false sebentar untuk debug jika masih error
                checkTimeoutInterval: 90000,
                // Penambahan setting untuk 1.21.1 agar tidak kick saat pindah server:
                viewDistance: "tiny", 
                wait_for_chunks: true
            });

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
                console.log(`[MC-SUCCESS] ✅ Bot aktif di Proxy/Lobby.`);
                
                // Jeda 5 detik untuk login
                setTimeout(() => {
                    if (botInstance) {
                        botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                        botInstance.chat(`/login ${passwordBot}`);
                    }
                }, 5000);

                // --- URUTAN PINDAH SERVER ---
                // Beri jeda lebih lama (30 detik) karena DeluxeHub kamu sedang error
                await moveServer('survival', 30000); 
                await moveServer('creative', 30000);
                await moveServer('lobby', 30000);

                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) botInstance.swingArm('right');
                }, 45000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            botInstance.on('error', (err) => {
                console.log(`[MC-ERROR] ⚠️ ${err.message}`);
            });

            botInstance.on('kicked', (reason) => {
                // Konversi reason (bisa objek/string) ke string murni
                let msg = "";
                try {
                    msg = typeof reason === 'string' ? reason : JSON.stringify(reason);
                } catch (e) {
                    msg = "Unknown kick reason";
                }

                console.log(`[MC-KICK] Keluar server: ${msg}`);

                // Jika terdeteksi masalah protokol atau timeout
                if (msg.includes('IllegalStateException') || msg.includes('timeout')) {
                    console.log("[MC-FIX] Restarting dalam 90 detik karena masalah protokol...");
                    if (reconnectTimeout) clearTimeout(reconnectTimeout);
                    reconnectTimeout = setTimeout(startBot, 90000);
                }
            });

            botInstance.on('end', () => {
                console.log(`[MC-RETRY] 🔌 Terputus. Reconnect dalam 60 detik...`);
                botInstance = null;
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        setTimeout(startBot, 10000);
    }
};
