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
        console.log('[MC-BOT] 🔄 Menghubungkan ke Server Java v1.21.10...');
        
        const connect = () => {
            const currentNickname = nicknames[nicknameIndex];
            console.log(`[MC-BOT] 🎮 Mencoba login: ${currentNickname}`);
            
            if (mcBot) {
                mcBot.removeAllListeners();
                try { mcBot.end(); } catch (e) {}
            }

            mcBot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: currentNickname,
                // Gunakan false agar Mineflayer melakukan auto-negotiation versi 1.21.10
                version: false, 
                auth: 'offline',
                // --- PENANGANAN KHUSUS PROTOKOL 1.21.10 ---
                disableChatSigning: true,
                checkTimeoutInterval: 120000,
                viewDistance: 'tiny',
                skipValidation: true,
                // Mengabaikan error paket transisi versi
                hideErrors: true 
            });

            mcBot.on('login', () => {
                console.log(`[MC-BOT] ✅ Sukses! Terhubung ke 1.21.10 sebagai: ${currentNickname}`);
                
                setTimeout(() => {
                    if (mcBot) mcBot.chat('Bot Akira siap! Mendukung Java 1.21.10 🎮');
                }, 10000);

                // Anti-AFK Gerak
                const afkInterval = setInterval(() => {
                    if (!mcBot || !mcBot.entity) return;
                    mcBot.setControlState('jump', true);
                    setTimeout(() => mcBot.setControlState('jump', false), 500);
                }, randomDelay(40000, 80000));

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

            mcBot.on('end', (reason) => {
                console.log(`[MC-BOT] 🔌 Putus: ${reason}`);
                handleRotation();
            });

            const handleRotation = () => {
                nicknameIndex = (nicknameIndex + 1) % nicknames.length;
                console.log(`[MC-BOT] 🔄 Rotasi identitas ke: ${nicknames[nicknameIndex]}`);
                scheduleReconnect();
            };
        };

        const scheduleReconnect = () => {
            if (reconnectInterval) clearTimeout(reconnectInterval);
            const delay = randomDelay(35000, 55000); 
            console.log(`[MC-BOT] ⏳ Menunggu ${Math.floor(delay/1000)} detik sebelum coba lagi...`);
            reconnectInterval = setTimeout(connect, delay);
        };

        connect();
    }
};
