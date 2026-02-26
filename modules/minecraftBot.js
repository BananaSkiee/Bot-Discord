// modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;

module.exports = {
    init: (client) => {
        const botName = 'EmpireMC';
        const passwordBot = 'BananaSkiee';
        const servers = ['survival', 'creative', 'lobby'];
        let currentServerIndex = 0;

        const startBot = () => {
            if (botInstance) {
                try { botInstance.quit(); } catch (e) {}
                botInstance.removeAllListeners();
                botInstance = null;
            }

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                version: "1.21.1",
                checkTimeoutInterval: 90000
            });

            // --- ANTI-AFK RINGAN ---
            // Gerakan sederhana: mengayunkan tangan dan memutar kepala secara periodik
            const startAntiAFK = () => {
                if (!botInstance || !botInstance.entity) return;

                // Ayun tangan kanan
                botInstance.swingArm('right');
                
                // Putar kepala sedikit agar tidak diam total
                const yaw = botInstance.entity.yaw + (Math.random() - 0.5) * 0.5;
                const pitch = botInstance.entity.pitch + (Math.random() - 0.5) * 0.2;
                botInstance.look(yaw, pitch);

                // Ulangi setiap 10 detik
                setTimeout(startAntiAFK, 10000);
            };

            // --- AUTO-JUMP (hanya jika nyangkut) ---
            botInstance.on('physicsTick', () => {
                if (!botInstance || !botInstance.entity) return;
                // Lompat jika menabrak blok di depan
                if (botInstance.entity.isCollidedHorizontally) {
                    botInstance.setControlState('jump', true);
                } else {
                    botInstance.setControlState('jump', false);
                }
            });

            botInstance.once('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif.`);

                // Login setelah 3 detik
                setTimeout(() => {
                    if (botInstance) {
                        botInstance.chat(`/login ${passwordBot}`);
                        console.log(`[MC-LOGIN] 🔐 Mengirim perintah login.`);
                    }
                }, 3000);

                // Mulai anti-AFK ringan
                startAntiAFK();

                // Siklus pindah server setiap 30 detik
                setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        currentServerIndex = (currentServerIndex + 1) % servers.length;
                        const target = servers[currentServerIndex];
                        console.log(`[MC-MOVE] ✈️  Pindah ke: ${target} (siklus 30 detik)`);
                        botInstance.chat(`/server ${target}`);
                    } else {
                        console.log(`[MC-MOVE] ⚠️ Bot tidak siap, lewati perpindahan.`);
                    }
                }, 30000); // 30 detik
            });

            botInstance.on('kicked', (reason) => {
                const cleanReason = reason.toString().replace(/"/g, '');
                console.log(`[MC-KICK] Keluar: ${cleanReason}`);
            });

            botInstance.on('error', (err) => {
                if (err.code !== 'ECONNRESET') {
                    console.log(`[MC-ERROR] Kendala: ${err.message}`);
                }
            });

            botInstance.on('end', () => {
                console.log(`[MC-RETRY] 🔌 Reconnect dalam 30 detik...`);
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 30000);
            });
        };

        startBot();
    }
};
