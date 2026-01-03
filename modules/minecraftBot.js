const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');

const nicknames = [
    'RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy', 'RezaWibu', 'AndikaYT', 'SatriaGans', 
    'EkoPedia', 'RizkyPlayz', 'AditSopo', 'FarelSky', 'GilangGanteng', 'YayanBotak', 'DaniMc',
    'RafliBoy', 'AldiGacor', 'YudhaCuy', 'BayuAja', 'TegarID', 'FajarPlay'
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
        
        // --- GAMEPLAY & SURVIVAL ---
        "Duh pickaxe gw mau patah", "Cari iron dimana ya yang cepet?", "Ada yang jual mending?", 
        "Lagi dapet banyak gold nih", "Waduh nemu lava terus", "Gelap banget di bawah", "Bawa obor dikit tadi",
        "Ada yang mau temenin ke nether?", "Nether ngeri gess banyak ghast", "Cari blaze rod dulu buat ramuan",
        "Eltra harganya berapa ya di sini?", "Bagi koordinat villager dong yang murah", "Capek mining pengen berkebun",
        "Tadi liat enderman serem amat", "Siapa yang naruh obsidian di sini?", "Bagi wood dong seadanya",
        "Mending bikin rumah kayu apa batu ya?", "Ada yang punya bibit bambu?", "Lagi bikin sistem redstone nih",
        "Gila sih ini worldnya luas banget", "Server ini ada mapnya gak ya?", "Cek inventory penuh terus",
        "Buang-buang cobblestone dulu gess", "Banyak skeleton nembak terus", "Pvp di spawn dilarang ya?",
        "Lagi nyari spawn chunk nih", "Bikin farm iron seru kali ya", "Ada yang punya buku fortune?",
        "Lagi mancing dapet sepatu luntur", "Enchantment table dimana ya?", "Butuh lapis lazuli banyak",
        
        // --- SANTAI & KOPI ---
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
        "Wih member baru @name masuk, halo!", "Welcome @name! Jangan lupa baca rules ya"
    ],
    death: [
        "Waduh @name sabar ya, itemnya aman kan?", "Loh @name kenapa? Hati-hati gess", "Semangat @name, jangan menyerah ya",
        "Turut berduka @name, tadi kena apa?", "Aduh @name, mau dibantuin balik ke sana?", "Sabar ya @name, semangat lagi"
    ],
    combat: [
        "Aduh ada monster!", "Sini lu zombie!", "Ngeri gess mobnya rame", "Kabur dulu gess darah dikit", 
        "Buset kaget gw ada creeper", "Skeleton ganggu aja lagi santai"
    ]
};

const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🛡️ Guard System & 200+ Chat Active');

        const createSingleBot = (name) => {
            if (activeBots.has(name) || activeBots.size >= 6) return;

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

            // --- LOGIKA AI (COMBAT, EAT, ESCAPE) ---
            const startLiving = () => {
                const aiTask = setInterval(async () => {
                    if (!bot.entity || !bot.entity.position) return;

                    // 1. AUTO EAT
                    if (bot.food < 15 || bot.health < 14) {
                        const food = bot.inventory.items().find(i => 
                            ['bread', 'steak', 'cooked_beef', 'apple', 'cooked_chicken'].includes(i.name));
                        if (food) { 
                            await bot.equip(food, 'hand'); 
                            bot.consume(); 
                        }
                    }

                    // 2. DETEKSI MOB TERDEKAT
                    const enemy = bot.nearestEntity(e => 
                        e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 6);

                    if (enemy) {
                        const dist = enemy.position.distanceTo(bot.entity.position);
                        
                        // KABUR JIKA SEKARAT
                        if (bot.health < 10) {
                            if (Math.random() < 0.01) bot.chat(chatDB.combat[3]);
                            const runDir = bot.entity.position.subtract(enemy.position).normalize().multiply(5);
                            bot.lookAt(bot.entity.position.add(runDir));
                            bot.setControlState('forward', true);
                            bot.setControlState('sprint', true);
                            setTimeout(() => { 
                                bot.setControlState('forward', false); 
                                bot.setControlState('sprint', false); 
                            }, 3000);
                        } 
                        // SERANG JIKA DEKAT
                        else if (dist < 3.8) {
                            bot.lookAt(enemy.position.offset(0, 1, 0));
                            bot.attack(enemy);
                            if (Math.random() < 0.01) bot.chat(chatDB.combat[Math.floor(Math.random()*3)]);
                        }
                    }

                    // 3. GERAKAN RANDOM & ANTI-WATER
                    const r = Math.random();
                    const checkBlock = bot.blockAt(bot.entity.position.offset(1, -1, 0));
                    if (checkBlock && (checkBlock.name.includes('water') || checkBlock.name === 'air')) {
                        bot.look(bot.entity.yaw + Math.PI, 0);
                    } else if (r < 0.15) {
                        bot.setControlState('forward', true);
                        setTimeout(() => { if(bot.setControlState) bot.setControlState('forward', false); }, 1000);
                    }

                    // 4. CHAT RANDOM SANGAT JARANG
                    if (r < 0.003) {
                        bot.chat(chatDB.random[Math.floor(Math.random() * chatDB.random.length)]);
                    }

                }, 5000);
                bot.once('end', () => clearInterval(aiTask));
            };

            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} Join & Ready.`);
                setTimeout(startLiving, 5000);
            });

            bot.on('playerJoined', (player) => {
                if (activeBots.has(player.username)) return;
                if (Math.random() < 0.1) {
                    const msg = chatDB.welcome[Math.floor(Math.random() * chatDB.welcome.length)].replace('@name', player.username);
                    setTimeout(() => { if(bot.chat) bot.chat(msg); }, 8000);
                }
            });

            bot.on('death', () => {
                setTimeout(() => { if(bot.respawn) bot.respawn(); }, 10000);
            });

            bot.on('end', (reason) => {
                activeBots.delete(name);
                console.log(`[MC-BOT] 🔌 ${name} Off. Tunggu 80 detik...`);
                setTimeout(() => createSingleBot(name), 80000);
            });

            bot.on('error', () => {});
        };

        // LOGIN BERTAHAP (80 DETIK SEKALI)
        for (let i = 0; i < nicknames.length; i++) {
            if (i >= 6) break; // Batasi 6 bot saja demi stabilitas IP
            setTimeout(() => createSingleBot(nicknames[i]), i * 80000);
        }
    }
};
