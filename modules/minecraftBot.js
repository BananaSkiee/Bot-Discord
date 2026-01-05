// modules/minecraftBot.js
const mineflayer = require('mineflayer');

const botName = 'RianGamerz';
let botInstance = null;

module.exports = {
    init: () => {
        console.log(`[MC-SYSTEM] 🛡️ MEMULAI MODE GHOST-STAY: Bot ${botName} Wajib Online!`);

        const startBot = () => {
            if (botInstance) return;

            botInstance = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: botName,
                version: '1.21.1',
                auth: 'offline',
                checkTimeoutInterval: 180000, // Diperlama agar tidak mudah timeout
                disableChatSigning: true,
                physicsEnabled: true
            });

            // --- SISTEM GERAK RANDOM (ANTI-KICK AGRESIF) ---
            const keepAlive = () => {
                const stayTask = setInterval(() => {
                    if (!botInstance || !botInstance.entity) return;

                    // 1. Putar arah pandangan secara acak (360 derajat)
                    const randomYaw = Math.random() * Math.PI * 2;
                    botInstance.look(randomYaw, 0);

                    // 2. Berjalan maju sebentar ke arah baru tersebut
                    botInstance.setControlState('forward', true);
                    
                    setTimeout(() => {
                        if (botInstance && botInstance.setControlState) {
                            botInstance.setControlState('forward', false);
                            
                            // 3. Melompat sekali setelah berpindah tempat
                            botInstance.setControlState('jump', true);
                            setTimeout(() => { if(botInstance.setControlState) botInstance.setControlState('jump', false); }, 500);
                        }
                    }, 1500); // Berjalan selama 1.5 detik

                }, 20000); // Ulangi setiap 20 detik (Sangat sering agar timer AFK tidak jalan)

                botInstance.once('end', () => clearInterval(stayTask));
            };

            botInstance.on('login', () => {
                console.log(`[MC-BOT] ✅ ${botName} JOIN. Mematikan sistem Idle server...`);
                setTimeout(keepAlive, 5000);
            });

            botInstance.on('death', () => {
                // Respawn cepat agar tidak dianggap AFK saat mati
                setTimeout(() => { if(botInstance && botInstance.respawn) botInstance.respawn(); }, 5000);
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-BOT] 🔌 Bot terputus karena: ${reason}. Masuk lagi dalam 30 detik...`);
                botInstance = null;
                // Reconnect otomatis lebih cepat agar slot tidak diisi orang lain
                setTimeout(startBot, 30000);
            });

            botInstance.on('error', (err) => {
                // Error diabaikan agar bot tidak crash dan tetap mencoba stay
            });
        };

        startBot();
    }
};
