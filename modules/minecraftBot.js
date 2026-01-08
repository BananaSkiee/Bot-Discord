//modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;

module.exports = {
    init: (client) => {
        const botName = 'RianGamerz';
        const passwordBot = 'BananaSkiee'; 

        const startBot = () => {
            if (botInstance) return;

            console.log(`[MC] 🔄 Mencoba login ulang sebagai ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: botName,
                version: '1.21.1',
                auth: 'offline',
                viewDistance: 'tiny',
                // Mencegah error timeout saat koneksi lambat di Falix
                checkTimeoutInterval: 120000 
            });

            botInstance.on('resource_pack', () => botInstance.acceptResourcePack());

            botInstance.on('spawn', () => {
                console.log(`[MC] ✅ ${botName} berhasil masuk ke Lobby!`);
                
                // Jeda 3 detik agar server siap terima chat
                setTimeout(() => {
                    if (botInstance) {
                        // Karena tadi sudah di-unregister, kita daftar ulang (register)
                        botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                        // Dan langsung login juga untuk jaga-jaga
                        botInstance.chat(`/login ${passwordBot}`);
                        console.log(`[MC] 🔑 Perintah Register/Login dikirim.`);
                    }
                }, 3000);

                // Anti-AFK Routine
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                        botInstance.look(botInstance.entity.yaw + 0.1, 0);
                    }
                }, 30000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            botInstance.on('error', (err) => {
                if (err.code === 'ECONNREFUSED') {
                    console.log(`[MC-FIREWALL] IP Koyeb sedang diblokir sementara oleh Falix.`);
                } else {
                    console.log(`[MC-ERR] ${err.message}`);
                }
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-DC] Putus: ${reason}. Menunggu 100 detik (Anti-Duplicate)...`);
                botInstance = null;
                // Jeda 100 detik sangat penting agar 'Duplicate UUID' hilang dari ViaVersion
                setTimeout(startBot, 100000); 
            });
        };

        // Tunggu 15 detik saat bot Discord pertama kali nyala sebelum konek ke MC
        setTimeout(startBot, 15000);
    }
};
