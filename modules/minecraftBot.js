const mineflayer = require('mineflayer');

let mcBot = null;
let reconnectTimeout = null;

const generateRandomName = () => {
    return `Banana_${Math.floor(1000 + Math.random() * 8999)}`;
};

const startBot = (client) => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);

    const botName = generateRandomName();
    console.log(`[MC-BOT] 🔄 Mencoba login: ${botName}`);

    mcBot = mineflayer.createBot({
        host: 'empirebs.falixsrv.me',
        port: 37152,
        username: botName,
        version: '1.21.1',
        auth: 'offline',
        // --- SETTING BYPASS ---
        hideErrors: true,
        checkTimeoutInterval: 60000,
        disableChatSigning: true, // SANGAT PENTING: Bypass void future
    });

    mcBot.once('spawn', () => {
        console.log(`[MC-BOT] ✅ Berhasil masuk: ${mcBot.username}`);
        
        // Anti-AFK
        const afk = setInterval(() => {
            if (mcBot.entity) mcBot.look(mcBot.entity.yaw + 0.1, 0);
        }, 25000);

        mcBot.on('end', () => clearInterval(afk));
    });

    mcBot.on('error', (err) => {
        if (err.code === 'ECONNRESET') return;
        console.log(`[MC-BOT] ⚠️ Error: ${err.message}`);
    });

    mcBot.on('end', (reason) => {
        console.log(`[MC-BOT] 🔌 Putus (${reason}). Reconnecting 30s...`);
        mcBot.removeAllListeners();
        reconnectTimeout = setTimeout(() => startBot(client), 30000);
    });
};

module.exports = {
    init: (client) => {
        startBot(client);
    }
};
