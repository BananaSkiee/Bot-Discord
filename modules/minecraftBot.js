//modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;

module.exports = {
    init: (client) => {
        const botName = 'RianGamerz';
        const passwordBot = 'BananaSkiee'; 

        const startBot = () => {
            if (botInstance) return;

            console.log(`[MC] ⏳ Menunggu server stabil sebelum menghubungkan ${botName}...`);

            // JEDA PERTAMA: Beri waktu server 30 detik untuk menyelesaikan lag startup
            setTimeout(() => {
                console.log(`[MC] 🔄 Menghubungkan ke EmpireBS...`);
                
                botInstance = mineflayer.createBot({
                    host: 'empirebs.falixsrv.me',
                    port: 37152,
                    username: botName,
                    version: '1.21.1',
                    auth: 'offline',
                    // Menambah waktu tunggu paket agar tidak socketClosed saat server lag
                    connectTimeout: 90000, 
                    viewDistance: 'tiny'
                });

                botInstance.on('resource_pack', () => botInstance.acceptResourcePack());

                botInstance.on('spawn', () => {
                    console.log(`[MC] ✅ ${botName} ONLINE!`);
                    
                    // JEDA LOGIN: Beri waktu 5 detik agar plugin AuthMe sudah siap
                    setTimeout(() => {
                        if (botInstance) {
                            botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                            botInstance.chat(`/login ${passwordBot}`);
                        }
                    }, 5000);

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
                    console.log(`[MC-DC] Putus (${reason}). Reconnect dalam 2 menit...`);
                    botInstance = null;
                    setTimeout(startBot, 120000); 
                });

            }, 30000); // Tunggu 30 detik sebelum mulai koneksi
        };

        // Tunggu 60 detik saat pertama kali bot Akira nyala 
        // agar tidak tabrakan dengan loading plugin server yang berat
        setTimeout(startBot, 60000);
    }
};
