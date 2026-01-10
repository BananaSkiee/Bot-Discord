const mineflayer = require('mineflayer');

const botData = [
    { name: 'EmpireBS', stay: true, rank: 'owner' }, 
    // STAFF (Helper, Mod, Dev, Build)
    { name: 'KaelZentic', stay: false, rank: 'helper' },
    { name: 'VortexNode', stay: false, rank: 'helper' },
    { name: 'RyuzakiKy', stay: false, rank: 'mod' },
    { name: 'Zandervic', stay: false, rank: 'dev' },
    { name: 'AxelBuilds', stay: false, rank: 'build' },
    // MEDIA (YT & Twitch)
    { name: 'RianGamerz', stay: false, rank: 'yt' },
    { name: 'KiraZen', stay: false, rank: 'twitch' },
    // DONATUR (Legend, Hero, Ultra, Mega, VIP)
    { name: 'NovaAstral', stay: false, rank: 'legend' },
    { name: 'BlazeForce', stay: false, rank: 'hero' },
    { name: 'NeonPulse', stay: false, rank: 'ultravip' },
    { name: 'StormVibe', stay: false, rank: 'megavip' },
    { name: 'FrostbyteKy', stay: false, rank: 'vip' },
    // PLAYER (Member Biasa - Paling sering ganti-gantian)
    { name: 'SkyzFlare', stay: false, rank: 'player' },
    { name: 'Aetheris', stay: false, rank: 'player' },
    { name: 'ZenixPVP', stay: false, rank: 'player' },
    { name: 'LuminaRay', stay: false, rank: 'player' },
    { name: 'DuskWalker', stay: false, rank: 'player' },
    { name: 'VeloCity9', stay: false, rank: 'player' },
    { name: 'HydraZen', stay: false, rank: 'player' }
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
                console.log(`[SIM] 👤 ${data.name} Joined.`);
                
                const pw = "EmpireBSBananaSkiee";
                setTimeout(() => {
                    if (bot) {
                        bot.chat(`/register ${pw} ${pw}`);
                        bot.chat(`/login ${pw}`);
                    }
                }, 5000);

                // Anti-AFK
                const moveInterval = setInterval(() => {
                    if (bot.entity) {
                        if (Math.random() > 0.8) bot.setControlState('jump', true);
                        setTimeout(() => bot.setControlState('jump', false), 500);
                        bot.look(bot.entity.yaw + (Math.random() * 2 - 1), 0);
                    }
                }, 30000);

                // Durasi Online Otomatis
                if (!data.stay) {
                    // Bot Player & Helper lebih lama (1-2 jam)
                    // Rank tinggi lebih sebentar (30-60 menit) agar terkesan eksklusif
                    const duration = ['player', 'helper'].includes(data.rank) 
                        ? (Math.floor(Math.random() * 60) + 60) * 60000 
                        : (Math.floor(Math.random() * 30) + 30) * 60000;

                    setTimeout(() => { if (bot) bot.quit(); }, duration);
                }

                bot.once('end', () => clearInterval(moveInterval));
            });

            bot.on('end', () => {
                delete activeBots[data.name];
                if (data.stay) setTimeout(() => startBot(data), 20000);
            });

            activeBots[data.name] = bot;
        };

        // LOOP SISTEM POPULASI (Cek setiap 10 menit)
        setInterval(() => {
            const onlineCount = Object.keys(activeBots).length;
            botData.forEach((data, index) => {
                setTimeout(() => {
                    if (activeBots[data.name]) return;

                    let chance = 0.2; // Default 20%
                    if (data.rank === 'player') chance = 0.6; // Player dominan
                    if (data.rank === 'helper' && onlineCount < 6) chance = 0.7; // Helper jaga server sepi
                    if (['yt', 'twitch'].includes(data.rank) && onlineCount > 10) chance = 0.5; // Media muncul kalau rame

                    if (Math.random() < chance) startBot(data);
                }, index * 10000);
            });
        }, 600000);

        // Startup: Langsung masukkan 1 Admin + 3 Player + 1 Helper
        botData.forEach((data, index) => {
            if (data.stay || index < 5) {
                setTimeout(() => startBot(data), index * 12000);
            }
        });
    }
};
