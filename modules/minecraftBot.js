//modules/minecraftBot.js
const mineflayer = require('mineflayer');

const botName = 'RianGamerz';
const passwordBot = 'BananaSkiee'; 

const runBot = () => {
    const bot = mineflayer.createBot({
        host: 'empirebs.falixsrv.me',
        port: 37152,
        username: botName,
        version: '1.21.1',
        auth: 'offline',
        // Matikan fitur yang tidak didukung bot agar koneksi stabil
        loadInternalScoreboards: false,
        viewDistance: 'tiny'
    });

    // Otomatis skip/terima paket resource pack dari EconomyShop/DeluxeHub
    bot.on('resource_pack', () => bot.acceptResourcePack());

    bot.on('spawn', () => {
        console.log(`[MC] ✅ ${botName} mendarat di Lobby.`);
        
        // Jeda 2 detik sebelum login agar AuthMe tidak error
        setTimeout(() => {
            bot.chat(`/login ${passwordBot}`);
        }, 2000);

        // Anti-AFK Khusus (Sesuai plugin Essentials/TAB)
        const antiAfk = setInterval(() => {
            if (bot.entity) {
                bot.swingArm('right');
                // Menoleh sedikit ke kanan-kiri
                bot.look(bot.entity.yaw + 0.2, 0);
            }
        }, 30000);

        bot.once('end', () => clearInterval(antiAfk));
    });

    bot.on('error', (err) => {
        console.log(`[ERR] Masalah Jaringan: ${err.message}`);
        if (err.message.includes('ECONNREFUSED')) {
            console.log(`[HINT] Coba Restart Server Minecraft & Tunggu 2 menit.`);
        }
    });

    bot.on('end', (reason) => {
        console.log(`[DC] Bot Terputus: ${reason}. Nyambung lagi dalam 45 detik...`);
        // Jeda lama agar tidak terkena ban IP dari AuthMe/Firewall
        setTimeout(runBot, 45000); 
    });
};

runBot();
