const mineflayer = require('mineflayer');

const botOptions = {
    host: 'empirebs.falixsrv.me',
    port: 37152,
    username: 'RianGamerz',
    version: '1.21.1',
    auth: 'offline',
    // Skip resource pack agar bot tidak berat/crash saat join
    skipValidation: true,
    // Agar bot tidak dianggap idle oleh server
    checkTimeoutInterval: 60000 
};

function startBot() {
    const bot = mineflayer.createBot(botOptions);

    // Otomatis terima resource pack kalau server maksa
    bot.on('resource_pack', (url, hash) => {
        bot.acceptResourcePack();
    });

    bot.on('spawn', () => {
        console.log("✅ RianGamerz (OP Level 4) Berhasil Masuk!");
        
        // Login AuthMe
        bot.chat('/login BananaSkiee');

        // ANTI-IDLE: Karena di server.properties timeout=10, 
        // bot harus gerak setiap beberapa menit.
        setInterval(() => {
            if (bot.entity) {
                // Melompat dan menoleh sedikit
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
                bot.look(bot.entity.yaw + 0.5, 0);
            }
        }, 60000); // Gerak setiap 1 menit
    });

    bot.on('error', (err) => {
        console.log(`❌ Error: ${err.message}`);
        if (err.code === 'ECONNREFUSED') {
            console.log("⚠️ Server menolak koneksi. Coba ganti player-idle-timeout ke 0 di server.properties.");
        }
    });

    bot.on('end', (reason) => {
        console.log(`🔌 Terputus: ${reason}. Reconnect dalam 30 detik...`);
        setTimeout(startBot, 30000);
    });
}

startBot();
