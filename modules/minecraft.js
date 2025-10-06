const mineflayer = require('mineflayer');
const { EmbedBuilder } = require('discord.js');

let mcBot = null;
let reconnectInterval = null;

module.exports = {
    init: (client) => {
        console.log('🔄 Memulai koneksi Minecraft...');
        
        const connect = () => {
            mcBot = mineflayer.createBot({
                host: 'BananaUcok.aternos.me',
                port: 14262,
                username: 'BotServer',
                version: '1.20.1',
                auth: 'offline',
                checkTimeoutInterval: 60000
            });

            mcBot.on('login', () => {
                console.log('✅ Bot MC terhubung!');
                client.user.setActivity('Main di Aternos', { type: 'PLAYING' });
                
                setTimeout(() => {
                    mcBot.chat('/whitelist add BotServer');
                    mcBot.chat('Bot aktif!');
                }, 5000);

                // 🔹 Anti-AFK: gerak tiap menit
                setInterval(() => {
                    if (!mcBot) return;
                    mcBot.setControlState('forward', true);
                    setTimeout(() => mcBot.setControlState('forward', false), 500);
                }, 60000);

                // 🔹 Lompat tiap 2 menit
                setInterval(() => {
                    if (!mcBot) return;
                    mcBot.setControlState('jump', true);
                    setTimeout(() => mcBot.setControlState('jump', false), 300);
                }, 120000);

                // 🔹 Chat tiap 5 menit
                setInterval(() => {
                    if (mcBot) mcBot.chat('Masih di sini 😎');
                }, 300000);

                // 🔹 Putar kamera setiap 90 detik
                setInterval(() => {
                    if (!mcBot) return;
                    const yaw = Math.random() * Math.PI * 2; // 0 - 360 derajat
                    const pitch = (Math.random() - 0.5) * Math.PI / 2; // atas/bawah
                    mcBot.look(yaw, pitch, true);
                }, 90000);
            });

            mcBot.on('error', err => {
                console.error('❌ Error MC:', err.message);
                scheduleReconnect();
            });

            mcBot.on('end', reason => {
                console.log(`🔌 Koneksi terputus: ${reason}`);
                scheduleReconnect();
            });

            mcBot.on('kicked', reason => {
                console.log(`🚪 Dikick: ${reason}`);
                scheduleReconnect();
            });
        };

        const scheduleReconnect = () => {
            if (reconnectInterval) clearInterval(reconnectInterval);
            console.log('⏳ Akan reconnect dalam 30 detik...');
            reconnectInterval = setTimeout(() => {
                console.log('♻️ Mencoba reconnect...');
                connect();
            }, 30000);
        };

        connect();
    }
};
