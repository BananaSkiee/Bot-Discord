// modules/minecraftBot.js
const mineflayer = require('mineflayer');

// 20 Nama Player Organik (Tanpa _)
const nicknames = [
    'RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy',
    'RezaWibu', 'AndikaYT', 'SatriaGans', 'EkoPedia', 'RizkyPlayz',
    'AditSopo', 'FarelSky', 'GilangGanteng', 'YayanBotak', 'DaniMc',
    'RafliBoy', 'AldiGacor', 'YudhaCuy', 'BayuAja', 'TegarID'
];

// 100+ Database Chat Ngobrol, Sapaan, & Respon Kematian
const chatDB = {
    random: [
        "Wih rame juga ya servernya", "Lagi apa gess?", "Mabar survival dong", "Anjay spawnnya keren",
        "Gila sih ini server smooth banget", "Admin ada event gak?", "Lagi dimana kalian?", "Cek dc gess",
        "Bang minta makanan dong laper nih", "Izin afk bentar mau makan", "Oit ada yang mau trade gak?",
        "Siapa yang jago pvp di sini?", "Ajarin main dong sepuh", "Baru join nih, salam kenal",
        "Gas lah mabar sampe pagi", "Sinyal gw lag banget asli", "Enaknya bangun rumah dimana ya?",
        "Lagi cari villager susah amat", "Pake shader apa lu bang?", "Keren euy", "Hahahaha bener banget",
        "Yaelah mati konyol gw", "Kena jebakan betmen cuy", "Sumpah ini seru parah", "Okee siappp",
        "Siapa yang mau temenan sama gw?", "Gaskeunn", "Mantap bener dah", "Eh gila itu tinggi banget buildnya",
        "Salut gw sama yang buat", "Jangan lupa join discord gess", "Makasih ya bang udah dibantu",
        "Gw lagi di hutan nih nyasar", "Waduh malem gess banyak zombie", "Tidur gess biar skip malem",
        "Gw masih betah main", "Bentar lagi subuh euy", "Gila ketagihan main di sini", "Emang paling bener main di BananaSkiee",
        "Server idaman banget", "Coba deh cek fitur itu", "Baru tau gw", "Wih udah jago lu bang",
        "Bagi tips dong", "Gampang kok caranya", "Lanjut mining lagi ah", "Semangat gess cari hartanya",
        "Ada yang liat kucing gw gak?", "Hampir aja mati tadi gess", "Gaskeun raid raid", "Dapet harta karun gess",
        "Jangan lupa vote server gess", "Bagi koordinat villager dong", "Ada yang jual eltra?", "Lagi fokus farming gess",
        "Mana nih yang lain?", "Kosong amat sini", "Mending fokus mining diamond", "Build gw bagus gak?",
        "Siapa yang naruh lava di sini?", "Waduh hampir kecebur", "Hahaha kocak", "Sabar ya cuy", "Jangan emosi mainnya",
        "Enjoy aja gess", "Server no lag mantap", "Mabar yuk ke nether", "Cari blaze rod dulu", "Hati-hati banyak gas",
        "Ada yang punya obsidian?", "Mau buat portal nih", "Baru beres bikin farm gess", "Lumayan hasilnya",
        "Minta tolong temenin mining dong", "Gak berani sendiri gelap", "Wkwkwk cemen lu", "Biarin yang penting aman",
        "Nanti bagi hasil ya", "Siap bos", "Gokil bener dah", "Izin off bentar gess", "Nanti balik lagi",
        "Banyak mob gess hati-hati", "Tadi gw nemu dungeon", "Isinya lumayan lah", "Siapa mau mabar besok?"
    ],
    welcome: ["Halo @name! Selamat datang!", "Wih ada @name join, salam kenal!", "Salken ya @name", "Halo gess @name masuk nih"],
    goodbye: ["Yah @name keluar, dahh!", "Sampai jumpa lagi @name", "Hati-hati dijalan @name", "Dadah @name!"],
    death: ["Waduh @name kenapa mati? Wkwk", "Loh @name kok mati?", "Sabar ya @name, item aman?", "Kasihan banget @name mati konyol"]
};

const activeBots = new Map();

module.exports = {
    init: (client) => {
        console.log('[MC-SYSTEM] 🚀 Memulai mode Sosial (Target: 10 Player)...');

        const createSingleBot = (name) => {
            if (activeBots.has(name)) return;

            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: name,
                version: '1.21.1',
                auth: 'offline',
                disableChatSigning: true,
                skipValidation: true
            });

            // --- FITUR RESPONS KEMATIAN ---
            bot.on('entityDead', (entity) => {
                if (entity.type === 'player' && entity.username !== bot.username) {
                    if (Math.random() < 0.3) { // 30% peluang bot merespon agar tidak spam
                        const msg = chatDB.death[Math.floor(Math.random() * chatDB.death.length)].replace('@name', entity.username);
                        setTimeout(() => bot.chat(msg), 2000);
                    }
                }
            });

            // --- FITUR RESPONS MASUK/KELUAR ---
            bot.on('playerJoined', (player) => {
                if (player.username === bot.username) return;
                if (Math.random() < 0.2) {
                    const msg = chatDB.welcome[Math.floor(Math.random() * chatDB.welcome.length)].replace('@name', player.username);
                    setTimeout(() => bot.chat(msg), 3000);
                }
            });

            bot.on('playerLeft', (player) => {
                if (Math.random() < 0.2) {
                    const msg = chatDB.goodbye[Math.floor(Math.random() * chatDB.goodbye.length)].replace('@name', player.username);
                    setTimeout(() => bot.chat(msg), 2000);
                }
            });

            // --- PERGERAKAN & CHAT RANDOM ---
            const startLife = () => {
                const lifeTask = setInterval(() => {
                    if (!bot.entity) return;
                    const r = Math.random();
                    if (r < 0.2) { // Lari
                        bot.setControlState('forward', true); bot.setControlState('sprint', true);
                        setTimeout(() => { bot.setControlState('forward', false); bot.setControlState('sprint', false); }, 3000);
                    } else if (r < 0.4) { // Loncat
                        bot.setControlState('jump', true); setTimeout(() => bot.setControlState('jump', false), 500);
                    } else if (r < 0.1) { // Ngobrol Random
                        bot.chat(chatDB.random[Math.floor(Math.random() * chatDB.random.length)]);
                    } else { // Putar kamera
                        bot.look(Math.random() * Math.PI * 2, 0);
                    }
                }, 15000);
                bot.once('end', () => clearInterval(lifeTask));
            };

            bot.on('login', () => {
                console.log(`[MC-BOT] ✅ ${name} Join.`);
                activeBots.set(name, bot);
                startLife();
            });

            bot.on('end', () => {
                activeBots.delete(name);
                setTimeout(() => {
                    let nextName;
                    do { nextName = nicknames[Math.floor(Math.random() * nicknames.length)]; } while (activeBots.has(nextName));
                    createSingleBot(nextName);
                }, 20000);
            });

            bot.on('error', () => {});
        };

        nicknames.slice(0, 10).forEach((name, index) => {
            setTimeout(() => createSingleBot(name), index * 15000);
        });
    }
};
        
