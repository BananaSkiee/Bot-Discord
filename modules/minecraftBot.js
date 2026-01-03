const mineflayer = require('mineflayer');

const mcConfig = {
    host: 'empirebs.falixsrv.me',
    port: 37152,
    version: '1.21.1', // Gunakan versi Java 1.21.1
};

function generateRandomName() {
    // Nama random agar tidak dianggap bot yang sama saat login ulang
    const id = Math.floor(1000 + Math.random() * 9000);
    return `Banana_${id}`;
}

module.exports = function startMinecraftBot(client) {
    const username = generateRandomName();
    
    console.log(`[MC-BOT] 🔄 Mencoba login: ${username}`);

    const bot = mineflayer.createBot({
        host: mcConfig.host,
        port: mcConfig.port,
        username: username,
        version: mcConfig.version,
        // Bypass filter sederhana
        fakeHost: mcConfig.host,
        // Penyesuaian waktu koneksi untuk hosting Koyeb
        connectTimeout: 60000,
        checkTimeoutInterval: 60000,
        // Sembunyikan pesan error internal mineflayer yang tidak perlu
        hideErrors: true 
    });

    // Mencegah memory leak: Hapus semua listener saat bot terputus
    const cleanup = () => {
        bot.removeAllListeners();
        if (bot.afkInterval) clearInterval(bot.afkInterval);
    };

    bot.once('spawn', () => {
        console.log(`[MC-BOT] ✅ Bot ${bot.username} Berhasil Spawn!`);
        
        // Anti-AFK: Menggerakkan kepala setiap 20 detik
        bot.afkInterval = setInterval(() => {
            if (bot.entity) {
                bot.look(bot.entity.yaw + 0.5, 0);
            }
        }, 20000);
    });

    // Menangani Chat (Auto-Register/Login)
    bot.on('message', (message) => {
        const msg = message.toString();
        // Deteksi butuh register/login di server cracked
        if (msg.includes('/register')) {
            bot.chat('/register BananaBot123 BananaBot123');
        } else if (msg.includes('/login')) {
            bot.chat('/login BananaBot123');
        }
    });

    bot.on('end', (reason) => {
        console.warn(`[MC-BOT] ❌ Terputus: ${reason}`);
        cleanup();
        
        // Jeda 30 detik sebelum Re-login (Sangat penting di FalixSrv agar tidak kena IP Ban)
        setTimeout(() => {
            startMinecraftBot(client);
        }, 30000);
    });

    bot.on('error', (err) => {
        // Abaikan error koneksi standar agar console tetap bersih
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') return;
        console.error(`[MC-BOT] ⚠️ Error: ${err.message}`);
        cleanup();
    });
};
