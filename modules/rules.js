const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    name: 'rules',
    description: 'Modul peraturan server premium',

    async execute(client) {
        // ==================== WELCOME EMBED UTAMA ====================
        const welcomeEmbed = new EmbedBuilder()
            .setTitle("🌟 **SELAMAT DATANG DI BANANASKIE COMMUNITY**")
            .setDescription(`## 🎉 Welcome to Premium Discord Server!\n*Home of professional Discord enthusiasts and quality community*\n\n---\n\n### 🚀 **What We Offer:**\n• Active and supportive community\n• Rewarding leveling system  \n• Fun games & daily activities\n• Professional 24/7 moderation\n• Exclusive content for loyal members\n\n### 📚 **Important Information:**\n• Read our community guidelines\n• Explore premium features\n• Get exclusive roles\n• Join special events\n\n---\n\n**🔍 Find more information below ↓**`)
            .setColor(0x5865F2)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setImage('https://i.ibb.co/4wcgBZQS/6f59b29a5247.gif')
            .setFooter({ 
                text: 'BananaSkiee Community • Est. 2024 • Professional Environment', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        // PERBAIKAN: Tombol YouTube Membership hanya menggunakan URL
        const welcomeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guidebook_btn')
                    .setLabel('Guidebook')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📚'),
                new ButtonBuilder()
                    .setCustomId('server_rules_btn')
                    .setLabel('Server Rules')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚡'),
                new ButtonBuilder()
                    .setURL('https://discord.gg/5asgbezyR6')
                    .setLabel('YouTube Membership')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🔴')
            );

        // Select Menu untuk informasi tambahan
        const infoSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('info_select')
                    .setPlaceholder('🔍 Explore more information...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🏆 Leveling System')
                            .setDescription('Learn about leveling and achievements')
                            .setValue('leveling')
                            .setEmoji('🏆'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🛡️ Moderation Policy')
                            .setDescription('Warning system and moderation')
                            .setValue('moderation')
                            .setEmoji('🛡️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🔢 Counting Game')
                            .setDescription('Counting challenges and exclusive roles')
                            .setValue('counting')
                            .setEmoji('🔢'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🎯 Beginner Guide')
                            .setDescription('Step-by-step for new members')
                            .setValue('beginner_guide')
                            .setEmoji('🎯')
                    )
            );

        // ==================== GUIDEBOOK PAGES ====================
        
        // Page 1/5 - Guidebook Introduction
        const guidebookPage1 = new EmbedBuilder()
            .setTitle("📖 **BUKU PANDUAN BANANASKIE COMMUNITY**")
            .setDescription(`## 🚀 Panduan Lengkap untuk Member Baru\n\nSebagai member baru, Anda mungkin merasa bingung dengan cara server ini beroperasi.\n\nSebagai solusinya, kami mendesain **modul panduan ini** untuk memandu Anda melalui semua yang perlu diketahui, dari awal hingga akhir.\n\n### 🎯 **Apa yang Akan Anda Pelajari:**\n• Struktur server dan peran penting\n• Channel-channel penting yang perlu diketahui\n• Sistem leveling dan reward\n• Cara berinteraksi dengan komunitas\n• Fitur-fitur eksklusif server\n\n**Klik tombol 'Start Guide' di bawah untuk memulai!**`)
            .setColor(0x00AAFF)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Page 1/5 • Guidebook', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        // Page 2/5 - Important Roles
        const guidebookPage2 = new EmbedBuilder()
            .setTitle("👑 **PERAN PENTING DI SERVER**")
            .setDescription(`## 🏛️ Struktur Kepemimpinan Server\n\nBerikut adalah peran-peran penting yang mengelola **BananaSkiee Community**:\n\n### <@&1352279577174605884> **Headmaster**\nPendiri & Pemilik server\n\n### <@&1352282368043389069> **Principal**  \nIndividu yang bertugas sebagai administrator server, memastikan operasi berjalan lancar tanpa gangguan\n\n### <@&1352282892935368787> **Core Team**\nIndividu yang bekerja langsung dan menawarkan layanan terkait Discord\n\n### <@&1352283202840039475> **Counselors**\nIndividu yang bertugas sebagai helper, bertanggung jawab memoderasi server dan menangani masalah melalui tickets\n\n### <@&1352283798435270709> **Hall of Fame**\nIndividu yang dikenal di seluruh komunitas Discord building\n\n### <@&1352284168234467379> **Server Bots**\nBot-bot yang melayani server ini\n\n### <@&1352284524721209436> **Students**\nRole default untuk semua member server`)
            .setColor(0x9B59B6)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Page 2/5 • Important Roles', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        // Page 3/5 - Important Channels
        const guidebookPage3 = new EmbedBuilder()
            .setTitle("📁 **CHANNEL PENTING DI SERVER**")
            .setDescription(`## 🗂️ Panduan Channel BananaSkiee Community\n\n### #📢-announcements\nSemua pengumuman terbaru dan update mengenai server akan dibagikan di sini.\n\n### #🎫-tickets\nBuat tiket di channel ini untuk berbicara dengan staff dan mendapatkan bantuan untuk masalah server.\n\n### #💬-discussion\nTempat untuk mengobrol tentang apapun yang tidak melanggar rules.\n\n### #🛠️-our-services\nAnda akan menemukan semua layanan yang kami tawarkan di sini.\n\n### #👋-introductions\nPerkenalkan diri Anda kepada komunitas di channel ini.\n\n### #❓-discord-help\nButuh bantuan? Tanyakan di sini!`)
            .setColor(0x3498DB)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Page 3/5 • Important Channels', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        // Page 4/5 - Show All Channels Guide
        const guidebookPage4 = new EmbedBuilder()
            .setTitle("🔍 **CARA MELIHAT SEMUA CHANNEL**")
            .setDescription(`## 👀 Panduan Menampilkan Semua Channel\n\nUntuk melihat semua channel di server, ikuti langkah-langkah berikut:\n\n### 📝 **Langkah-langkah:**\n1. **Klik pada nama server** (BananaSkiee Community) di bagian atas\n2. **Toggle opsi "Show All Channels"** untuk menampilkan semua channel\n3. **Nikmati akses penuh** ke semua channel yang tersedia\n\n### 🏠 **Struktur Channel Server:**\n• **#🔰-welcome** - Selamat datang!\n• **#ℹ️-info** - Informasi penting\n• **#🎉-boosts** - Info server boost\n• **#📤-uploads** - Upload konten\n• **#📢-announcements** - Pengumuman\n• **#🎫-tickets** - Bantuan staff\n• **#💬-discussion** - Diskusi umum\n• **#👋-introductions** - Perkenalan\n• **#❓-discord-help** - Bantuan Discord`)
            .setColor(0xF39C12)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Page 4/5 • Channel Guide', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        // Page 5/5 - Completion
        const guidebookPage5 = new EmbedBuilder()
            .setTitle("🎉 **SELAMAT! ANDA BERHASIL**")
            .setDescription(`## ✅ Panduan Server Selesai\n\nSemoga **Panduan Server** kami membantu Anda memahami sebagian besar **BananaSkiee Community**.\n\n### 📖 **Informasi Tambahan:**\n• Jangan ragu untuk melihat pertanyaan yang sering diajukan di sini — #❓-discord-help\n• Nikmati masa tinggal Anda di **BananaSkiee Community!**\n\n### 🎯 **Langkah Selanjutnya:**\n1. **Baca rules** dengan seksama\n2. **Perkenalkan diri** di channel introductions\n3. **Jelajahi channel** yang tersedia\n4. **Ikuti aktivitas** komunitas\n5. **Naik level** dan dapatkan reward\n\n**Terima kasih telah bergabung dengan kami!** 🍌`)
            .setColor(0x2ECC71)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setImage('https://i.ibb.co/WvSvsVfH/standard-34.gif')
            .setFooter({ 
                text: 'BananaSkiee Community • Page 5/5 • Completion', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        // Tombol navigasi guidebook
        const guidebookNavigation = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guide_prev')
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️'),
                new ButtonBuilder()
                    .setCustomId('guide_next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➡️'),
                new ButtonBuilder()
                    .setCustomId('guide_close')
                    .setLabel('Close Guide')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        // Tombol start guide
        const startGuideButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_guide')
                    .setLabel('Start Guide')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🚀')
            );

        // ==================== RULES SECTION ====================
        const rulesAllowedEmbed = new EmbedBuilder()
            .setTitle('✅ **YANG BOLEH DILAKUKAN**')
            .setDescription(
                '🎯 | **Ngobrol santai** - Asal sopan dan friendly\n' +
                '🎯 | **Nge-share meme** - Yang receh tapi lucu\n' +
                '🎯 | **Nanya-nanya** - Tentang game/anime/life\n' +
                '🎯 | **Main bot** - Musik, game, dll (jangan spam)\n' +
                '🎯 | **Bikin event** - Tanya admin dulu\n' +
                '🎯 | **Kasih saran** - Buat server lebih baik\n' +
                '🎯 | **Berkolaborasi** - Untuk project bersama\n' +
                '🎯 | **Belajar bersama** - Sharing knowledge'
            )
            .setColor(0x00FF00)
            .setFooter({ 
                text: 'BananaSkiee Community • Positive Environment', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        const rulesNotAllowedEmbed = new EmbedBuilder()
            .setTitle('❌ **YANG TIDAK BOLEH DILAKUKAN**')
            .setDescription(
                '🚫 | **Bahasa kasar** - Toxic = mute/ban\n' +
                '🚫 | **Spam mention** - @everyone/@admin tanpa penting\n' +
                '🚫 | **Ngebully** - Auto ban permanen\n' +
                '🚫 | **NSFW** - Foto/video/chat 18+\n' +
                '🚫 | **Promo random** - Kecuali di channel promo\n' +
                '🚫 | **Rasis/SARA** - Zero tolerance policy\n' +
                '🚫 | **Scam/Phishing** - Langsung ban permanent\n' +
                '🚫 | **Impersonasi** - Menyamarkan identitas'
            )
            .setColor(0xFF0000)
            .setFooter({ 
                text: 'BananaSkiee Community • Keep It Safe & Fun', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        const moderationPolicyEmbed = new EmbedBuilder()
            .setTitle('📜 **PERATURAN & SISTEM MODERASI BANANASKIE COMMUNITY**')
            .setDescription(
                '### ⚠️ **SISTEM WARNING KUMULATIF**\n' +
                '🔸 | **Warn 1** = Peringatan verbal\n' +
                '🔸 | **Warn 2** = Mute 5 menit\n' +
                '🔸 | **Warn 3** = Mute 10 menit\n' +
                '🔸 | **Warn 4** = Mute 1 jam\n' +
                '🔸 | **Warn 5** = Mute 1 hari\n' +
                '🔸 | **Warn 6** = Mute 3 hari\n' +
                '🔸 | **Warn 7** = Softban + Mute 1 minggu\n' +
                '🔸 | **Warn 8** = Ban 1 hari\n' +
                '🔸 | **Warn 9** = Ban 3 hari\n' +
                '🔸 | **Warn 10** = Ban 1 minggu\n' +
                '🔸 | **Warn 11** = **BAN PERMANEN**\n\n' +
                '### 🔇 **PELANGGARAN AUTO-MUTE**\n' +
                '- **Spam/Flood** = Mute 20 menit\n' +
                '- **Bahasa NSFW** = Mute 1 hari\n' +
                '- **Kirim konten NSFW/Gore** = Mute 7 hari\n' +
                '- **Link scam/phishing** = Mute 3 hari\n' +
                '- **Konten rasis/SARA** = Mute 5 hari\n\n' +
                '### 🔨 **PELANGGARAN AUTO-SOFTBAN**\n' +
                '- **Spam link berbahaya** = Mute 4 hari\n' +
                '- **Plagiarisme konten** = Mute 3 hari\n\n' +
                '### 🚫 **PELANGGARAN AUTO-BAN**\n' +
                '- **Akun/PFP NSFW** = Ban 7 hari\n' +
                '- **Akun spam konten NSFW** = Ban 10 hari\n' +
                '- **Scamming member** = Ban permanent\n' +
                '- **Rasis/SARA berat** = Ban permanent\n\n' +
                '**📌 CATATAN PENTING:**\n' +
                '1. Semua warn akan **hangus setelah 1 bulan**\n' +
                '2. Pelanggaran **NSFW/Rasis/SARA/Scam** tidak bisa di-reset\n' +
                '3. Admin berhak memberikan hukuman tambahan sesuai tingkat pelanggaran\n' +
                '4. Semua keputusan moderator bersifat final\n\n' +
                '*(Sistem berlaku sejak bergabung di server)*\n\n' +
                '"Hukuman diberikan untuk edukasi, bukan untuk menyusahkan! Mari jaga kenyamanan bersama!" 🍌'
            )
            .setColor(0xFFA500)
            .setFooter({ 
                text: '© Copyright | BananaSkiee Community', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setImage('https://i.ibb.co/WvSvsVfH/standard-34.gif');

        // ==================== LEVELING SECTION ====================
        const levelingEmbed = new EmbedBuilder()
            .setTitle("🏆 **SISTEM LEVELING BANANASKIE COMMUNITY**")
            .setDescription(`## 📈 Level Dari Bot\n\nBerikut adalah role-level yang bisa Anda dapatkan berdasarkan aktivitas di server:\n\n### 👑 **LEVEL TERTINGGI**\n<@&1354196993680867370> = **Level Tertinggi 100**\n\n### 💎 **LEVEL ADVANCED**\n<@&1354197284476420106> = **Level 80**\n<@&1354197417754628176> = **Level 70**\n<@&1354197527582212106> = **Level 60**\n<@&1354197530010976521> = **Level 55**\n<@&1354197540937142503> = **Level 50**\n\n### 🥈 **LEVEL INTERMEDIATE**\n<@&1354197488264941809> = **Level 45**\n<@&1354197596536701018> = **Level 40**\n<@&1354196727753740409> = **Level 35**\n<@&1354196722716377281> = **Level 30**\n<@&1354196697340837888> = **Level 25**\n\n### 🥉 **LEVEL PEMULA**\n<@&1354196683420078324> = **Level 20**\n<@&1354196302237405285> = **Level 15**\n<@&1354196283975270624> = **Level 10**\n<@&1354196267722346578> = **Level 5**\n<@&1354196247715516617> = **Level Pertama/Level 1**`)
            .setColor(0xFFD700)
            .setFooter({ 
                text: 'BananaSkiee Community • Leveling System', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        // ==================== COUNTING SECTION ====================
        const countingEmbed = new EmbedBuilder()
            .setTitle("🔢 **GAME COUNTING BANANASKIE COMMUNITY**")
            .setDescription(`## 🎮 Tantangan Counting Seru!\n\nIkuti game counting kami dan dapatkan role eksklusif berdasarkan jumlah count Anda!\n\n### 🎯 **Sistem Reward Counting:**\n• **50+ Counts**   = Role khusus\n• **100+ Counts**  = Role lebih eksklusif\n• **250+ Counts**  = Role langka\n• **500+ Counts**  = Role sangat eksklusif\n• **1000+ Counts** = Role legendaris\n\n### 📊 **Cara Bermain:**\n1. Pergi ke channel **#counting**\n2. Mulai dengan angka **1**\n3. Lanjutkan dengan angka berikutnya\n4. Jangan break sequence!\n5. Nikmati perjalanan naik level\n\n### 💎 **Keuntungan Counting:**\n• **Role eksklusif** yang keren\n• **Pengakuan** dari komunitas\n• **Special rewards** untuk top counter\n• **Sense of accomplishment** yang memuaskan`)
            .setColor(0x9B59B6)
            .setFooter({ 
                text: 'Gunakan command /user di bot-commands untuk melihat statistik counting!', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        return {
            // Embed utama yang ditampilkan di channel rules
            welcomeEmbed,
            welcomeButtons,
            infoSelectMenu,
            
            // Guidebook pages
            guidebookPage1,
            guidebookPage2,
            guidebookPage3,
            guidebookPage4,
            guidebookPage5,
            guidebookNavigation,
            startGuideButton,
            
            // Rules embeds
            rulesAllowedEmbed,
            rulesNotAllowedEmbed,
            moderationPolicyEmbed,
            
            // Additional info embeds
            levelingEmbed,
            countingEmbed
        };
    }
};
