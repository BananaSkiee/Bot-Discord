// modules/minecraftBot.js
const mineflayer = require('mineflayer');

const botName = 'RianGamerz';
const passwordBot = 'rahasia123'; 

const startBot = () => {
    const bot = mineflayer.createBot({
        host: 'empirebs.falixsrv.me',
        port: 37152,
        username: botName,
        version: '1.21.1',
        auth: 'offline',
        // Trik agar koneksi ringan & tidak timeout
        viewDistance: 'tiny', 
        checkTimeoutInterval: 60000 
    });

    bot.on('spawn', () => {
        console.log(`[STAY] Bot Berhasil Masuk!`);
        bot.chat(`/login ${passwordBot}`);
        
        // Gerakan super kecil setiap 10 detik agar koneksi tetap 'panas'
        setInterval(() => {
            if (bot.entity) {
                bot.look(bot.entity.yaw + 0.1, 0);
                // Kirim paket swing agar server tahu bot tidak nge-lag
                bot.swingArm('right'); 
            }
        }, 10000);
    });

    bot.on('end', (reason) => {
        console.log(`[DC] Putus karena: ${reason}. Login ulang...`);
        setTimeout(startBot, 5000); // Reconnect cepat
    });

    bot.on('error', (err) => console.log(`[ERR] ${err.message}`));
};

startBot();
                
