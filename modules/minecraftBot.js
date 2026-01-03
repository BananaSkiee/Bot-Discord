const mineflayer = require('mineflayer');

const mcConfig = {
    host: 'empirebs.falixsrv.me', 
    port: 37152,
    version: '1.21.1', // Sesuaikan dengan base version Java servernya
};

function generateRandomName() {
    // Menggunakan prefix berbeda agar tidak dianggap spam bot yang sama
    const prefixes = ["Member", "Guest", "Player", "Banana"];
    const randomPref = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomId = Math.floor(100 + Math.random() * 900);
    return `${randomPref}_${randomId}`;
}

module.exports = function startMinecraftBot(client) {
    const username = generateRandomName();
    
    console.log(`[MC-BOT] 🔄 Mencoba masuk ke FalixSrv: ${username}`);

    const bot = mineflayer.createBot({
        host: mcConfig.host,
        port: mcConfig.port,
        username: username,
        version: mcConfig.version,
        // Penting untuk server hosting seperti Falix:
        checkTimeoutInterval: 60000,
        connectTimeout: 60000,
        hideErrors: false
    });

    bot.on('login', () => {
        console.log(`[MC-BOT] ✅ Berhasil masuk sebagai ${bot.username}`);
    });

    bot.on('spawn', () => {
        console.log(`[MC-BOT] 📍 Bot telah spawn di lobby/dunia.`);
        
        // Anti-AFK yang lebih halus
        const afkTask = setInterval(() => {
            if (!bot) return clearInterval(afkTask);
            
            // Gerakan kepala random
            bot.look(Math.random() * 6.2, (Math.random() - 0.5) * 1, false);
            
            // Lompat kecil 20% kemungkinan agar tidak terdeteksi mesin
            if (Math.random() > 0.8) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 400);
            }
        }, 25000);
    });

    bot.on('end', (reason) => {
        // Jika alasan kick adalah 'kicked', 'ban', atau 'socketClosed'
        console.warn(`[MC-BOT] ⚠️ Terputus: ${reason}`);
        
        bot.removeAllListeners();
        
        // Jeda 20 detik sebelum ganti nama & masuk lagi (agar IP tidak kena rate limit Falix)
        console.log(`[MC-BOT] ⏳ Menunggu 20 detik sebelum Re-login...`);
        setTimeout(() => {
            startMinecraftBot(client);
        }, 20000);
    });

    bot.on('error', (err) => {
        console.error(`[MC-BOT] ❌ Error detail: ${err.message}`);
    });
};
