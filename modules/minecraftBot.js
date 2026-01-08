const mineflayer = require('mineflayer');

const botOptions = {
    host: 'empirebs.falixsrv.me',
    port: 37152,
    username: 'RianGamerz',
    version: '1.21.1',
    auth: 'offline',
    // --- SETTING ANTI-BLOCK ---
    viewDistance: 'tiny',          // Download data sangat sedikit
    colorsEnabled: false,          // Matikan fitur warna chat
    loadInternalScoreboards: false,// Kurangi trafik data
    checkTimeoutInterval: 120000   // Beri waktu napas panjang bagi bot
};

let retryCount = 0;

function startBot() {
    console.log(`[SYSTEM] Mencoba koneksi ke- ${retryCount + 1}`);
    const bot = mineflayer.createBot(botOptions);

    bot.once('spawn', () => {
        retryCount = 0; // Reset hitungan jika berhasil masuk
        console.log("✅ Bot Berhasil Masuk! Mengirim login...");
        bot.chat('/login BananaSkiee');
    });

    bot.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log("⚠️ IP kamu mungkin sedang 'cool-down' oleh firewall Falix.");
        }
    });

    bot.on('end', (reason) => {
        retryCount++;
        // Jeda Reconnect yang dinamis (makin sering gagal, makin lama nunggunya)
        let waitTime = Math.min(1000 * 60 * 5, 30000 * retryCount); 
        console.log(`🔌 Terputus: ${reason}. Nunggu ${waitTime/1000} detik biar ga di-ban...`);
        
        setTimeout(startBot, waitTime);
    });
}

startBot();
