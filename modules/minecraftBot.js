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
                
                botInstance.setControlState(randomAction, true);
                
                const yaw = (Math.random() * Math.PI * 2);
                const pitch = ((Math.random() - 0.5) * Math.PI);
                botInstance.look(yaw, pitch);

                setTimeout(() => {
                    if (botInstance) {
                        botInstance.clearControlStates();
                        setTimeout(startMoving, 2000); // Jeda antar gerakan dipercepat
                    }
                }, 1500);
            };

            botInstance.on('physicsTick', () => {
                if (!botInstance || !botInstance.entity) return;
                if (botInstance.entity.isCollidedHorizontally) {
                    botInstance.setControlState('jump', true);
                } else {
                    botInstance.setControlState('jump', false);
                }
            });

            botInstance.once('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif & Anti-AFK Mode ON.`);
                
                setTimeout(() => {
                    if (botInstance) botInstance.chat(`/login ${passwordBot}`);
                }, 3000);

                startMoving();

                // --- SIKLUS PINDAH SERVER (DIPERCEPAT KE 30 DETIK) ---
                // Agar server tidak mati, bot akan pindah-pindah terus setiap 30 detik
                setInterval(() => {
                    if (botInstance) {
                        currentServerIndex = (currentServerIndex + 1) % servers.length;
                        const target = servers[currentServerIndex];
                        console.log(`[MC-MOVE] ✈️  Mencegah Server Mati: Pindah ke ${target}`);
                        botInstance.chat(`/server ${target}`);
                        
                        // Opsional: Chat random supaya terdeteksi aktif
                        setTimeout(() => {
                            if (botInstance) botInstance.chat('!keepalive');
                        }, 5000);
                    }
                }, 30000); // 30.000 ms = 30 Detik
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
                console.log(`[MC-RETRY] 🔌 Reconnect dalam 15 detik...`);
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 15000); // Reconnect lebih cepat (15 detik)
            });
        };

        startBot();
    }
};
