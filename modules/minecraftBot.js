// modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;

module.exports = {
    init: (client) => {
        const botName = 'PersonaBS'; // Nama bot sementara diubah dari EmpireBS menjadi PersonaBS
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            if (botInstance) return;

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                // version: '1.20.1',  // Dihapus - biarkan auto-negotiate
                auth: 'offline',
                keepAlive: true,
                hideErrors: true // Mengurangi spam error mentah di konsol
            });

            // Logika pindah server yang aman
            const navigateTo = (target) => {
                if (botInstance && botInstance.entity) {
                    botInstance.chat(`/server ${target}`);
                    console.log(`[MC-MOVE] ✈️  Berpindah ke server: ${target}`);
                }
            };

            botInstance.once('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif di Proxy/Lobby.`);
                
                // JANGAN LANGSUNG PINDAH KE SURVIVAL!
                // Tunggu di lobby dulu 15 detik
                setTimeout(() => {
                    if (!botInstance) return;
                    
                    // Kirim perintah kosong untuk test koneksi
                    botInstance.chat('/');
                    console.log('[MC-TEST] 📤 Mengirim test command...');
                    
                    // Tunggu 5 detik lagi sebelum pindah server
                    setTimeout(() => {
                        if (!botInstance) return;
                        // Baru pindah ke survival
                        navigateTo('survival');
                    }, 5000);
                }, 15000);
                
                // Login ke AuthMe (jika ada) - dengan jeda 5 detik setelah spawn
                setTimeout(() => {
                    if (!botInstance) return;
                    console.log('[MC-LOGIN] 🔐 Mencoba login ke server...');
                    botInstance.chat(`/login ${passwordBot}`);
                    botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                }, 5000);

                // Anti-AFK yang sangat ringan (setiap 45 detik)
                // Cukup untuk menahan kick tapi tidak membebani hosting
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                    }
                }, 45000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            // Handler Error agar tidak spam
            botInstance.on('error', (err) => {
                if (err.code === 'ECONNREFUSED') {
                    // Hanya muncul sekali, tidak spam tiap detik
                    console.log(`[MC-ERROR] 🔌 Koneksi ditolak: ${err.code}`);
                } else {
                    console.log(`[MC-WARN] ⚠️ Masalah koneksi terdeteksi: ${err.code || 'unknown'}`);
                }
            });

            // Handler Kicked yang dimodifikasi sesuai permintaan
            botInstance.on('kicked', (reason) => {
                let cleanReason = reason;
                try {
                    cleanReason = JSON.parse(reason).text || reason;
                } catch (e) {
                    // use original
                }
                
                console.log(`[MC-KICK] Keluar server: ${cleanReason}`);
                
                // Jika error IP forwarding, coba dengan delay lebih panjang
                if (cleanReason.includes('Unexpected disconnect') || cleanReason.includes('IP forwarding')) {
                    console.log('[MC-FIX] 🔧 Mencoba strategi reconnect khusus...');
                    console.log('[MC-FIX] ⏱️ Akan reconnect dengan delay lebih panjang dan nama bot baru');
                    // Bersihkan cache local dengan mengakhiri koneksi
                    if (botInstance) {
                        botInstance.end('Reconnecting with fix');
                    }
                }
                
                // Bersihkan instance
                botInstance.removeAllListeners();
                botInstance = null;
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-RETRY] 🔌 Terputus (${reason || 'socketClosed'}). Mencoba kembali dalam 60 detik...`);
                
                // Bersihkan instance lama
                if (botInstance) {
                    botInstance.removeAllListeners();
                    botInstance = null;
                }

                // Reconnect lebih lama (60 detik) agar hosting tidak panas/kena rate limit
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        // Mulai pertama kali 15 detik setelah aplikasi nyala
        setTimeout(startBot, 15000);
    }
};
