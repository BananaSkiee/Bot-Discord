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
        console.log('[MC-BOT] 🔄 Memulai koneksi khusus versi 1.21.11...');
        
        const connect = () => {
            const currentNickname = nicknames[nicknameIndex];
            console.log(`[MC-BOT] 🎮 Mencoba connect: ${currentNickname}`);
            
            if (mcBot) {
                mcBot.removeAllListeners();
                try { mcBot.end(); } catch (e) {}
            }

            mcBot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: currentNickname,
                // Gunakan false agar bot mendeteksi versi otomatis dari server 1.21.11
                version: false, 
                auth: 'offline',
                // --- FIX 1.21.11 / GEYSER HANDSHAKE ---
                disableChatSigning: true,
                checkTimeoutInterval: 120000,
                viewDistance: 'tiny',
                skipValidation: true,
                // Memaksa bot mengabaikan error paket saat login 1.21.11
                hideErrors: true 
            });

            mcBot.on('login', () => {
                console.log(`[MC-BOT] ✅ Berhasil Masuk ke 1.21.11 sebagai: ${currentNickname}`);
                
                setTimeout(() => {
                    if (mcBot) mcBot.chat('Bot Akira Online! Support v1.21.11 🎮');
                }, 10000);

                // Anti-AFK
                const afkInterval = setInterval(() => {
                    if (!mcBot || !mcBot.entity) return;
                    mcBot.setControlState('jump', true);
                    setTimeout(() => mcBot.setControlState('jump', false), 500);
                }, randomDelay(40000, 70000));

                mcBot.once('end', () => clearInterval(afkInterval));
            });

            mcBot.on('error', err => {
                if (!err.message.includes('socketClosed')) {
                    console.error('[MC-BOT] ❌ Error:', err.message);
                }
            });

            mcBot.on('kicked', reason => {
                console.log(`[MC-BOT] 🚪 Kick Reason: ${reason}`);
                handleRotation();
            });

            mcBot.on('end', reason => {
                console.log(`[MC-BOT] 🔌 Putus dari server: ${reason}`);
                handleRotation();
            });

            const handleRotation = () => {
                nicknameIndex = (nicknameIndex + 1) % nicknames.length;
                console.log(`[MC-BOT] 🔄 Rotasi ke: ${nicknames[nicknameIndex]}`);
                scheduleReconnect();
            };
        };

        const scheduleReconnect = () => {
            if (reconnectInterval) clearTimeout(reconnectInterval);
            const delay = randomDelay(30000, 50000); 
            console.log(`[MC-BOT] ⏳ Reconnect dalam ${Math.floor(delay/1000)} detik...`);
            reconnectInterval = setTimeout(connect, delay);
        };

        connect();
    }
};
