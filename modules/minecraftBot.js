const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;
let isLooping = false; // Kunci agar loop tidak ganda

module.exports = {
    init: (client) => {
        const botName = 'EmpireBS';
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            // Bersihkan segalanya sebelum mulai baru
            if (botInstance) {
                botInstance.removeAllListeners();
                try { botInstance.end(); } catch (e) {}
                botInstance = null;
            }
            isLooping = false; 

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                auth: 'offline',
                version: "1.21.1",
                keepAlive: true,
                viewDistance: "tiny",
                disableChatSigning: true,
                checkTimeoutInterval: 60000
            });

            const moveServer = (serverName, delay) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        if (botInstance && botInstance.entity) {
                            console.log(`[MC-MOVE] ✈️  Berpindah ke: ${serverName}`);
                            botInstance.chat(`/server ${serverName}`);
                        }
                        resolve();
                    }, delay);
                });
            };

            botInstance.once('spawn', async () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif di server.`);
                
                // Login Handler
                setTimeout(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.chat(`/login ${passwordBot}`);
                        botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                    }
                }, 5000);

                // CEK: Jika sudah ada loop yang jalan, jangan buat lagi!
                if (isLooping) return;
                isLooping = true;

                try {
                    while (botInstance && botInstance.entity) {
                        await moveServer('survival', 30000);
                        if (!botInstance) break; // Cek jika bot disconnect saat nunggu

                        await moveServer('creative', 30000);
                        if (!botInstance) break;

                        await moveServer('lobby', 30000);
                        if (!botInstance) break;

                        console.log(`[MC-LOOP] 🔄 Putaran selesai. Mengulang...`);
                    }
                } catch (e) {
                    console.log("[MC-LOOP] Loop dihentikan.");
                } finally {
                    isLooping = false;
                }
            });

            botInstance.on('kicked', (reason) => {
                console.log(`[MC-KICK] Keluar: Terjadi kendala koneksi/paket.`);
                if (botInstance) botInstance.end();
            });

            botInstance.on('error', (err) => {
                if (!err.message.includes('BadPacket')) {
                    console.log(`[MC-ERROR] ⚠️ ${err.message}`);
                }
            });

            botInstance.on('end', () => {
                console.log(`[MC-RETRY] 🔌 Reconnect dalam 60 detik...`);
                botInstance = null;
                isLooping = false;
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        setTimeout(startBot, 5000);
    }
};
