const mineflayer = require('mineflayer');

// Daftar IP Server
const serverConfig = {
    host: 'empirebs.falixsrv.me', 
    port: 37152,
    version: '1.20.1'
};

// Fungsi untuk menghasilkan nama acak (misal: Player_1234)
function generateRandomName() {
    const prefix = "User"; // Awalan nama
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Angka acak 4 digit
    return `${prefix}_${randomDigits}`;
}

function createBot() {
    const currentName = generateRandomName();
    
    console.log(`[SYSTEM] Mencoba masuk dengan nama baru: ${currentName}`);

    const bot = mineflayer.createBot({
        host: serverConfig.host,
        port: serverConfig.port,
        username: currentName,
        version: serverConfig.version
    });

    bot.on('login', () => {
        console.log(`[SUCCESS] Bot berhasil join sebagai: ${bot.username}`);
    });

    bot.on('spawn', () => {
        // Anti-AFK Sederhana agar tidak kena kick karena diam
        setInterval(() => {
            bot.look(Math.random() * 6.28, (Math.random() - 0.5) * 1.5);
        }, 15000);
    });

    // Kejadian jika bot keluar, di-kick, atau server restart
    bot.on('end', (reason) => {
        console.log(`[KICKED/DISCONNECT] Bot keluar karena: ${reason}`);
        console.log(`[WAIT] Menunggu 15 detik sebelum masuk dengan nama baru...`);
        
        // Menunggu sebentar agar IP tidak dianggap spamming/flooding
        setTimeout(() => {
            createBot(); 
        }, 15000);
    });

    bot.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log(`[ERROR] Gagal konek ke ${err.address}, mencoba lagi...`);
        } else {
            console.log(`[ERROR] Terjadi kesalahan: ${err.message}`);
        }
    });
}

// Jalankan bot untuk pertama kali
createBot();
