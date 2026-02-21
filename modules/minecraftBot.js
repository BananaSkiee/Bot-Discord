// modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;

module.exports = {
    init: (client) => {
        const botName = 'PersonaBS';
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
                // Tambah timeout lebih panjang
                checkTimeoutInterval: 60000, // 60 detik (default 30 detik)
                // Kurangi packet loss
                maxRetries: 10
            });

            const navigateTo = (target) => {
                if (botInstance && botInstance.entity) {
                    botInstance.chat(`/server ${target}`);
                    console.log(`[MC-MOVE] ✈️  Berpindah ke server: ${target} dalam 10 detik...`);
                }
            };

            botInstance.once('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif di Proxy/Lobby.`);
                
                // JEDA LEBIH PANJANG SEBELUM PINDAH KE SURVIVAL
                // 30 detik di lobby dulu
                setTimeout(() => {
                    if (!botInstance) return;
                    
                    console.log(`[MC-WAIT] ⏱️ Menunggu server survival siap...`);
                    
                    // Test koneksi dengan command ringan
                    botInstance.chat('/ping');
                    
                    // Tunggu 10 detik lagi
                    setTimeout(() => {
                        if (!botInstance) return;
                        navigateTo('survival');
                    }, 10000);
                    
                }, 30000); // 30 detik di lobby
                
                // Login ke AuthMe
                setTimeout(() => {
                    if (!botInstance) return;
                    console.log('[MC-LOGIN] 🔐 Mencoba login...');
                    botInstance.chat(`/login ${passwordBot}`);
                    botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                }, 5000);

                // Anti-AFK
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                    }
                }, 45000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            // Handler Error yang Lebih Informatif
            botInstance.on('error', (err) => {
                if (err.code === 'ECONNREFUSED') {
                    console.log(`[MC-ERROR] 🔌 Koneksi ditolak. Pastikan BungeeCord online.`);
                } else if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
                    console.log(`[MC-ERROR] ⏱️ Timeout - Server terlalu lambat merespons.`);
                } else {
                    console.log(`[MC-WARN] ⚠️ Error: ${err.message || err.code}`);
                }
            });

            // Handler Kicked
            botInstance.on('kicked', (reason) => {
                let cleanReason = reason;
                try {
                    cleanReason = JSON.parse(reason).text || reason;
                } catch (e) {}
                
                console.log(`[MC-KICK] Keluar server: ${cleanReason}`);
                
                // Jika ReadTimeout, tambah delay reconnect
                if (cleanReason.includes('ReadTimeoutException')) {
                    console.log('[MC-FIX] 🔧 Server terlalu lambat. Akan reconnect dengan delay lebih panjang (120 detik)...');
                    if (botInstance) {
                        botInstance.end('Timeout - server lambat');
                    }
                    // Override reconnect delay
                    setTimeout(() => {
                        console.log('[MC-FIX] Mencoba reconnect setelah delay panjang...');
                        startBot();
                    }, 120000); // 2 menit
                    return; // Jangan lanjut ke handler end
                }
                
                botInstance.removeAllListeners();
                botInstance = null;
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-RETRY] 🔌 Terputus. Mencoba kembali dalam 60 detik...`);
                
                if (botInstance) {
                    botInstance.removeAllListeners();
                    botInstance = null;
                }

                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        // Mulai 15 detik setelah app nyala
        setTimeout(startBot, 15000);
    }
};
