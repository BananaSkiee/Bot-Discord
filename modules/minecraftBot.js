// modules/minecraftBot.js
const mineflayer = require('mineflayer');

const botName = 'RianGamerz';
const passwordBot = 'BananaSkiee'; // GANTI DENGAN PASSWORD KAMU
let botInstance = null;

module.exports = {
    init: () => {
        console.log(`[MC-SYSTEM] 🛡️ Memulai Bot dengan sistem Auto-AuthMe...`);

        const startBot = () => {
            if (botInstance) return;

            botInstance = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: botName,
                version: '1.21.1',
                auth: 'offline',
                checkTimeoutInterval: 120000,
                disableChatSigning: true
            });

            // --- SISTEM AUTO LOGIN / REGISTER ---
            botInstance.on('spawn', () => {
                console.log(`[MC-BOT] 🔑 Mencoba Login/Register...`);
                
                // Bot akan mengirim perintah login dan register sekaligus agar aman
                botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                botInstance.chat(`/login ${passwordBot}`);
                
                // Mulai sistem anti-kick setelah login
                setTimeout(keepAlive, 5000);
            });

            // --- ANTI-IDLE (Micro Movement) ---
            const keepAlive = () => {
                const stayTask = setInterval(() => {
                    if (!botInstance || !botInstance.entity) return;

                    // Berjalan maju sedikit
                    botInstance.setControlState('forward', true);
                    setTimeout(() => {
                        if (botInstance && botInstance.setControlState) {
                            botInstance.setControlState('forward', false);
                            botInstance.setControlState('jump', true);
                            setTimeout(() => { if(botInstance.setControlState) botInstance.setControlState('jump', false); }, 500);
                        }
                    }, 1000);

                    // Menoleh secara acak
                    const yaw = Math.random() * Math.PI * 2;
                    botInstance.look(yaw, 0);

                }, 25000);

                botInstance.once('end', () => clearInterval(stayTask));
            };

            botInstance.on('login', () => {
                console.log(`[MC-BOT] ✅ ${botName} terhubung ke server.`);
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-BOT] 🔌 Terputus (${reason}). Reconnect dalam 30 detik...`);
                botInstance = null;
                setTimeout(startBot, 30000);
            });

            botInstance.on('error', (err) => {});
        };

        startBot();
    }
};
