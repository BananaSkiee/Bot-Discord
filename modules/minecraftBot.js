// modules/minecraftBot.js
const mineflayer = require('mineflayer');

const nicknames = [
    'RianGamerz', 'DikaAja', 'FahriPro', 'BaimCuy', 'ZakiTzy', 'RezaWibu', 'AndikaYT', 'SatriaGans', 
    'EkoPedia', 'RizkyPlayz', 'AditSopo', 'FarelSky', 'GilangGanteng', 'YayanBotak', 'DaniMc'
];

const chatDB = {
    // 1. AUTO RESPON DISCORD & KEYWORDS
    autoRespon: [
        { key: ['discord', 'dc', 'link', 'sosmed', 'grup'], reply: ['Mampir ke Discord gess: https://discord.gg/aTEGb6SaFQ', 'Ini link discord servernya: https://discord.gg/aTEGb6SaFQ', 'Gas join discord kita gess biar mabar makin seru: https://discord.gg/aTEGb6SaFQ', 'Link grup DC: https://discord.gg/aTEGb6SaFQ'] },
        { key: ['halo', 'hai', 'p', 'hallo', 'assalamualaikum', 'oy', 'helau'], reply: ['Halo juga kak!', 'Hai salken ya', 'Oit halo!', 'Halo, lagi apa?', 'Waalaikumsalam kak!', 'Hai hai!', 'Halo pemain baru?', 'Oit, salken ya gess'] },
        { key: ['admin', 'owner', 'staf', 'moderator', 'bang dm', 'bang admin'], reply: ['Adminnya lagi sibuk kali kak', 'Coba tag di Discord aja kalau cari admin', 'Admin server ini ramah kok tenang aja', 'Lagi off mungkin adminnya', 'Nanti juga muncul adminnya gess'] },
        { key: ['minta', 'bagi', 'item', 'food', 'makanan', 'bagi ore', 'bagi diamond'], reply: ['Yah saya juga lagi usaha cari item nih', 'Main bareng yuk biar dapet item banyak', 'Semangat farmingnya kak!', 'Duh laper juga nih kak', 'Fokus mining dulu gess biar kaya', 'Usaha sendiri lebih mantap kak'] },
        { key: ['server', 'ip', 'port', 'versi'], reply: ['Servernya asik banget ya!', 'IP-nya udah bener kok ini', 'Langgeng terus ya main di sini', 'Server terbaik sih ini', 'Versinya udah pas gess', 'Keren nih server gak lag'] },
        { key: ['wkwk', 'haha', 'lucu', 'lol', 'ngakak'], reply: ['Hahaha iya bener', 'Wkwkwk gokil', 'Bisa aja si kakak ini', 'Receh banget dah wkwk', 'Asli ngakak itu', 'Lucu amat dah'] }
    ],

    // 2. PESAN PLAYER KELUAR (Full Goodbye)
    goodbye: [
        "Yah kak @name keluar, sampai jumpa lagi!", "Dadah @name, hati-hati ya!", "See you @name, balik lagi nanti ya",
        "Terima kasih sudah mampir @name", "Sampai ketemu besok @name!", "Yah @name sudah off, padahal baru mau mabar",
        "Hati-hati di jalan kak @name", "Take care @name!", "Nanti balik lagi ya @name", "Baru juga seru @name udah keluar",
        "Dadah @name, sukses selalu!", "Semoga harimu menyenangkan @name", "Huhu @name pergi", "Bye bye @name!",
        "Dah @name, nanti lanjut lagi miningnya", "Hati-hati kak @name!", "Salken ya tadi @name", "Yaudah @name, istirahat sana",
        "Sampai jumpa di lain waktu @name", "Off dulu ya kak @name? Oke siap", "Jaga diri kak @name!", "Dadah sepuh @name",
        "Yah @name udah log out aja", "Babay @name!", "Moga ketemu lagi ya @name", "Yah kawan kita @name pergi",
        "Bye @name, jangan lupa balik!", "Semoga sehat selalu @name!", "Sampai jumpa lagi kak @name"
    ],

    // 3. PESAN PLAYER JOIN (Full Welcome)
    welcome: [
        "Halo @name! Selamat datang ya", "Wah ada @name join, salken!", "Welcome kak @name, enjoy di sini",
        "Halo @name, semangat mainnya!", "Hai @name, salam kenal ya", "Salken @name, semoga betah",
        "Wih member baru @name masuk, halo!", "Welcome @name! Jangan lupa baca rules ya", "Welcome home @name!",
        "Salken kak @name! Semoga betah main di sini", "Welcome @name! Link Discord ada di chat ya",
        "Wah pemain pro @name join!", "Halo kak @name, moga betah di server ini", "Oit @name join gess!",
        "Welcome @name, salken dari kami bot ramah", "Hai @name! Butuh teman mabar?", "Salken @name, asik nih nambah orang"
    ],

    // 4. PESAN KEMATIAN (Full Death Response)
    death: [
        "Waduh @name sabar ya, itemnya aman kan?", "Loh @name kenapa? Hati-hati gess", "Semangat @name, jangan menyerah ya",
        "Turut berduka @name, tadi kena apa?", "Aduh @name, mau dibantuin balik ke sana?", "Sabar ya @name, semangat lagi",
        "Duh @name, ngeri emang mob di sini", "Sabar kak @name, ntar cari lagi diamondnya", "Apes banget @name hari ini",
        "Waduh @name mati konyol nih wkwk", "Sabar ya @name, ntar gw bantuin jagain spawn", "Ngeri kali @name kena hit"
    ],

    // 5. CHAT RANDOM (150+ FULL CUSTOM TEXT)
    random: [
        "Wih rame juga ya servernya", "Lagi pada bangun apa nih gess?", "Semangat miningnya semuanya", 
        "Izin afk bentar ya mau minum", "Gila sih ini server asik banget", "Ada yang butuh bantuan gak?",
        "Salken ya buat yang baru join", "Lagi nyari lokasi buat bikin rumah nih", "Enaknya nanem apa ya di farm?",
        "Keren-keren euy build di sini", "Semangat gess cari diamondnya", "Jangan lupa istirahat ya semuanya",
        "Mending fokus farming dulu biar aman", "Oit ada yang mau mabar bareng?", "Hahaha seru bener",
        "Hati-hati banyak mob kalau malem", "Tidur gess biar cepet pagi", "Semoga dapet harta karun hari ini",
        "Aamiin", "Mantap bener dah", "Boleh ikutan mabar gak?", "Sini kumpul gess",
        "Bagi tips dong sepuh di sini", "Makasih ya infonya", "Lanjut semangat lagi gess",
        "Izin makan dulu ya bentar", "Ada yang punya makanan lebih?", "Server idaman banget sih ini",
        "Bikin apa lagi ya enaknya?", "Lagi fokus nyari koordinat nih", "Sumpah seru parah main di sini",
        "Siapa yang mau trade item?", "Butuh batu banyak nih", "Gas lah mining bareng", "Hampir aja kecebur",
        "Wkwkwk lucu banget", "Iya bener banget itu", "Sabar ya semua pasti ada jalannya", "Semangat!",
        "Lagi dengerin musik asik banget", "Mabar yuk mumpung rame", "Ada event gak ya hari ini?",
        "Adminnya ramah-ramah euy", "Suka banget sama komunitasnya", "Jangan lupa makan gess di dunia nyata",
        "Okee siap bang", "Nanti bantuin gw ya", "Gas polll", "Mantul gess", "Banyak mob nih ngeri",
        "Duh pickaxe gw mau patah", "Cari iron dimana ya yang cepet?", "Ada yang jual mending?", 
        "Lagi dapet banyak gold nih", "Waduh nemu lava terus", "Gelap banget di bawah", "Bawa obor dikit tadi",
        "Nether ngeri gess banyak ghast", "Cari blaze rod dulu buat ramuan",
        "Eltra harganya berapa ya di sini?", "Bagi koordinat villager dong yang murah", "Capek mining pengen berkebun",
        "Tadi liat enderman serem amat", "Siapa yang naruh obsidian di sini?", "Bagi wood dong seadanya",
        "Mending bikin rumah kayu apa batu ya?", "Ada yang punya bibit bambu?", "Lagi bikin sistem redstone nih",
        "Gila sih ini worldnya luas banget", "Server ini ada mapnya gak ya?", "Cek inventory penuh terus",
        "Buang-buang cobblestone dulu gess", "Banyak skeleton nembak terus", "Pvp di spawn dilarang ya?",
        "Mending main malem apa siang gess?", "Kopi mana kopi", "Absen dulu dari mana aja kalian?",
        "Salam dari pemain baru", "Izin nyimak aja gess", "Buseeet keren amat itu", "Gak nyangka nemu ginian",
        "Hampir aja mati konyol", "Lagi liatin pemandangan", "Servernya smooth no lag lag", "Admin jaya jaya jaya",
        "Kapan-kapan mabar game lain kuy", "Fokus survival dulu", "Jangan lupa vote biar server rame",
        "Lagi beresin storage", "Mancing mania mantap", "Dapet ikan banyak nih", "Naik kuda asik juga",
        "Lari-lari biar sehat", "Bagi-bagi rezeki dong kak", "Besok main lagi ah jam segini", "Seru banget asli",
        "Gak nyesel join ke sini", "Waduh laper lagi", "Makan steak enak nih", "Ada yang jual roti?",
        "Mending ternak sapi apa domba?", "Gunting bulu domba dulu gess", "Warna warni dombanya lucu",
        "Bikin banner keren nih", "Izin keliling map ya", "Jangan maling ya gess", "Main jujur itu keren",
        "Salam damai semuanya", "Sehat selalu ya gess", "Lagi asik dengerin lagu", "Mantap jiwa",
        "Ada yang bisa bantu craft ginian?", "Oalah baru tau caranya", "Siap laksanakan", "Lanjut lagi gess!",
        "Duh laper bener", "Ada yang punya diamond sisa?", "Enaknya bikin base dimana ya?", "Base bawah tanah asik kali ya",
        "Otw nyari rawa-rawa gess", "Butuh slimeball nih", "Salken semua ya", "Lagi liatin sunset gess",
        "Bikin farm otomatis seru nih", "Capek jalan kaki pengen eltra", "Sabar gess proses mining panjang",
        "Mantul bener ini worldnya", "Admin server ini top deh", "Sehat selalu ya kawan-kawan", "Gaskan gess"
    ],
    combat: [
        "Aduh ada monster!", "Sini lu zombie!", "Ngeri gess mobnya rame", "Kabur dulu gess darah dikit", 
        "Buset kaget gw ada creeper", "Skeleton ganggu aja lagi santai", "Duh kena panah terus", "Mati lu zombie!"
    ]
};

const activeBots = new Map();

module.exports = {
    init: () => {
        console.log('[MC-SYSTEM] 🛡️ ULTIMATE ANTI-KICK & 250+ CHAT ACTIVE');

        const createSingleBot = (name) => {
            if (activeBots.has(name) || activeBots.size >= 5) return;

            const bot = mineflayer.createBot({
                host: 'empirebs.falixsrv.me',
                port: 37152,
                username: name,
                version: '1.21.1',
                auth: 'offline',
                checkTimeoutInterval: 120000,
                disableChatSigning: true
            });

            const startAI = () => {
                const interval = setInterval(async () => {
                    if (!bot.entity) return;

                    // --- ANTI-IDLE SYSTEM (Jalan & Lompat) ---
                    const action = Math.random();
                    if (action < 0.2) {
                        bot.setControlState('forward', true);
                        setTimeout(() => { if(bot.setControlState) bot.setControlState('forward', false); }, 2000);
                    } else if (action < 0.4) {
                        bot.setControlState('jump', true);
                        setTimeout(() => { if(bot.setControlState) bot.setControlState('jump', false); }, 500);
                    } else if (action < 0.5) {
                        bot.look(bot.entity.yaw + 0.5, 0); // Menoleh pelan
                    }

                    // --- AUTO EAT ---
                    if (bot.food < 15) {
                        const food = bot.inventory.items().find(i => ['bread','steak','apple','cooked_beef'].includes(i.name));
                        if (food) { await bot.equip(food, 'hand'); bot.consume(); }
                    }

                    // --- AUTO GUARD ---
                    const mob = bot.nearestEntity(e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 3.2);
                    if (mob && bot.health > 10) {
                        bot.lookAt(mob.position.offset(0, 1, 0));
                        bot.attack(mob);
                    }

                    // --- CHAT RANDOM (Low Frequency) ---
                    if (Math.random() < 0.003) {
                        bot.chat(chatDB.random[Math.floor(Math.random() * chatDB.random.length)]);
                    }
                }, 12000); 

                bot.once('end', () => clearInterval(interval));
            };

            // --- CHAT HANDLERS (Auto-Respon, Join, Leave, Death) ---
            bot.on('chat', (username, message) => {
                if (username === bot.username || activeBots.has(username)) return;
                const msg = message.toLowerCase();
                chatDB.autoRespon.forEach(r => {
                    if (r.key.some(k => msg.includes(k))) {
                        setTimeout(() => { if(bot.chat) bot.chat(r.reply[Math.floor(Math.random()*r.reply.length)]); }, 5000);
                    }
                });
            });

            bot.on('playerJoined', (player) => {
                if (activeBots.has(player.username)) return;
                if (Math.random() < 0.15) {
                    const msg = chatDB.welcome[Math.floor(Math.random()*chatDB.welcome.length)].replace('@name', player.username);
                    setTimeout(() => { if(bot.chat) bot.chat(msg); }, 8000);
                }
            });

            bot.on('playerLeft', (player) => {
                if (activeBots.has(player.username)) return;
                if (Math.random() < 0.15) {
                    const msg = chatDB.goodbye[Math.floor(Math.random()*chatDB.goodbye.length)].replace('@name', player.username);
                    setTimeout(() => { if(bot.chat) bot.chat(msg); }, 4000);
                }
            });

            bot.on('entityDead', (entity) => {
                if (entity.type === 'player' && !activeBots.has(entity.username) && Math.random() < 0.1) {
                    const msg = chatDB.death[Math.floor(Math.random()*chatDB.death.length)].replace('@name', entity.username);
                    setTimeout(() => { if(bot.chat) bot.chat(msg); }, 6000);
                }
            });

            bot.on('login', () => {
                activeBots.set(name, bot);
                console.log(`[MC-BOT] ✅ ${name} Join.`);
                setTimeout(startAI, 5000);
            });

            bot.on('death', () => setTimeout(() => { if(bot.respawn) bot.respawn(); }, 15000));

            bot.on('end', () => {
                activeBots.delete(name);
                setTimeout(() => createSingleBot(name), 100000); 
            });

            bot.on('error', () => {});
        };

        // LOGIN BERTAHAP (SANGAT PENTING: 100 DETIK)
        for (let i = 0; i < 5; i++) {
            setTimeout(() => createSingleBot(nicknames[i]), i * 100000);
        }
    }
};
                        
