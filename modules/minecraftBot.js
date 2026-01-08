//modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;

module.exports = {
    init: (client) => {
        // Nickname baru: EmpireBS
        const botName = 'EmpireBS'; 
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            if (botInstance) return;

            console.log(`[MC-SYSTEM] 🔄 Mencoba masuk sebagai ${botName} (v1.20.1)...`);

            botInstance = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: botName,
                version: '1.20.1',
                auth: 'offline',
                keepAlive: true
            });

            botInstance.on('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ ${botName} BERHASIL MASUK KE SERVER!`);
                
                // Jeda 5 detik agar plugin login siap
                setTimeout(() => {
                    if (botInstance) {
                        // Karena nick baru, otomatis daftar (register)
                        botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                        botInstance.chat(`/login ${passwordBot}`);
                        console.log(`[MC-INFO] Perintah Register/Login dikirim untuk ${botName}`);
                    }
                }, 5000);

                // Anti-AFK
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                        botInstance.look(botInstance.entity.yaw + 0.1, 0);
                    }
                }, 20000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            botInstance.on('error', (err) => {
                console.log(`[MC-ERR] ⚠️ Terjadi masalah: ${err.message}`);
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-RETRY] 🔌 Terputus (${reason}). Menghubungkan ulang dlm 30 detik...`);
                botInstance = null;
                setTimeout(startBot, 30000);
            });
        };

        // Mulai bot 10 detik setelah aplikasi nyala
        setTimeout(startBot, 10000);
    }
};
