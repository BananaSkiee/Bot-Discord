// modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;

module.exports = {
    init: (client) => {
        const botName = 'EmpireBS';
        const passwordBot = 'BananaSkiee';
        const servers = ['survival', 'creative', 'lobby'];
        let currentServerIndex = 0;

        const startBot = () => {
            // Bersihkan instance lama jika ada
            if (botInstance) {
                try { botInstance.quit(); } catch (e) {}
                botInstance.removeAllListeners();
                botInstance = null;
            }

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            // KONFIGURASI BOT (Disesuaikan untuk BungeeCord/FalixNodes)
            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                version: "1.21.1",
                fakeHost: 'emerald.magmanode.com', // Penting: Biar Bungee tidak menolak koneksi
                checkTimeoutInterval: 120000,      // Lebih tinggi agar tidak mudah timeout
                hideErrors: true                   // Sembunyikan error spam di konsol
            });

            // --- FUNGSI GERAKAN (ANTI-AFK) ---
            const startMoving = () => {
                if (!botInstance || !botInstance.entity) return;

                const actions = ['forward', 'back', 'left', 'right', 'jump'];
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                
                // Bot gerak selama 2 detik
                botInstance.setControlState(randomAction, true);
                
                // Putar badan acak
                const yaw = (Math.random() * Math.PI * 2);
                const pitch = ((Math.random() - 0.5) * Math.PI);
                botInstance.look(yaw, pitch);

                setTimeout(() => {
                    if (botInstance) {
                        botInstance.clearControlStates();
                        // JEDA MINIMAL 5 DETIK SESUAI REQUEST
                        setTimeout(startMoving, 5000); 
                    }
                }, 2000);
            };

            // --- LOGIKA AUTO-JUMP ---
            botInstance.on('physicsTick', () => {
                if (!botInstance || !botInstance.entity) return;
                if (botInstance.entity.isCollidedHorizontally) {
                    botInstance.setControlState('jump', true);
                } else {
                    botInstance.setControlState('jump', false);
                }
            });

            botInstance.once('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif di server.`);
                
                // Login otomatis setelah 3 detik spawn
                setTimeout(() => {
                    if (botInstance) botInstance.chat(`/login ${passwordBot}`);
                }, 3000);

                startMoving();

                // --- SIKLUS PINDAH SERVER SETIAP 1 MENIT ---
                setInterval(() => {
                    if (botInstance) {
                        currentServerIndex = (currentServerIndex + 1) % servers.length;
                        const target = servers[currentServerIndex];
                        console.log(`[MC-MOVE] ✈️  Pindah ke: ${target}`);
                        botInstance.chat(`/server ${target}`);
                    }
                }, 60000); // 1 Menit
            });

            // Handler jika di-kick
            botInstance.on('kicked', (reason) => {
                const cleanReason = reason.toString();
                // Jika server offline, infokan di konsol
                if (cleanReason.includes("OFFLINE")) {
                    console.log(`[MC-KICK] ❌ Server Target Offline (Cek FalixNodes!)`);
                } else {
                    console.log(`[MC-KICK] Keluar: ${cleanReason}`);
                }
            });

            botInstance.on('error', (err) => {
                if (err.code !== 'ECONNRESET') {
                    console.log(`[MC-ERROR] Kendala: ${err.message}`);
                }
            });

            botInstance.on('end', () => {
                // JOIN ULANG SETIAP 30 DETIK SESUAI REQUEST
                console.log(`[MC-RETRY] 🔌 Mencoba masuk kembali dalam 30 detik...`);
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 30000);
            });
        };

        startBot();
    }
};
