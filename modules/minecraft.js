const mineflayer = require('mineflayer');

let mcBot = null;
let reconnectInterval = null;
let nicknameIndex = 0;

const nicknames = [
    'BotServer', 'MineBot01', 'PlayerBot', 'ServerHelper',
    'GameWatcher', 'AutoPlayer', 'MinecraftBot', 'AFKHelper',
    'BotPlayer', 'MineHelper', 'ServerBot', 'GameBot'
];

// Fungsi untuk delay random (agar tidak terdeteksi pattern)
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
    init: (client) => {
        console.log('🔄 Memulai koneksi Minecraft...');
        
        const connect = () => {
            const currentNickname = nicknames[nicknameIndex];
            
            console.log(`🎮 Mencoba connect sebagai: ${currentNickname}`);
            
            mcBot = mineflayer.createBot({
                host: 'BananaUcok.aternos.me',
                port: 14262,
                username: currentNickname,
                version: '1.20.1',
                auth: 'offline',
                checkTimeoutInterval: 60000
            });

            mcBot.on('login', () => {
                console.log(`✅ Bot MC terhubung sebagai: ${currentNickname}`);
                client.user.setActivity(`Main sebagai ${currentNickname}`, { type: 'PLAYING' });
                
                // Delay random sebelum whitelist
                setTimeout(() => {
                    mcBot.chat(`/whitelist add ${currentNickname}`);
                    setTimeout(() => {
                        mcBot.chat('Halo! Bot aktif 🎮');
                    }, 2000);
                }, randomDelay(3000, 8000));

                // 🔹 Enhanced Anti-AFK dengan variasi
                setInterval(() => {
                    if (!mcBot) return;
                    
                    const actions = [
                        () => { // Gerak maju
                            mcBot.setControlState('forward', true);
                            setTimeout(() => mcBot.setControlState('forward', false), 500);
                        },
                        () => { // Gerak samping
                            mcBot.setControlState('left', true);
                            setTimeout(() => mcBot.setControlState('left', false), 500);
                        },
                        () => { // Lompat
                            mcBot.setControlState('jump', true);
                            setTimeout(() => mcBot.setControlState('jump', false), 300);
                        }
                    ];
                    
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    randomAction();
                }, randomDelay(45000, 90000)); // 45-90 detik

                // 🔹 Chat dengan variasi pesan
                setInterval(() => {
                    if (!mcBot) return;
                    
                    const messages = [
                        'Masih di sini 😎',
                        'Lagi explore nih!',
                        'Server keren!',
                        'Minecraft is fun!',
                        'Auto AFK bot aktif',
                        'Main dulu guys...'
                    ];
                    
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    mcBot.chat(randomMessage);
                }, randomDelay(240000, 360000)); // 4-6 menit

                // 🔹 Putar kamera dengan pattern lebih natural
                setInterval(() => {
                    if (!mcBot) return;
                    const yaw = Math.random() * Math.PI * 2;
                    const pitch = (Math.random() - 0.5) * Math.PI / 2;
                    mcBot.look(yaw, pitch, false); // false = tidak instan
                }, randomDelay(60000, 120000)); // 1-2 menit
            });

            mcBot.on('error', err => {
                console.error('❌ Error MC:', err.message);
                scheduleReconnect();
            });

            mcBot.on('end', reason => {
                console.log(`🔌 Koneksi terputus: ${reason}`);
                handleDisconnect(reason);
            });

            mcBot.on('kicked', reason => {
                console.log(`🚪 Dikick: ${reason}`);
                handleDisconnect(reason);
            });

            // Fungsi handle disconnect
            const handleDisconnect = (reason) => {
                const lowerReason = reason.toLowerCase();
                
                if (lowerReason.includes('banned') || 
                    lowerReason.includes('idle') || 
                    lowerReason.includes('whitelist') ||
                    lowerReason.includes('kick')) {
                    
                    console.log('🔄 Terdeteksi masalah, ganti nickname...');
                    nicknameIndex = (nicknameIndex + 1) % nicknames.length;
                    console.log(`🆕 Nickname berikutnya: ${nicknames[nicknameIndex]}`);
                }
                
                scheduleReconnect();
            };
        };

        const scheduleReconnect = () => {
            if (reconnectInterval) clearInterval(reconnectInterval);
            
            const delay = randomDelay(25000, 45000); // 25-45 detik
            console.log(`⏳ Akan reconnect dalam ${delay/1000} detik...`);
            
            reconnectInterval = setTimeout(() => {
                console.log('♻️ Mencoba reconnect...');
                connect();
            }, delay);
        };

        connect();
    }
};
