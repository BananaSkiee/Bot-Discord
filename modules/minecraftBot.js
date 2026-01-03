const mineflayer = require('mineflayer');

let mcBot = null;
let reconnectInterval = null;
let nicknameIndex = 0;

// Daftar nickname untuk rotasi jika terkena kick/ban
const nicknames = [
    'Banana_Ucok', 'Ucok_Gamer', 'Akira_Helper', 'Member_Skiee',
    'Empire_Bot', 'Ucok_Player', 'Banana_Skiee', 'Helper_BS',
    'Akira_Bot', 'Empire_Player', 'Skiee_Watcher', 'Banana_Pro'
];

// Fungsi untuk delay random (agar tidak terdeteksi mesin)
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
    init: (client) => {
        console.log('[MC-BOT] 🔄 Memulai sistem koneksi rotasi...');
        
        const connect = () => {
            const currentNickname = nicknames[nicknameIndex];
            
            console.log(`[MC-BOT] 🎮 Mencoba connect: ${currentNickname}`);
            
            mcBot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: currentNickname,
                version: '1.21.11',
                auth: 'offline',
                checkTimeoutInterval: 90000,
                disableChatSigning: true, // Bypass error 'void future'
            });

            mcBot.on('login', () => {
                console.log(`[MC-BOT] ✅ Terhubung sebagai: ${currentNickname}`);
                
                // Variasi aktivitas saat login
                setTimeout(() => {
                    mcBot.chat('Halo semua! Bot BananaSkiee aktif 🎮');
                }, randomDelay(5000, 10000));

                // 🔹 Enhanced Anti-AFK (Gerakan Fisik)
                const moveInterval = setInterval(() => {
                    if (!mcBot || !mcBot.entity) return;
                    
                    const actions = [
                        () => { // Maju
                            mcBot.setControlState('forward', true);
                            setTimeout(() => mcBot.setControlState('forward', false), 400);
                        },
                        () => { // Samping
                            mcBot.setControlState('left', true);
                            setTimeout(() => mcBot.setControlState('left', false), 400);
                        },
                        () => { // Lompat
                            mcBot.setControlState('jump', true);
                            setTimeout(() => mcBot.setControlState('jump', false), 300);
                        }
                    ];
                    
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    randomAction();
                }, randomDelay(40000, 80000));

                // 🔹 Chat Variasi (Promosi/Status)
                const chatInterval = setInterval(() => {
                    if (!mcBot) return;
                    const messages = [
                        'Servernya keren banget! 🔥',
                        'Lagi mantau member nih..',
                        'Cek Discord kita: dsc.gg/BananaSkiee',
                        'Bot Akira siap melayani!',
                        'Jangan lupa join community!',
                        'Tetap semangat mainnya guys!'
                    ];
                    mcBot.chat(messages[Math.floor(Math.random() * messages.length)]);
                }, randomDelay(300000, 600000)); // 5-10 menit

                // 🔹 Natural Look (Putar Kamera)
                const lookInterval = setInterval(() => {
                    if (!mcBot) return;
                    const yaw = Math.random() * Math.PI * 2;
                    const pitch = (Math.random() - 0.5) * Math.PI / 2;
                    mcBot.look(yaw, pitch, false);
                }, randomDelay(50000, 100000));

                // Bersihkan interval saat bot mati
                mcBot.once('end', () => {
                    clearInterval(moveInterval);
                    clearInterval(chatInterval);
                    clearInterval(lookInterval);
                });
            });

            mcBot.on('error', err => {
                if (err.code !== 'ECONNRESET') {
                    console.error('[MC-BOT] ❌ Error:', err.message);
                }
                scheduleReconnect();
            });

            mcBot.on('end', reason => {
                console.log(`[MC-BOT] 🔌 Putus: ${reason}`);
                handleDisconnect(reason);
            });

            mcBot.on('kicked', reason => {
                console.log(`[MC-BOT] 🚪 Dikick: ${reason}`);
                handleDisconnect(reason);
            });

            const handleDisconnect = (reason) => {
                const r = reason.toString().toLowerCase();
                // Jika kena kick atau masalah serius, ganti nickname
                if (r.includes('kick') || r.includes('ban') || r.includes('socketclosed') || r.includes('future')) {
                    nicknameIndex = (nicknameIndex + 1) % nicknames.length;
                    console.log(`[MC-BOT] 🔄 Rotasi nickname ke: ${nicknames[nicknameIndex]}`);
                }
                scheduleReconnect();
            };
        };

        const scheduleReconnect = () => {
            if (reconnectInterval) clearTimeout(reconnectInterval);
            const delay = randomDelay(30000, 50000); // 30-50 detik agar tidak IP Ban
            console.log(`[MC-BOT] ⏳ Reconnect dalam ${delay/1000} detik...`);
            reconnectInterval = setTimeout(() => {
                connect();
            }, delay);
        };

        connect();
    }
};
