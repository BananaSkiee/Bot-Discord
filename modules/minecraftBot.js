const mineflayer = require('mineflayer');

let mcBot = null;
let reconnectInterval = null;
let nicknameIndex = 0;

const nicknames = [
    'Banana_Ucok', 'Ucok_Gamer', 'Akira_Helper', 'Member_Skiee',
    'Empire_Bot', 'Ucok_Player', 'Banana_Skiee', 'Helper_BS',
    'Akira_Bot', 'Empire_Player', 'Skiee_Watcher', 'Banana_Pro'
];

const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
    init: (client) => {
        console.log('[MC-BOT] 🔄 Memulai koneksi ke Paper 1.21.1...');
        
        const connect = () => {
            const currentNickname = nicknames[nicknameIndex];
            console.log(`[MC-BOT] 🎮 Mencoba masuk: ${currentNickname}`);
            
            // Bersihkan instance lama jika ada
            if (mcBot) {
                mcBot.removeAllListeners();
                try { mcBot.quit(); } catch (e) {}
            }

            mcBot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: currentNickname,
                version: '1.21.1', // Paksa versi ke 1.21.1 (Java Paper)
                auth: 'offline',
                // Opsi krusial untuk Paper 1.21.1
                disableChatSigning: true, 
                checkTimeoutInterval: 90000,
                viewDistance: 'tiny',
                skipValidation: true
            });

            mcBot.on('login', () => {
                console.log(`[MC-BOT] ✅ Berhasil masuk ke Paper Server sebagai: ${currentNickname}`);
                
                // Greeting setelah 10 detik agar tidak dikira spam oleh Paper
                setTimeout(() => {
                    if (mcBot) mcBot.chat('Halo! Bot BananaSkiee siap menjaga server 1.21.1! 🛡️');
                }, 10000);

                // Anti-AFK (Melompat setiap 40-70 detik)
                const afkInterval = setInterval(() => {
                    if (!mcBot || !mcBot.entity) return;
                    mcBot.setControlState('jump', true);
                    setTimeout(() => mcBot.setControlState('jump', false), 500);
                }, randomDelay(40000, 70000));

                mcBot.once('end', () => clearInterval(afkInterval));
            });

            mcBot.on('error', err => {
                // Jangan log error socketClosed agar console tidak penuh
                if (!err.message.includes('socketClosed') && !err.message.includes('ECONNRESET')) {
                    console.error('[MC-BOT] ❌ Error:', err.message);
                }
            });

            mcBot.on('kicked', reason => {
                console.log(`[MC-BOT] 🚪 Dikick: ${reason}`);
                handleRotation();
            });

            mcBot.on('end', (reason) => {
                console.log(`[MC-BOT] 🔌 Koneksi terputus: ${reason}`);
                handleRotation();
            });

            const handleRotation = () => {
                // Rotasi nickname jika gagal login/terputus
                nicknameIndex = (nicknameIndex + 1) % nicknames.length;
                console.log(`[MC-BOT] 🔄 Rotasi identitas baru: ${nicknames[nicknameIndex]}`);
                scheduleReconnect();
            };
        };

        const scheduleReconnect = () => {
            if (reconnectInterval) clearTimeout(reconnectInterval);
            const delay = randomDelay(30000, 50000); // Tunggu 30-50 detik
            console.log(`[MC-BOT] ⏳ Menghubungkan kembali dalam ${Math.floor(delay/1000)} detik...`);
            reconnectInterval = setTimeout(connect, delay);
        };

        connect();
    }
};
