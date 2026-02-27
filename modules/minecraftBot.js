const mineflayer = require('mineflayer');

let bot = null;
let reconnectTimer = null;

module.exports = {
    init: () => {
        const startBot = () => {
            if (bot) {
                bot.end();
                bot = null;
            }

            console.log('[MC] Menghubungkan EmpireBS...');
            
            bot = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: 'EmpireBS',
                version: '1.21.1',
                viewDistance: 'tiny'
            });

            bot.once('spawn', () => {
                console.log('[MC] ✅ Bot online');
                
                // Login 1x
                setTimeout(() => {
                    bot.chat('/register BananaSkiee BananaSkiee');
                    bot.chat('/login BananaSkiee');
                    console.log('[MC] 🔐 Login dikirim');
                }, 3000);
                
                // Anti-AFK tiap 30 detik
                setInterval(() => {
                    if (!bot) return;
                    bot.setControlState('jump', true);
                    setTimeout(() => bot.setControlState('jump', false), 200);
                }, 30000);
            });

            bot.on('kicked', (reason) => {
                console.log('[MC] ⛔ Kicked:', reason.toString().substring(0, 50));
                scheduleReconnect();
            });

            bot.on('error', (err) => {
                console.log('[MC] ❌ Error:', err.message);
                scheduleReconnect();
            });

            bot.on('end', () => {
                console.log('[MC] 🔌 Disconnected');
                scheduleReconnect();
            });
        };

        const scheduleReconnect = () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(startBot, 30000);
        };

        startBot();
    }
};
