//modules/minecraftBot.js
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

            // --- FUNGSI GERAKAN (ANTI-AFK) ---
            const startMoving = () => {
                if (!botInstance || !botInstance.entity) return;

                const actions = ['forward', 'back', 'left', 'right', 'jump'];
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                
                // Bot melakukan gerakan selama 2 detik
                botInstance.setControlState(randomAction, true);
                
                // Bot memutar badan secara acak
                const yaw = (Math.random() * Math.PI * 2);
                const pitch = ((Math.random() - 0.5) * Math.PI);
                botInstance.look(yaw, pitch);

                setTimeout(() => {
                    if (botInstance) {
                        botInstance.clearControlStates();
                        // Ulangi gerakan lagi setelah jeda 3 detik
                        setTimeout(startMoving, 3000);
                    }
                }, 2000);
            };

            // --- LOGIKA AUTO-JUMP (Agar tidak nyangkut) ---
            botInstance.on('physicsTick', () => {
                if (!botInstance || !botInstance.entity) return;
                // Jika bot menabrak blok di depannya, otomatis melompat
                if (botInstance.entity.isCollidedHorizontally) {
                    botInstance.setControlState('jump', true);
                } else {
                    botInstance.setControlState('jump', false);
                }
            });

            botInstance.once('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif & mulai keliling server.`);
                
                setTimeout(() => {
                    if (botInstance) botInstance.chat(`/login ${passwordBot}`);
                }, 3000);

                // Mulai siklus keliling dunia
                startMoving();

                // Siklus pindah server setiap 5 menit (300.000 ms)
                setInterval(() => {
                    if (botInstance) {
                        currentServerIndex = (currentServerIndex + 1) % servers.length;
                        const target = servers[currentServerIndex];
                        console.log(`[MC-MOVE] ✈️  Pindah ke: ${target} (Anti-AFK Mode)`);
                        botInstance.chat(`/server ${target}`);
                    }
                }, 300000); 
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
                        
