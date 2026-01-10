const mineflayer = require('mineflayer');

const botData = [
    { name: 'EmpireBS', stay: true, rank: 'owner' }, // OWNER SELALU STAY
    { name: 'KaelZentic', stay: false, rank: 'helper' },
    { name: 'VortexNode', stay: false, rank: 'helper' },
    { name: 'RyuzakiKy', stay: false, rank: 'mod' },
    { name: 'Zandervic', stay: false, rank: 'dev' },
    { name: 'AxelBuilds', stay: false, rank: 'build' },
    { name: 'RianGamerz', stay: false, rank: 'yt' },
    { name: 'KiraZen', stay: false, rank: 'twitch' },
    { name: 'NovaAstral', stay: false, rank: 'legend' },
    { name: 'BlazeForce', stay: false, rank: 'hero' },
    { name: 'NeonPulse', stay: false, rank: 'ultravip' },
    { name: 'StormVibe', stay: false, rank: 'megavip' },
    { name: 'FrostbyteKy', stay: false, rank: 'vip' },
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
                // PENYESUAIAN PASSWORD KHUSUS EMPIREBS
                const pw = (data.name === 'EmpireBS') ? "BananaSkiee" : "EmpireBSBananaSkiee";
                
                setTimeout(() => {
                    if (bot) {
                        bot.chat(`/login ${pw}`);
                        bot.chat(`/register ${pw} ${pw}`);
                    }
                }, 8000); 

                const moveInterval = setInterval(() => {
                    if (bot.entity) {
                        bot.look(bot.entity.yaw + (Math.random() * 0.5 - 0.25), 0);
                    }
                }, 60000);

                if (!data.stay) {
                    const playDuration = (Math.floor(Math.random() * 120) + 60) * 60000;
                    setTimeout(() => { 
                        if (bot) {
                            bot.quit();
                            console.log(`[SIM] ${data.name} selesai bermain.`);
                        }
                    }, playDuration);
                }

                bot.once('end', () => clearInterval(moveInterval));
            });

            bot.on('end', () => {
                delete activeBots[data.name];
                if (data.stay) {
                    setTimeout(() => startBot(data), 15000);
                }
            });

            activeBots[data.name] = bot;
        };

        setInterval(() => {
            botData.forEach((data) => {
                if (data.stay || activeBots[data.name]) return;
                if (Math.random() < 0.2) {
                    const delayJoin = Math.floor(Math.random() * 600000);
                    setTimeout(() => startBot(data), delayJoin);
                }
            });
        }, 1800000); 

        startBot(botData[0]); 
    }
};
