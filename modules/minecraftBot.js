// modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;

module.exports = {
    init: (client) => {
        const botName = 'EmpireBS';
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            if (botInstance) {
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
                version: "1.21.1",
                keepAlive: true,
                checkTimeoutInterval: 60000,
                viewDistance: "tiny",
                colorsEnabled: false
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

            // Menggunakan ONCE agar loop tidak bertumpuk saat pindah world/dimensi
            botInstance.once('spawn', async () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif. Memulai rutinitas keliling...`);
                
                // Login satu kali saja saat pertama spawn
                setTimeout(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.chat(`/login ${passwordBot}`);
                        botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                    }
                }, 5000);

                // --- LOOP KELILING SELAMANYA ---
                while (botInstance && botInstance.entity) {
                    await moveServer('survival', 30000); // Tunggu 30 detik di server sebelumnya lalu ke survival
                    await moveServer('creative', 30000); // Tunggu 30 detik di survival lalu ke creative
                    await moveServer('lobby', 30000);    // Tunggu 30 detik di creative lalu ke lobby
                    
                    console.log(`[MC-LOOP] 🔄 Putaran selesai. Mengulang dari awal...`);
                }
            });

            const afkInterval = setInterval(() => {
                if (botInstance && botInstance.entity) {
                    botInstance.swingArm('right');
                }
            }, 30000);

            botInstance.on('error', (err) => {
                console.log(`[MC-ERROR] ⚠️ ${err.message}`);
            });

            botInstance.on('kicked', (reason) => {
                let cleanReason = "";
                try {
                    if (typeof reason === 'object') {
                        cleanReason = JSON.stringify(reason);
                    } else {
                        cleanReason = reason.toString();
                    }
                } catch (e) { cleanReason = "Unknown Kick"; }

                console.log(`[MC-KICK] Keluar: ${cleanReason}`);
                
                if (cleanReason.includes('BadPacketException') || cleanReason.includes('DecoderException')) {
                    if (botInstance) botInstance.end();
                    if (reconnectTimeout) clearTimeout(reconnectTimeout);
                    reconnectTimeout = setTimeout(startBot, 10000);
                }
            });

            botInstance.on('end', () => {
                console.log(`[MC-RETRY] 🔌 Terputus. Reconnect dalam 60 detik...`);
                clearInterval(afkInterval);
                botInstance = null;
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        setTimeout(startBot, 10000);
    }
};
