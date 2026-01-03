// modules/minecraftBot.js
const mineflayer = require('mineflayer');

const nicknames = [
    'RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy', 'RezaWibu', 'AndikaYT', 'SatriaGans', 
    'EkoPedia', 'RizkyPlayz', 'AditSopo', 'FarelSky', 'GilangGanteng', 'YayanBotak', 'DaniMc', 
    'RafliBoy', 'AldiGacor', 'YudhaCuy', 'BayuAja', 'TegarID', 'FajarPlay', 'DimasCuy', 'AgusGamer'
];

const chatDB = {
    random: [
        "Wih rame juga ya servernya", "Lagi apa gess?", "Anjay spawnnya keren", "Gila sih ini server smooth banget",
        "Admin ada event gak?", "Lagi dimana kalian?", "Cek dc gess", "Bagi iron dong bang",
        "Bang minta makanan dong laper nih", "Izin afk bentar mau makan", "Siapa yang jago pvp di sini?",
        "Gas lah mabar sampe pagi", "Enaknya bangun rumah dimana ya?", "Lagi cari villager susah amat",
        "Hahaha bener banget", "Yaelah mati konyol gw", "Kena jebakan betmen cuy", "Sumpah ini seru parah",
        "Mantap bener dah", "Eh gila itu tinggi banget buildnya", "Salut gw sama yang buat",
        "Gw lagi di hutan nih nyasar", "Waduh malem gess banyak zombie", "Tidur gess biar skip malem",
        "Server idaman banget", "Coba deh cek fitur itu", "Lanjut mining lagi ah", "Semangat gess cari hartanya",
        "Ada yang punya diamond?", "Bagi koordinat portal nether dong", "Jual netherite murah nih",
        "Mending fokus farming sih gess", "Gaskeunn", "Eh liat deh itu", "Lucu banget anjir",
        "Siappp bang", "Jangan lupa vote server gess", "Banyak mob gess hati-hati", "Tadi gw nemu dungeon",
        "Isinya lumayan lah", "Siapa mau mabar besok?", "Gw masih betah main", "Bentar lagi subuh euy",
        "Emang paling bener main di sini", "No lag lag club", "Coba deh cek fitur itu", "Baru tau gw",
        "Wih udah jago lu bang", "Bagi tips dong", "Gampang kok caranya", "Tinggal klik aja itu",
        "Lagi asik mining malah nemu lava", "Hampir aja mati", "Sumpah ini seru parah",
        "Lu udah punya enchant apa aja?", "Jual buku mending bang", "Minta tolong dong bang",
        "Siapa yang mau temenan sama gw?", "Eh itu gimana cara pakenya?", "Oalah gitu toh",
        "Maklum masih newbie", "Bagi koordinat villager dong", "Ada yang jual eltra?",
        "Mending fokus farming gess", "Mana nih yang lain?", "Kosong amat sini",
        "Mending fokus mining diamond", "Build gw bagus gak?", "Siapa yang naruh lava di sini?",
        "Hahaha kocak", "Sabar ya cuy", "Jangan emosi mainnya", "Enjoy aja gess",
        "Mabar yuk ke nether", "Cari blaze rod dulu", "Hati-hati banyak gas",
        "Ada yang punya obsidian?", "Mau buat portal nih", "Baru beres bikin farm gess",
        "Minta tolong temenin mining dong", "Gak berani sendiri gelap", "Wkwkwk cemen lu",
        "Nanti bagi hasil ya", "Gokil bener dah", "Izin off bentar gess", "Nanti balik lagi",
        "Siapa yang belum tidur?", "Lanjut besok ya", "Dah dulu ya gess", "Sampai jumpa besok",
        "Gila ketagihan main", "Pake shader apa lu?", "Gokil abis", "Becanda doang cuy", "Iya santai"
    ],
    welcome: ["Halo @name! Salken", "Wih ada @name join!", "Salken ya @name", "Halo gess @name masuk nih", "Welcome @name"],
    goodbye: ["Yah @name keluar, dahh!", "Sampai jumpa lagi @name", "Hati-hati dijalan @name", "Dadah @name!"],
    death: ["Waduh @name kenapa mati? Wkwk", "Loh @name kok mati?", "Sabar ya @name, item aman?", "Kasihan @name mati konyol"]
};

const autoReply = [
    { keys: ['halo', 'hai', 'p', 'hallo'], replies: ['Halo juga!', 'Oit halo', 'Hai kak!', 'Halo salken ya'] },
    { keys: ['jam', 'pukul', 'waktu'], replies: ['Sekarang jam @time gess', 'Nih jam @time', 'Jam @time ya'] },
    { keys: ['mabar', 'bareng'], replies: ['Gas mabar!', 'Sini ke koordinat gw', 'Ayo mabar survival'] },
    { keys: ['admin', 'owner'], replies: ['Adminnya lagi sibuk kali', 'Coba tag aja di discord'] },
    { keys: ['ip', 'server'], replies: ['IP: empirebs.falixsrv.me', 'Lagi main di BananaSkiee nih'] },
    { keys: ['discord', 'dc'], replies: ['Join dc gess: dsc.gg/BananaSkiee', 'Link dc ada di info server'] }
];

const activeBots = new Map();

module.exports = {
    init: (client) => {
        console.log('[MC-SYSTEM] 🚀 Memulai mode Sosial (10 Bot Aktif)...');

        const createSingleBot = (name) => {
            if (activeBots.has(name)) return;

            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: name,
                version: '1.21.1',
                auth: 'offline',
                disableChatSigning: true,
                skipValidation: true,
                hideErrors: true
            });

            // --- LOGIKA RESPON CHAT & AUTO REPLY ---
            bot.on('messagestr', (message, position) => {
                if (position === 'game_info') return;
                const msg = message.toLowerCase();
                
                // Mencegah bot membalas bot lain
                const isBot = nicknames.some(n => msg.includes(n.toLowerCase()));
                if (isBot) return;

                autoReply.forEach(rule => {
                    if (rule.keys.some(key => msg.includes(key))) {
                        if (Math.random() < 0.4) { // 40% peluang merespon
                            const now = new Date();
                            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                            const response = rule.replies[Math.floor(Math.random() * rule.replies.length)].replace('@time', timeStr);
                            setTimeout(() => bot.chat(response), 2000 + (Math.random() * 2000));
                        }
                    }
                });
            });

            // --- RESPON MASUK / KELUAR / MATI ---
            bot.on('playerJoined', (p) => {
                if (activeBots.has(p.username) || p.username === bot.username) return;
                if (Math.random() < 0.2) {
                    bot.chat(chatDB.welcome[Math.floor(Math.random() * chatDB.welcome.length)].replace('@name', p.username));
                }
            });

            bot.on('entityDead', (entity) => {
                if (entity.type === 'player' && Math.random() < 0.2) {
                    bot.chat(chatDB.death[Math.floor(Math.random() * chatDB.death.length)].replace('@name', entity.username));
                }
            });

            bot.on('login', () => {
                activeBots.set(name, bot);
                // Gerakan & Chat Random (Dibuat jarang agar tidak spam)
                const interval = setInterval(() => {
                    if (!bot.entity) return;
                    const r = Math.random();
                    if (r < 0.1) bot.chat(chatDB.random[Math.floor(Math.random() * chatDB.random.length)]);
                    if (r < 0.3) bot.setControlState('jump', true);
                    setTimeout(() => bot.setControlState('jump', false), 500);
                    bot.look(Math.random() * 6, 0);
                }, 45000);
                bot.once('end', () => clearInterval(interval));
            });

            bot.on('end', (reason) => {
                activeBots.delete(name);
                console.log(`[MC-BOT] 🔌 ${name} Off: ${reason}`);
                setTimeout(() => {
                    let next;
                    do { next = nicknames[Math.floor(Math.random() * nicknames.length)]; } while (activeBots.has(next));
                    createSingleBot(next);
                }, 30000);
            });

            bot.on('error', () => {});
        };

        // Masukkan 10 Bot
        nicknames.slice(0, 10).forEach((name, index) => {
            setTimeout(() => createSingleBot(name), index * 15000);
        });
    }
};
