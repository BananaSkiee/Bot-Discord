
const mineflayer = require('mineflayer');

// Cukup gunakan satu nickname paling stabil
const botName = 'RianGamerz';
let botInstance = null;

module.exports = {
    init: () => {
        console.log(`[MC-SYSTEM] 🛡️ Memulai Bot Tunggal: ${botName}. Fokus Utama: STAY ONLINE.`);

        const startBot = () => {
            if (botInstance) return;

            botInstance = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: botName,
                version: '1.21.1',
                auth: 'offline',
                checkTimeoutInterval: 120000, // Menghindari kick karena koneksi lambat
                disableChatSigning: true,
                hideErrors: true
            });

            // --- ANTI-IDLE PATROL (Micro Movement) ---
            const preventKick = () => {
                const stayTask = setInterval(() => {
                    if (!botInstance || !botInstance.entity) return;

                    // Bergerak maju 1 detik
                    botInstance.setControlState('forward', true);
                    
                    setTimeout(() => {
                        if (botInstance && botInstance.setControlState) {
                            botInstance.setControlState('forward', false);
                            
                            // Gerakan tambahan: Melompat dan menoleh
                            botInstance.setControlState('jump', true);
                            setTimeout(() => { if(botInstance.setControlState) botInstance.setControlState('jump', false); }, 500);
                            
                            const yaw = (Math.random() - 0.5) * 2 * Math.PI;
                            botInstance.look(yaw, 0);
                        }
                    }, 1000);

                }, 30000); // Ulangi setiap 30 detik untuk mereset timer AFK server

                botInstance.once('end', () => clearInterval(stayTask));
            };

            botInstance.on('login', () => {
                console.log(`[MC-BOT] ✅ ${botName} berhasil masuk. Memulai sistem anti-kick...`);
                setTimeout(preventKick, 5000);
            });

            botInstance.on('death', () => {
                console.log(`[MC-BOT] ⚠️ Bot mati, respawning...`);
                setTimeout(() => { if(botInstance && botInstance.respawn) botInstance.respawn(); }, 10000);
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-BOT] 🔌 Bot terputus (${reason}). Reconnecting dalam 60 detik...`);
                botInstance = null;
                // Reconnect otomatis jika terputus
                setTimeout(startBot, 60000);
            });

            botInstance.on('error', (err) => {
                console.log(`[MC-BOT] ❌ Error terdeteksi, mencoba menstabilkan...`);
            });
        };

        // Jalankan bot
        startBot();
    }
};
                              
