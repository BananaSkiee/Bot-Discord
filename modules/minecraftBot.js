const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;
let isLooping = false;

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
            });

            // Fungsi simulasi aktifitas manusia
            const doActivity = async () => {
                if (!botInstance || !botInstance.entity) return;
                
                // Lompat sekali
                botInstance.setControlState('jump', true);
                setTimeout(() => botInstance.setControlState('jump', false), 500);
                
                // Jalan ke depan sebentar
                botInstance.setControlState('forward', true);
                setTimeout(() => botInstance.setControlState('forward', false), 1000);
            };

            const moveServer = async (serverName) => {
                if (!botInstance || !botInstance.entity) return;
                
                console.log(`[MC-MOVE] ✈️  Berpindah ke: ${serverName}`);
                botInstance.chat(`/server ${serverName}`);
                
                // Beri jeda setelah pindah server untuk stabilisasi paket
                await new Promise(res => setTimeout(res, 5000));
                await doActivity(); 
            };

            botInstance.once('spawn', async () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif di server.`);
                
                // Login
                setTimeout(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.chat(`/login ${passwordBot}`);
                    }
                }, 5000);

                if (isLooping) return;
                isLooping = true;

                try {
                    while (botInstance && botInstance.entity) {
                        // Tunggu 45 detik sebelum pindah (lebih lama = lebih aman)
                        await new Promise(res => setTimeout(res, 45000));
                        await moveServer('survival');
                        
                        await new Promise(res => setTimeout(res, 45000));
                        await moveServer('creative');
                        
                        await new Promise(res => setTimeout(res, 45000));
                        await moveServer('lobby');

                        console.log(`[MC-LOOP] 🔄 Putaran selesai.`);
                    }
                } catch (e) {
                    isLooping = false;
                }
            });

            botInstance.on('error', (err) => {
                if (err.code === 'ECONNREFUSED') {
                    console.log("[MC-ERROR] Koneksi ditolak. IP mungkin cooldown.");
                }
            });

            botInstance.on('kicked', (reason) => {
                console.log(`[MC-KICK] Keluar: Terputus dari Proxy.`);
            });

            botInstance.on('end', () => {
                isLooping = false;
                botInstance = null;
                console.log(`[MC-RETRY] 🔌 Reconnect dalam 60 detik...`);
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        setTimeout(startBot, 5000);
    }
};
