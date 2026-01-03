// modules/minecraftBot.js
const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');

const nicknames = [
    'RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy', 'RezaWibu', 'AndikaYT', 'SatriaGans', 
    'EkoPedia', 'RizkyPlayz', 'AditSopo', 'FarelSky', 'GilangGanteng', 'YayanBotak', 'DaniMc',
    'RafliBoy', 'AldiGacor', 'YudhaCuy', 'BayuAja', 'TegarID', 'FajarPlay', 'DimasCuy', 'AgusGamer'
];

const chatDB = {
    random: [
        // --- RAMAH & SOSIAL ---
        "Wih rame juga ya servernya", "Lagi pada bangun apa nih gess?", "Semangat miningnya semuanya", 
        "Izin afk bentar ya mau minum", "Gila sih ini server asik banget", "Ada yang butuh bantuan gak?",
        "Salken ya buat yang baru join", "Lagi nyari lokasi buat bikin rumah nih", "Enaknya nanem apa ya di farm?",
        "Keren-keren euy build di sini", "Semangat gess cari diamondnya", "Jangan lupa istirahat ya semuanya",
        "Mending fokus farming dulu biar aman", "Oit ada yang mau mabar bareng?", "Link discordnya apa ya gess?",
        "Hahaha seru bener", "Hati-hati banyak mob kalau malem", "Tidur gess biar cepet pagi",
        "Semoga dapet harta karun hari ini", "Aamiin", "Mantap bener dah", "Boleh ikutan mabar gak?",
        "Sini kumpul gess", "Bagi tips dong sepuh di sini", "Makasih ya infonya", "Lanjut semangat lagi gess",
        "Izin makan dulu ya bentar", "Ada yang punya makanan lebih?", "Server idaman banget sih ini",
        "Bikin apa lagi ya enaknya?", "Lagi fokus nyari koordinat nih", "Sumpah seru parah main di sini",
        "Siapa yang mau trade item?", "Butuh batu banyak nih", "Gas lah mining bareng", "Hampir aja kecebur",
        "Wkwkwk lucu banget", "Iya bener banget itu", "Sabar ya semua pasti ada jalannya", "Semangat!",
        "Lagi dengerin musik asik banget", "Mabar yuk mumpung rame", "Ada event gak ya hari ini?",
        "Adminnya ramah-ramah euy", "Suka banget sama komunitasnya", "Jangan lupa makan gess di dunia nyata",
        "Okee siap bang", "Nanti bantuin gw ya", "Gas polll", "Mantul gess", "Banyak mob nih ngeri",
        
        // --- GAMEPLAY & MINING ---
        "Duh pickaxe gw mau patah", "Cari iron dimana ya yang cepet?", "Ada yang jual mending?", 
        "Lagi dapet banyak gold nih", "Waduh nemu lava terus", "Gelap banget di bawah", "Bawa obor dikit tadi",
        "Ada yang mau temenin ke nether?", "Nether ngeri gess banyak ghast", "Cari blaze rod dulu buat ramuan",
        "Eltra harganya berapa ya di sini?", "Bagi koordinat villager dong yang murah", "Capek mining pengen berkebun",
        "Tadi liat enderman serem amat", "Siapa yang naruh obsidian di sini?", "Bagi wood dong seadanya",
        "Mending bikin rumah kayu apa batu ya?", "Ada yang punya bibit bambu?", "Lagi bikin sistem redstone nih",
        "Gila sih ini worldnya luas banget", "Server ini ada mapnya gak ya?", "Cek inventory penuh terus",
        "Buang-buang cobblestone dulu gess", "Banyak skeleton nembak terus", "Pvp di spawn dilarang ya?",
        
        // --- INTERAKSI SANTAI ---
        "Mending main malem apa siang gess?", "Kopi mana kopi", "Absen dulu dari mana aja kalian?",
        "Salam dari pemain baru", "Izin nyimak aja gess", "Buseeet keren amat itu", "Gak nyangka nemu ginian",
        "Hampir aja mati konyol", "Lagi liatin pemandangan", "Servernya smooth no lag lag", "Admin jaya jaya jaya",
        "Kapan-kapan mabar game lain kuy", "Fokus survival dulu", "Jangan lupa vote biar server rame",
        "Kalo butuh dirt ambil aja di tempat gw", "Lagi beresin storage", "Mancing mania mantap",
        "Dapet ikan banyak nih", "Ada yang punya pelana kuda?", "Naik kuda asik juga", "Lari-lari biar sehat",
        "Bagi-bagi rezeki dong kak", "Besok main lagi ah jam segini", "Seru banget asli", "Gak nyesel join ke sini",
        "Waduh laper lagi", "Makan steak enak nih", "Ada yang jual roti?", "Mending ternak sapi apa domba?",
        "Gunting bulu domba dulu gess", "Warna warni dombanya lucu", "Siapa yang punya dye merah?",
        "Bikin banner keren nih", "Izin keliling map ya", "Jangan maling ya gess", "Main jujur itu keren",
        "Salam damai semuanya", "Sehat selalu ya gess", "Lagi asik dengerin lagu", "Mantap jiwa",
        "Ada yang bisa bantu craft ginian?", "Oalah baru tau caranya", "Siap laksanakan", "Lanjut lagi gess!"
    ],
    welcome: [
        "Halo @name! Selamat datang ya", "Wah ada @name join, salken!", "Welcome kak @name, enjoy di sini",
        "Halo @name, semangat mainnya!", "Hai @name, salam kenal ya", "Salken @name, semoga betah",
        "Wih member baru @name masuk, halo!", "Welcome @name! Jangan lupa baca rules ya", "Halo @name, salam dari tim bot"
    ],
    goodbye: [
        "Yah kak @name keluar, sampai jumpa lagi!", "Dadah @name, hati-hati ya", "See you @name, balik lagi nanti",
        "Terima kasih sudah main @name", "Sampai ketemu besok @name", "Dah @name, sukses selalu"
    ],
    death: [
        "Waduh @name sabar ya, itemnya aman kan?", "Loh @name kenapa? Hati-hati gess", "Semangat @name, jangan menyerah ya",
        "Turut berduka @name, tadi kena apa?", "Aduh @name, mau dibantuin balik ke sana?", "Sabar ya @name, semangat lagi",
        "Yah @name mati, sabar kak ntar dapet lagi", "Lagi apes ya @name? Semangat balik lagi"
    ]
};

const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🛡️ Mode Player Ramah (200+ Chat & Fix Crash)');

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
                hideErrors: true
            });

            const startLiving = () => {
                const lifeTask = setInterval(async () => {
                    if (!bot.entity || !bot.entity.position) return;

                    const pos = bot.entity.position;
                    const r = Math.random();

                    const checkPos = pos.offset(1, -1, 0);
                    const blockBelowFront = bot.blockAt(checkPos);
                    
                    if (blockBelowFront && (blockBelowFront.name.includes('water') || blockBelowFront.name === 'air')) {
                        bot.look(bot.entity.yaw + Math.PI / 2, 0);
                    } else {
                        try {
                            const blockInFront = bot.blockAt(pos.offset(1, 0, 0));
                            if (blockInFront && blockInFront.name !== 'air' && !blockInFront.name.includes('water')) {
                                await bot.dig(blockInFront);
                            }
                            bot.setControlState('forward', true);
                            setTimeout(() => { if(bot.setControlState) bot.setControlState('forward', false); }, 800);
                        } catch (e) {}
                    }

                    if (r < 0.01) {
                        bot.chat(chatDB.random[Math.floor(Math.random() * chatDB.random.length)]);
                    }
                }, 10000); // 10 Detik sekali agar chat tidak terlalu spam

                bot.once('end', () => clearInterval(lifeTask));
            };

            bot.on('playerJoined', (player) => {
                if (player.username === bot.username || activeBots.has(player.username)) return;
                if (Math.random() < 0.15) {
                    const msg = chatDB.welcome[Math.floor(Math.random() * chatDB.welcome.length)].replace('@name', player.username);
                    setTimeout(() => { if(bot.chat) bot.chat(msg); }, 4000);
                }
            });

            bot.on('entityDead', (entity) => {
                if (entity.type === 'player' && entity.username !== bot.username) {
                    if (Math.random() < 0.2) {
                        const msg = chatDB.death[Math.floor(Math.random() * chatDB.death.length)].replace('@name', entity.username);
                        setTimeout(() => { if(bot.chat) bot.chat(msg); }, 3000);
                    }
                }
            });

            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} sudah join.`);
                setTimeout(startLiving, 3000);
            });

            bot.on('death', () => {
                setTimeout(() => { if(bot.respawn) bot.respawn(); }, 5000);
            });

            bot.on('end', (reason) => {
                activeBots.delete(name);
                console.log(`[MC-BOT] 🔌 ${name} Off: ${reason}`);
                setTimeout(() => createSingleBot(name), 30000);
            });

            bot.on('error', () => {});
        };

        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                createSingleBot(nicknames[i]);
            }, i * 30000);
        }
    }
};
        
