//modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;

const minecraftBot = {
    init: (client) => {
        const botName = 'RianGamerz';
        const passwordBot = 'BananaSkiee'; 

        const startBot = () => {
            if (botInstance) return;

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ${botName} ke EmpireBS...`);

            botInstance = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: botName,
                version: '1.21.1',
                auth: 'offline',
                viewDistance: 'tiny',
                checkTimeoutInterval: 60000,
                hideErrors: true
            });

            // Otomatis terima resource pack (Penting buat server kamu)
            botInstance.on('resource_pack', () => {
                if (botInstance) botInstance.acceptResourcePack();
            });

            botInstance.on('spawn', () => {
                console.log(`[MC-BOT] ✅ ${botName} Berhasil Masuk!`);
                
                // Login AuthMe
                setTimeout(() => {
                    if (botInstance) {
                        botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                        botInstance.chat(`/login ${passwordBot}`);
                    }
                }, 3000);

                // Anti-AFK (Agar tidak kena idle-timeout)
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                        botInstance.setControlState('jump', true);
                        setTimeout(() => { if(botInstance) botInstance.setControlState('jump', false) }, 500);
                    }
                }, 45000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            botInstance.on('error', (err) => {
                // Log error tapi jangan biarkan aplikasi crash
                if (!err.message.includes('ECONNREFUSED')) {
                    console.log(`[MC-ERROR] ⚠️ ${err.message}`);
                }
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-DC] 🔌 Putus (${reason}). Reconnect dalam 60 detik...`);
                botInstance = null;
                // Jeda 1 menit agar IP Koyeb tidak di-blockir (ECONNREFUSED)
                setTimeout(startBot, 60000);
            });
        };

        startBot();
    }
};

module.exports = minecraftBot;
