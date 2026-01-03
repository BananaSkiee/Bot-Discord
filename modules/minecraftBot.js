const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');

// Daftar nama bot yang akan digunakan bergantian
const nicknames = [
    'RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy', 'RezaWibu', 'AndikaYT', 'SatriaGans', 
    'EkoPedia', 'RizkyPlayz', 'AditSopo', 'FarelSky', 'GilangGanteng', 'YayanBotak', 'DaniMc',
    'RafliBoy', 'AldiGacor', 'YudhaCuy', 'BayuAja', 'TegarID'
];

// Database Chat Lengkap (Ramah & Sopan)
const chatDB = {
    random: [
        "Wih rame juga ya servernya", "Lagi pada bangun apa nih gess?", "Semangat miningnya semuanya", 
        "Izin afk bentar ya mau minum", "Gila sih ini server asik banget", "Ada yang butuh bantuan gak?",
        "Salken ya buat yang baru join", "Lagi nyari lokasi buat bikin rumah nih", "Enaknya nanem apa ya di farm?",
        "Keren-keren euy build di sini", "Semangat gess cari diamondnya", "Jangan lupa istirahat ya semuanya",
        "Mending fokus farming dulu biar aman", "Oit ada yang mau mabar bareng?", "Link discordnya apa ya gess?",
        "Hahaha seru bener", "Hati-hati banyak mob kalau malem", "Tidur gess biar cepet pagi",
        "Izin lanjut mining dulu ya", "Semoga dapet harta karun hari ini", "Aamiin", "Mantap bener dah",
        "Boleh ikutan mabar gak?", "Sini kumpul gess", "Bagi tips dong sepuh di sini", "Gampang kok ternyata",
        "Makasih ya infonya", "Bagus lah kalau gitu", "Lanjut semangat lagi gess", "Hati-hati di jalan ya",
        "Izin makan dulu ya bentar", "Ada yang punya makanan lebih?", "Server idaman banget sih ini",
        "Bikin apa lagi ya enaknya?", "Lagi fokus nyari koordinat nih", "Sumpah seru parah main di sini",
        "Siapa yang mau trade item?", "Butuh batu banyak nih", "Gas lah mining bareng", "Hampir aja kecebur",
        "Wkwkwk lucu banget", "Iya bener banget itu", "Sabar ya semua pasti ada jalannya", "Semangat!",
        "Lagi dengerin musik asik banget", "Mabar yuk mumpung rame", "Ada event gak ya hari ini?",
        "Adminnya ramah-ramah euy", "Suka banget sama komunitasnya", "Jangan lupa makan gess di dunia nyata",
        "Okee siap bang", "Nanti bantuin gw ya", "Gas polll", "Mantul gess", "Banyak mob nih ngeri"
    ],
    welcome: [
        "Halo @name! Selamat datang ya", "Wah ada @name join, salken!", "Welcome kak @name, enjoy di sini",
        "Halo @name, semangat mainnya!", "Hai @name, salam kenal ya", "Salken @name, semoga betah"
    ],
    goodbye: [
        "Yah kak @name keluar, sampai jumpa lagi!", "Dadah @name, hati-hati ya", "See you @name, balik lagi nanti",
        "Terima kasih sudah main @name", "Sampai ketemu besok @name"
    ],
    death: [
        "Waduh @name sabar ya, itemnya aman kan?", "Loh @name kenapa? Hati-hati gess", "Semangat @name, jangan menyerah ya",
        "Turut berduka @name, tadi kena apa?", "Aduh @name, mau dibantuin balik ke sana?", "Sabar ya @name, semangat lagi"
    ]
};

const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🛡️ Memulai Mode Player Ramah (Target: 8 Bot)');
        console.log('[MC-SYSTEM] ⏳ Antrian login: 30 detik sekali...');

        const createSingleBot = (name) => {
            if (activeBots.has(name)) return;

            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: name,
                version: '1.21.1',
                auth: 'offline',
                checkTimeoutInterval: 120000,
                disableChatSigning: true,
                hideErrors: true,
                viewDistance: 'tiny'
            });

            // --- LOGIKA PERGERAKAN & SURVIVAL ---
            const startLiving = () => {
                const lifeTask = setInterval(async () => {
                    if (!bot.entity) return;

                    const pos = bot.entity.position;
                    const r = Math.random();

                    // 1. Deteksi Air & Jurang di Depan
                    const forwardPos = pos.relative(1, -1, 0);
                    const blockBelowFront = bot.blockAt(forwardPos);
                    
                    if (blockBelowFront && (blockBelowFront.name.includes('water') || blockBelowFront.name === 'air')) {
                        // Jika ada air atau jurang, belok 90 derajat
                        bot.look(bot.entity.yaw + Math.PI / 2, 0);
                    } else {
                        // 2. Maju & Ancurin blok di depan (Mining sederhana)
                        try {
                            const blockInFront = bot.blockAt(pos.offset(1, 0, 0));
                            if (blockInFront && blockInFront.name !== 'air' && !blockInFront.name.includes('water')) {
                                await bot.dig(blockInFront);
                            }
                            bot.setControlState('forward', true);
                            setTimeout(() => bot.setControlState('forward', false), 800);
                        } catch (e) {}
                    }

                    // 3. Chat Random (Sangat jarang agar tidak spam)
                    if (r < 0.01) {
                        bot.chat(chatDB.random[Math.floor(Math.random() * chatDB.random.length)]);
                    }
                }, 8000); // Aktivitas tiap 8 detik

                bot.once('end', () => clearInterval(lifeTask));
            };

            // --- RESPON TERHADAP PEMAIN LAIN ---
            bot.on('playerJoined', (player) => {
                if (player.username === bot.username || activeBots.has(player.username)) return;
                if (Math.random() < 0.15) { // 15% peluang sapa
                    const msg = chatDB.welcome[Math.floor(Math.random() * chatDB.welcome.length)].replace('@name', player.username);
                    setTimeout(() => bot.chat(msg), 4000 + (Math.random() * 3000));
                }
            });

            bot.on('entityDead', (entity) => {
                if (entity.type === 'player' && entity.username !== bot.username && !activeBots.has(entity.username)) {
                    if (Math.random() < 0.2) { // 20% peluang berduka
                        const msg = chatDB.death[Math.floor(Math.random() * chatDB.death.length)].replace('@name', entity.username);
                        setTimeout(() => bot.chat(msg), 3000);
                    }
                }
            });

            // --- HANDLER EVENT BOT ---
            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} sudah masuk server.`);
                setTimeout(startLiving, 3000);
            });

            bot.on('death', () => {
                setTimeout(() => bot.spawn(), 5000);
            });

            bot.on('end', (reason) => {
                activeBots.delete(name);
                console.log(`[MC-BOT] 🔌 ${name} terputus: ${reason}. Reconnect dalam 30 detik.`);
                setTimeout(() => createSingleBot(name), 30000);
            });

            bot.on('error', (err) => {
                if (err.code === 'ECONNREFUSED') return;
            });
        };

        // --- SISTEM ANTRIAN MASUK (DELAY 30 DETIK) ---
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                createSingleBot(nicknames[i]);
            }, i * 30000); // Masuk di detik ke 0, 30, 60, 90, dst.
        }
    }
};
