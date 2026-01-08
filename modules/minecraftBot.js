//modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;

module.exports = {
    init: (client) => {
        const botName = 'RianGamerz';
        const passwordBot = 'BananaSkiee'; 

        const startBot = () => {
            // Jika bot masih ada (atau sedang proses koneksi), jangan buat baru
            if (botInstance) {
                botInstance.quit();
                botInstance = null;
            }

            console.log(`[MC] 🔄 Memulai bot ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: botName,
                version: '1.21.1',
                auth: 'offline',
                // Jeda timeout ditingkatkan agar tidak cepat putus saat loading
                connectTimeout: 60000,
                viewDistance: 'tiny'
            });

            botInstance.on('resource_pack', () => botInstance.acceptResourcePack());

            botInstance.on('spawn', () => {
                console.log(`[MC] ✅ ${botName} ONLINE!`);
                
                // Jeda login diperlama (5 detik) agar ViaVersion selesai sinkronisasi UUID
                setTimeout(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.chat(`/login ${passwordBot}`);
                        console.log(`[MC] 🔑 Perintah login dikirim.`);
                    }
                }, 5000);

                // Gerakan agar tidak AFK
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                    }
                }, 30000);

                botInstance.once('end', () => clearInterval(afkLoop));
            });

            botInstance.on('error', (err) => {
                console.log(`[MC-ERR] ⚠️ ${err.message}`);
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-DC] 🔌 Terputus (${reason}). Menunggu 60 detik agar UUID bersih...`);
                botInstance = null;
                // WAJIB: Jeda 1 menit agar server menghapus UUID lama dari daftar pemain online
                setTimeout(startBot, 60000);
            });
        };

        // Tambahkan delay saat pertama kali bot Akira nyala 
        // agar tidak tabrakan dengan proses startup Discord
        setTimeout(startBot, 10000);
    }
};
