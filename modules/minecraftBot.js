//modules/minecraftBot.js
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
                
                // Login Sequence - Dibuat santai agar tidak terbaca spam oleh AuthMe
                setTimeout(() => {
                    if (!botInstance) return;
                    
                    // Coba login (AuthMe otomatis handle jika belum register)
                    botInstance.chat(`/login ${passwordBot}`);
                    botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                    
                    // Jeda 8 detik setelah login baru pindah ke survival
                    // Memberikan waktu server untuk memproses session login
                    setTimeout(() => navigateTo('survival'), 8000);
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
                } else {
                    console.log(`[MC-WARN] Masalah koneksi terdeteksi.`);
                }
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-RETRY] 🔌 Terputus (${reason}). Mencoba kembali dalam 60 detik...`);
                
                // Bersihkan instance lama
                botInstance.removeAllListeners();
                botInstance = null;

                // Reconnect lebih lama (60 detik) agar hosting tidak panas/kena rate limit
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });

            botInstance.on('kicked', (reason) => {
                const cleanReason = JSON.parse(reason).text || reason;
                console.log(`[MC-KICK] Keluar server: ${cleanReason}`);
            });
        };

        // Mulai pertama kali 15 detik setelah aplikasi nyala
        setTimeout(startBot, 15000);
    }
};
