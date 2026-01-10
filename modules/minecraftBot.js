const mineflayer = require('mineflayer');

const botData = [
    { name: 'EmpireBS', stay: true },       // Admin/Owner
    { name: 'SkyWarrior88', stay: false },  // UltraVIP
    { name: 'NeonVibes', stay: false },     // MegaVIP
    { name: 'ZexyQuantum', stay: false },   // VIP+
    { name: 'LunarPanda', stay: false },    // VIP
    { name: 'FrostByte', stay: false },     // Legend
    { name: 'VortexChaser', stay: false },  // Player
    { name: 'BlazeKnight', stay: false },   // Player
    { name: 'MysticRune', stay: false },    // Hero
    { name: 'ShadowStorm', stay: false }    // Player
];

let activeBots = {};

module.exports = {
    init: (client) => {
        const startBot = (data) => {
            if (activeBots[data.name]) return;

            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: data.name,
                version: '1.20.1',
                auth: 'offline'
            });

            bot.on('spawn', () => {
                console.log(`[SIM] 👤 ${data.name} masuk.`);
                
                setTimeout(() => {
                    if (bot) {
                        bot.chat(`/register BananaSkiee BananaSkiee`);
                        bot.chat(`/login BananaSkiee`);
                    }
                }, 5000);

                // Gerakan natural saja tanpa chat
                const movementInterval = setInterval(() => {
                    if (bot.entity) {
                        if (Math.random() > 0.7) bot.setControlState('jump', true);
                        setTimeout(() => bot.setControlState('jump', false), 500);
                        bot.look(bot.entity.yaw + (Math.random() * 1.2 - 0.6), 0);
                    }
                }, 35000);

                if (!data.stay) {
                    const playDuration = (Math.floor(Math.random() * 60) + 30) * 60000;
                    setTimeout(() => { bot.quit(); }, playDuration);
                }

                bot.once('end', () => clearInterval(movementInterval));
            });

            bot.on('end', () => {
                delete activeBots[data.name];
                if (data.stay) setTimeout(() => startBot(data), 15000);
            });

            activeBots[data.name] = bot;
        };

        // Cek Populasi
        setInterval(() => {
            botData.forEach((data, index) => {
                setTimeout(() => {
                    if (!activeBots[data.name] && Math.random() > 0.6) startBot(data);
                }, index * 20000);
            });
        }, 600000);

        botData.forEach((data, index) => {
            if (data.stay || index < 4) {
                setTimeout(() => startBot(data), index * 15000);
            }
        });
    }
};
