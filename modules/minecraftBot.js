const mineflayer = require('mineflayer');

let mcBot = null;
let reconnectTimeout = null;

// Fungsi untuk membuat nama acak agar tidak terkena ban nama yang sama
const generateRandomName = () => {
    const prefixes = ['Banana', 'Ucok', 'Akira', 'Guest'];
    const randomId = Math.floor(Math.random() * 9000) + 1000;
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}_${randomId}`;
};

const startBot = (client) => {
    // Bersihkan timeout jika ada untuk mencegah double connection
    if (reconnectTimeout) clearTimeout(reconnectTimeout);

    const botName = generateRandomName();
    console.log(`[MC-BOT] 🔄 Mencoba login dengan nama baru: ${botName}`);

    mcBot = mineflayer.createBot({
        host: 'empirebs.falixsrv.me', // IP Server kamu
        port: 37152,                // Port Server kamu
        username: botName,
        version: '1.21.1',          // Sesuaikan dengan versi Java server
        auth: 'offline',
        checkTimeoutInterval: 90000, // Lebih lama agar stabil di hosting
        connectTimeout: 90000
    });

    // --- EVENT HANDLERS ---

    mcBot.once('spawn', () => {
        console.log(`[MC-BOT] ✅ Berhasil masuk sebagai: ${mcBot.username}`);
        
        // Anti-AFK Sederhana: Gerakan kepala random setiap 20 detik
        const afkInterval = setInterval(() => {
            if (mcBot.entity) {
                mcBot.look(Math.random() * 6.2, (Math.random() - 0.5) * 1);
            } else {
                clearInterval(afkInterval);
            }
        }, 20000);
    });

    // Menangani Auto-Auth (Register/Login) jika server memintanya
    mcBot.on('message', (message) => {
        const msg = message.toString();
        if (msg.includes('/register')) {
            mcBot.chat('/register Banana123 Banana123');
        } else if (msg.includes('/login')) {
            mcBot.chat('/login Banana123');
        }
    });

    mcBot.on('error', (err) => {
        // Abaikan error koneksi standar agar tidak spam log
        if (err.code !== 'ECONNRESET' && err.code !== 'ECONNREFUSED') {
            console.error(`[MC-BOT] ⚠️ Error: ${err.message}`);
        }
    });

    mcBot.on('end', (reason) => {
        console.log(`[MC-BOT] 🔌 Terputus (${reason}). Mengganti nama & reconnect...`);
        
        // Bersihkan listener bot lama
        mcBot.removeAllListeners();
        
        // Penanganan Reconnect otomatis (Ganti Nama Baru)
        reconnectTimeout = setTimeout(() => {
            startBot(client);
        }, 30000); // Jeda 30 detik agar IP tidak dianggap flood/spam
    });
};

module.exports = {
    init: (client) => {
        startBot(client);
    }
};
