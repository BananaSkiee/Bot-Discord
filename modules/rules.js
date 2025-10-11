const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    name: 'rules',
    description: 'Modul peraturan server premium',

    async execute(client) {
        // ==================== WELCOME EMBED UTAMA ====================
        const welcomeEmbed = new EmbedBuilder()
            .setTitle("🌟 **SELAMAT DATANG DI BANANASKIE COMMUNITY**")
            .setDescription(`## 🎉 Selamat Datang di Server Discord Premium!\n*Rumah bagi para penggemar Discord profesional dan komunitas berkualitas*\n\n---\n\n### 🚀 **Apa yang Kami Tawarkan:**\n• Komunitas aktif dan suportif\n• Sistem leveling yang menguntungkan\n• Game & aktivitas seru setiap hari\n• Moderasi profesional 24/7\n• Konten eksklusif untuk member setia\n\n### 📚 **Informasi Penting:**\n• Baca pedoman komunitas kami\n• Jelajahi fitur-fitur premium\n• Dapatkan role eksklusif\n• Ikuti event spesial\n\n---\n\n**🔍 Temukan informasi lebih lanjut di bawah ini ↓**`)
            .setColor(0x5865F2)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setImage('https://i.ibb.co/4wcgBZQS/6f59b29a5247.gif')
            .setFooter({ 
                text: 'BananaSkiee Community • Est. 2024 • Professional Environment', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setTimestamp();

        // Tombol untuk Welcome Embed (BAHASA INGGRIS)
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

        // Select Menu untuk informasi tambahan (3 PILIHAN SAJA)
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
                            .setEmoji('🔢')
                    )
            );

        // ==================== GUIDEBOOK PAGES ====================
        
        // GUIDEBOOK INTRODUCTION (Seperti gambar 1000165222.jpg)
        const guidebookIntro = new EmbedBuilder()
            .setTitle("📖 **GUIDEBOOK**")
            .setDescription(`Sebagai member baru server, Anda mungkin merasa sulit memahami cara server ini beroperasi.\n\nSebagai solusinya, kami mendesain modul memulai ini untuk memandu Anda melalui semua yang perlu diketahui, dari awal hingga akhir.\n\n- Klik tombol di bawah **Start Guide**\n\n---\n\n**GUIDEBOOK**\n\n---\n\n**Start Guide**\n\n*Hanya Anda yang bisa melihat ini • Dismiss message*`)
            .setColor(0x00AAFF)
            .setFooter({ 
                text: 'BananaSkiee Community • Guidebook', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 1/5 - The Basics (Seperti gambar 1000165245.png)
        const guidebookPage1 = new EmbedBuilder()
            .setTitle("📖 **THE BASICS**")
            .setDescription(`- Pelajari tentang aturan server di sini.\n\nSesuaikan role notifikasi Anda agar sesuai dengan preferensi Anda dari **Channels & Roles**\n\n---\n\n**Page 1/5**\n\n*Hanya Anda yang bisa melihat ini - Dismiss message*`)
            .setColor(0x00AAFF)
            .setFooter({ 
                text: 'BananaSkiee Community • Page 1/5 • The Basics', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 2/5 - Important Roles
        const guidebookPage2 = new EmbedBuilder()
            .setTitle("👑 **PERAN PENTING DI SERVER**")
            .setDescription(`## 🏛️ Struktur Kepemimpinan Server\n\nBerikut adalah peran-peran penting yang mengelola **BananaSkiee Community**:\n\n### <@&1352279577174605884> **Headmaster**\nPendiri & Pemilik server\n\n### <@&1352282368043389069> **Principal**  \nIndividu yang bertugas sebagai administrator server, memastikan operasi berjalan lancar tanpa gangguan\n\n### <@&1352282892935368787> **Core Team**\nIndividu yang bekerja langsung dan menawarkan layanan terkait Discord\n\n### <@&1352283202840039475> **Counselors**\nIndividu yang bertugas sebagai helper, bertanggung jawab memoderasi server dan menangani masalah melalui tickets\n\n### <@&1352283798435270709> **Hall of Fame**\nIndividu yang dikenal di seluruh komunitas Discord building\n\n### <@&1352284168234467379> **Server Bots**\nBot-bot yang melayani server ini\n\n### <@&1352284524721209436> **Students**\nRole default untuk semua member server\n\n---\n\n**Page 2/5**\n\n*Hanya Anda yang bisa melihat ini - Dismiss message*`)
            .setColor(0x9B59B6)
            .setFooter({ 
                text: 'BananaSkiee Community • Page 2/5 • Important Roles', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 3/5 - Important Channels
        const guidebookPage3 = new EmbedBuilder()
            .setTitle("📁 **CHANNEL PENTING DI SERVER**")
            .setDescription(`## 🗂️ Panduan Channel BananaSkiee Community\n\n### #📢-announcements\nSemua pengumuman terbaru dan update mengenai server akan dibagikan di sini.\n\n### #🎫-tickets\nBuat tiket di channel ini untuk berbicara dengan staff dan mendapatkan bantuan untuk masalah server.\n\n### #💬-discussion\nTempat untuk mengobrol tentang apapun yang tidak melanggar rules.\n\n### #🛠️-our-services\nAnda akan menemukan semua layanan yang kami tawarkan di sini.\n\n### #👋-introductions\nPerkenalkan diri Anda kepada komunitas di channel ini.\n\n### #❓-discord-help\nButuh bantuan? Tanyakan di sini!\n\n---\n\n**Page 3/5**\n\n*Hanya Anda yang bisa melihat ini - Dismiss message*`)
            .setColor(0x3498DB)
            .setFooter({ 
                text: 'BananaSkiee Community • Page 3/5 • Important Channels', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 4/5 - Show All Channels Guide
        const guidebookPage4 = new EmbedBuilder()
            .setTitle("🔍 **CARA MELIHAT SEMUA CHANNEL**")
            .setDescription(`## 👀 Panduan Menampilkan Semua Channel\n\nUntuk melihat semua channel di server, ikuti langkah-langkah berikut:\n\n### 📝 **Langkah-langkah:**\n1. **Klik pada nama server** (BananaSkiee Community) di bagian atas\n2. **Toggle opsi "Show All Channels"** untuk menampilkan semua channel\n3. **Nikmati akses penuh** ke semua channel yang tersedia\n\n### 🏠 **Struktur Channel Server:**\n• **#🔰-welcome** - Selamat datang!\n• **#ℹ️-info** - Informasi penting\n• **#🎉-boosts** - Info server boost\n• **#📤-uploads** - Upload konten\n• **#📢-announcements** - Pengumuman\n• **#🎫-tickets** - Bantuan staff\n• **#💬-discussion** - Diskusi umum\n• **#👋-introductions** - Perkenalan\n• **#❓-discord-help** - Bantuan Discord\n\n---\n\n**Page 4/5**\n\n*Hanya Anda yang bisa melihat ini - Dismiss message*`)
            .setColor(0xF39C12)
            .setFooter({ 
                text: 'BananaSkiee Community • Page 4/5 • Channel Guide', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 5/5 - Completion
        const guidebookPage5 = new EmbedBuilder()
            .setTitle("🎉 **SELAMAT! ANDA BERHASIL**")
            .setDescription(`## Yay! You did it!\n\nSemoga **Panduan Server** kami membantu Anda memahami sebagian besar **BananaSkiee Community**.\n\n- Jangan ragu untuk melihat pertanyaan yang sering diajukan di sini - #🔄-fags\n- Nikmati masa tinggal Anda di **BananaSkiee Community!**\n\n---\n\n**Page 5/5**\n\n*Hanya Anda yang bisa melihat ini - Dismiss message*`)
            .setColor(0x2ECC71)
            .setFooter({ 
                text: 'BananaSkiee Community • Page 5/5 • Completion', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Tombol Start Guide untuk intro
        const startGuideButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_guide')
                    .setLabel('Start Guide')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🚀')
            );

        // Tombol navigasi guidebook untuk page 1-4 (Back/Next)
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
                    .setEmoji('➡️')
            );

        // Tombol untuk page 5 (Close message)
        const guidebookClose = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guide_close')
                    .setLabel('Close this message')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        // ==================== RULES SECTION ====================
        const rulesAllowedEmbed = new EmbedBuilder()
            .setTitle('✅ **YANG BOLEH DILAKUKAN**')
            .setDescription(
                '<a:ceklis:1402332072533823640> | **Ngobrol santai** - Asal sopan dan friendly\n' +
                '<a:ceklis:1402332072533823640> | **Nge-share meme** - Yang receh tapi lucu\n' +
                '<a:ceklis:1402332072533823640> | **Nanya-nanya** - Tentang game/anime/life\n' +
                '<a:ceklis:1402332072533823640> | **Main bot** - Musik, Owo, dll (jangan spam)\n' +
                '<a:ceklis:1402332072533823640> | **Bikin event** - Tanya admin dulu\n' +
                '<a:ceklis:1402332072533823640> | **Kasih saran** - Buat server lebih baik'
            )
            .setColor(0x00FF00)
            .setFooter({ 
                text: 'BananaSkiee Community • Positive Environment', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        const rulesNotAllowedEmbed = new EmbedBuilder()
            .setTitle('❌ **YANG GAK BOLEH**')
            .setDescription(
                '<a:silang:1402332141047513150> | **Bahasa kasar** - Toxic = mute/ban\n' +
                '<a:silang:1402332141047513150> | **Spam mention** - @everyone/@admin tanpa penting\n' +
                '<a:silang:1402332141047513150> | **Ngebully** - Auto ban permanen\n' +
                '<a:silang:1402332141047513150> | **NSFW** - Foto/video/chat 18+\n' +
                '<a:silang:1402332141047513150> | **Promo random** - Kecuali di channel promo\n\n' +
                '**Catatan:**\n"Kalo ragu boleh nanya admin dulu~" 🔍'
            )
            .setColor(0xFF0000)
            .setFooter({ 
                text: 'BananaSkiee Community • Keep It Safe & Fun', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setImage('https://i.ibb.co/4wcgBZQS/6f59b29a5247.gif');

        // ==================== MODERATION POLICY SECTION ====================
        const moderationPolicyEmbed = new EmbedBuilder()
            .setTitle('📜 **PERATURAN & HUKUMAN SERVER BANANASKIE COMMUNITY**')
            .setDescription(
                '### ⚠️ SISTEM WARNING KUMULATIF\n' +
                '<a:seru:1402337929556263002> | **Warn 1** = Peringatan\n' +
                '<a:seru:1402337929556263002> | **Warn 2** = Mute 5 menit\n' +
                '<a:seru:1402337929556263002> | **Warn 3** = Mute 10 menit\n' +
                '<a:seru:1402337929556263002> | **Warn 4** = Mute 1 jam\n' +
                '<a:seru:1402337929556263002> | **Warn 5** = Mute 1 hari\n' +
                '<a:seru:1402337929556263002> | **Warn 6** = Mute 3 hari\n' +
                '<a:seru:1402337929556263002> | **Warn 7** = Softban + Mute 1 minggu\n' +
                '<a:seru:1402337929556263002> | **Warn 8** = Ban 1 hari\n' +
                '<a:seru:1402337929556263002> | **Warn 9** = Ban 3 hari\n' +
                '<a:seru:1402337929556263002> | **Warn 10** = Ban 1 minggu\n' +
                '<a:seru:1402337929556263002> | **Warn 11** = **BAN PERMANEN**\n\n' +
                '### 🔇 PELANGGARAN AUTO-MUTE\n' +
                '- **Spam/Flood** = Mute 20 menit\n' +
                '- **Bahasa NSFW** = Mute 1 hari\n' +
                '- **Kirim NSFW/Gore** = Mute 7 hari\n' +
                '- **Link scam** = Mute 3 hari\n' +
                '- **Rasis/SARA** = Mute 5 hari\n\n' +
                '### 🔨 PELANGGARAN AUTO-SOFTBAN\n' +
                '- **Spam link scam** = Mute 4 hari\n' +
                '- **Plagiarisme** = Mute 3 hari\n\n' +
                '### 🚫 PELANGGARAN AUTO-BAN\n' +
                '- **Akun/PFP NSFW** = Ban 7 hari\n' +
                '- **Akun spam NSFW** = Ban 10 hari\n\n' +
                '**📌 CATATAN PENTING:**\n' +
                '1. Semua warn akan **hangus setelah 1 bulan**\n' +
                '2. Pelanggaran **NSFW/Rasis/SARA** tidak bisa di-reset\n' +
                '3. Admin berhak memberikan hukuman tambahan sesuai tingkat pelanggaran\n\n' +
                '*(Sistem ini berlaku mulai 20 Agustus 2025)*\n\n' +
                '"Hukuman diberikan bukan untuk menyusahkan, tapi untuk menjaga kenyamanan bersama!" 🍌'
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
            .setDescription(`## 📈 Level Dari Bot <@437808476106784770>\n\nBerikut adalah role-level yang bisa Anda dapatkan berdasarkan aktivitas di server:\n\n### 👑 **LEVEL TERTINGGI**\n<@&1354196993680867370> = **Level Tertinggi 100**\n\n### 💎 **LEVEL ADVANCED**\n<@&1354197284476420106> = **Level 80**\n<@&1354197417754628176> = **Level 70**\n<@&1354197527582212106> = **Level 60**\n<@&1354197530010976521> = **Level 55**\n<@&1354197540937142503> = **Level 50**\n\n### 🥈 **LEVEL INTERMEDIATE**\n<@&1354197488264941809> = **Level 45**\n<@&1354197596536701018> = **Level 40**\n<@&1354196727753740409> = **Level 35**\n<@&1354196722716377281> = **Level 30**\n<@&1354196697340837888> = **Level 25**\n\n### 🥉 **LEVEL PEMULA**\n<@&1354196683420078324> = **Level 20**\n<@&1354196302237405285> = **Level 15**\n<@&1354196283975270624> = **Level 10**\n<@&1354196267722346578> = **Level 5**\n<@&1354196247715516617> = **Level Pertama/Level 1**`)
            .setColor(0xFFD700)
            .setFooter({ 
                text: 'BananaSkiee Community • Leveling System', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // ==================== COUNTING SECTION ====================
        const countingEmbed = new EmbedBuilder()
            .setTitle("🔢 **GAME COUNTING BANANASKIE COMMUNITY**")
            .setDescription(`## 🎮 Tantangan Counting Seru!\n\nIkuti game counting kami dan dapatkan role eksklusif berdasarkan jumlah count Anda!\n\n### 🎯 **Sistem Reward Counting:**\n• **50+ Counts**   = Role khusus\n• **100+ Counts**  = Role lebih eksklusif\n• **250+ Counts**  = Role langka\n• **500+ Counts**  = Role sangat eksklusif\n• **1000+ Counts** = Role legendaris\n\n### 📊 **Cara Bermain:**\n1. Pergi ke channel **#counting**\n2. Mulai dengan angka **1**\n3. Lanjutkan dengan angka berikutnya\n4. Jangan break sequence!\n5. Nikmati perjalanan naik level\n\n### 💎 **Keuntungan Counting:**\n• **Role eksklusif** yang keren\n• **Pengakuan** dari komunitas\n• **Special rewards** untuk top counter\n• **Sense of accomplishment** yang memuaskan`)
            .setColor(0x9B59B6)
            .setFooter({ 
                text: 'Gunakan command /user di bot-commands untuk melihat statistik counting!', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        return {
            // Embed utama yang ditampilkan di channel rules
            welcomeEmbed,
            welcomeButtons,
            infoSelectMenu,
            
            // Guidebook pages
            guidebookIntro,
            guidebookPage1,
            guidebookPage2,
            guidebookPage3,
            guidebookPage4,
            guidebookPage5,
            startGuideButton,
            guidebookNavigation,
            guidebookClose,
            
            // Rules embeds (TANPA SISTEM WARNING)
            rulesAllowedEmbed,
            rulesNotAllowedEmbed,
            
            // Moderation Policy embed (DENGAN SISTEM WARNING)
            moderationPolicyEmbed,
            
            // Additional info embeds
            levelingEmbed,
            countingEmbed
        };
    }
};
