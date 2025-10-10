const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    name: 'rules',
    description: 'Modul peraturan server',

    async execute(client) {
        // ==================== WELCOME SECTION ====================
        // Header Welcome
        const welcomeHeaderEmbed = new EmbedBuilder()
            .setTitle("🌟 **SELAMAT DATANG**")
            .setDescription("## 🎉 Selamat Datang di Komunitas Eksklusif Kami!\n*Server premium yang dibangun dengan passion dan dedikasi tinggi*\n\n---\n\n### 🏆 **Sistem Leveling & Prestasi**\nDapatkan pengalaman terbaik dengan naik level dan unlock achievement\n\n### 🛡️ **Kebijakan Moderasi**\nJelajahi pedoman komunitas kami yang profesional dan berkelas\n\n### 🔢 **Game Counting & Rewards**\nBergabunglah dalam tantangan seru dan raih role eksklusif\n\n---\n\n**Temukan informasi lebih lanjut di bawah ini ↓**")
            .setColor(0x0099FF)
            .setThumbnail('https://i.imgur.com/example.png')
            .setFooter({ text: 'Premium Community • Est. 2024', iconURL: 'https://i.imgur.com/example.png' });

        // Welcome Main Embed
        const welcomeMainEmbed = new EmbedBuilder()
            .setTitle("🎊 **Selamat Datang di Komunitas Kami!**")
            .setDescription("Kami dengan bangga mempersembahkan server Discord premium yang menghadirkan pengalaman komunitas terbaik untuk Anda!\n\n**✨ Yang Kami Tawarkan:**\n• Lingkungan komunitas yang sopan dan berkelas\n• Sistem leveling yang rewarding\n• Game dan aktivitas seru setiap hari\n• Moderasi profesional 24/7\n• Konten eksklusif untuk member setia")
            .setColor(0x0099FF)
            .addFields(
                { name: '📺 **YouTube Channel**', value: 'Dapatkan update konten terbaru dan behind-the-scenes', inline: true },
                { name: '💬 **Komunitas Aktif**', value: 'Bergabung dengan ribuan member lainnya', inline: true },
                { name: '🎮 **Aktivitas Seru**', value: 'Event dan game menarik setiap minggu', inline: true }
            )
            .setImage('https://i.imgur.com/example-banner.png')
            .setFooter({ text: 'Bergabunglah dalam perjalanan menarik kami!', iconURL: 'https://i.imgur.com/example.png' });

        // Welcome Buttons
        const welcomeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guidebook_btn')
                    .setLabel('📚 Buku Panduan')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('server_rules_btn')
                    .setLabel('⚡ Peraturan Server')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('yt_membership_btn')
                    .setLabel('🔴 Membership YouTube')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Select Menu untuk Find More Info
        const infoSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('info_select')
                    .setPlaceholder('🔍 Temukan informasi lebih lanjut di sini...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🏆 Leveling Info & Ranks')
                            .setDescription('Sistem leveling dan achievement rewards')
                            .setValue('leveling'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🛡️ Moderation Policy')
                            .setDescription('Kebijakan moderasi dan sistem peringatan')
                            .setValue('moderation'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🔢 Counting & Perks')
                            .setDescription('Game counting dan role eksklusif')
                            .setValue('counting')
                    )
            );

        // ==================== GUIDEBOOK SECTION ====================
        const guidebookEmbed = new EmbedBuilder()
            .setTitle("📖 **Buku Panduan Komunitas**")
            .setDescription("Selamat datang, member baru! Kami memahami bahwa bergabung dengan komunitas baru bisa terasa menantang. **Buku panduan ini** akan memandu Anda melalui semua yang perlu diketahui tentang server kami.")
            .setColor(0x00FF00)
            .addFields(
                { name: '🎯 **Tujuan Kami**', value: 'Menghadirkan pengalaman komunitas terbaik dengan standar profesional tertinggi' },
                { name: '💫 **Yang Akan Anda Dapatkan**', value: 'Akses ke komunitas eksklusif, konten premium, dan networking berkualitas' },
                { name: '🚀 **Langkah Pertama**', value: 'Ikuti panduan di bawah untuk memulai perjalanan Anda' }
            )
            .setFooter({ text: 'Mari mulai petualangan menarik Anda!', iconURL: 'https://i.imgur.com/example.png' });

        const guideButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_guide')
                    .setLabel('🚀 Mulai Panduan')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📚')
            );

        // ==================== GUIDELINES SECTION ====================
        const guidelinesEmbed = new EmbedBuilder()
            .setTitle("📜 **Pedoman Komunitas Premium**")
            .setDescription("Untuk menjaga kenyamanan dan keamanan semua member, kami menerapkan pedoman komunitas yang profesional. **Kepatuhan terhadap aturan ini sangat dihargai.**")
            .setColor(0xFF6B6B)
            .addFields(
                {
                    name: '👑 **1. Hormat & Profesionalisme**',
                    value: 'Perlakukan semua member dengan hormat dan profesional. Bullying, harassment, atau perilaku tidak sopan tidak akan ditoleransi.',
                    inline: false
                },
                {
                    name: '🔞 **2. Konten Ramah Keluarga**',
                    value: 'Jaga semua konten tetap appropriate untuk semua usia. NSFW content dilarang keras di seluruh server.',
                    inline: false
                },
                {
                    name: '💬 **3. Bahasa yang Sopan**',
                    value: 'Gunakan bahasa yang baik, sopan, dan konstruktif dalam setiap percakapan.',
                    inline: false
                },
                {
                    name: '🚫 **4. Anti Spam**',
                    value: 'Hindari spam message, emoji, atau link yang dapat mengganggu kenyamanan komunitas.',
                    inline: false
                },
                {
                    name: '📢 **5. Tidak Ada Iklan**',
                    value: 'Dilarang beriklan atau promosi tanpa izin dari tim moderasi.',
                    inline: false
                },
                {
                    name: '🎭 **6. Larangan Impersonasi**',
                    value: 'Jangan menyamar sebagai staff, admin, atau member lain.',
                    inline: false
                },
                {
                    name: '❤️ **7. Lingkungan Positif**',
                    value: 'Jaga diskusi tetap positif dan hindari topik sensitif yang dapat menimbulkan konflik.',
                    inline: false
                },
                {
                    name: '📩 **8. Privasi & Etika DM**',
                    value: 'Hormati privasi member lain dan hindari DM yang tidak diinginkan.',
                    inline: false
                }
            )
            .setFooter({ text: 'Dengan bergabung, Anda menyetujui semua pedoman di atas', iconURL: 'https://i.imgur.com/example.png' });

        // ==================== LEVELING SECTION ====================
        const levelingEmbed = new EmbedBuilder()
            .setTitle("🌟 **Sistem Leveling & Prestasi**")
            .setDescription("Tingkatkan level Anda dengan berpartisipasi aktif dalam komunitas kami! Semakin sering berinteraksi, semakin tinggi level yang akan Anda capai.")
            .setColor(0xFFD700)
            .addFields(
                { 
                    name: '📊 **Tingkat Pemula**', 
                    value: '**Level 2** - 🎯 `@Pemula`\n**Level 5** - 🚀 `@Menengah`\n**Level 10** - 💪 `@Mahir`', 
                    inline: true 
                },
                { 
                    name: '🏆 **Tingkat Advanced**', 
                    value: '**Level 20** - 🔥 `@Expert`\n**Level 35** - 🏅 `@Master`\n**Level 50** - 👑 `@Legenda`', 
                    inline: true 
                },
                {
                    name: '💫 **Cara Naik Level**',
                    value: '• Aktif berkomunikasi di text channels\n• Ikuti event dan aktivitas komunitas\n• Bantu member lain yang membutuhkan\n• Tetap positif dan konstruktif',
                    inline: false
                }
            )
            .setFooter({ text: 'Gunakan command /rank untuk mengecek progress level Anda!', iconURL: 'https://i.imgur.com/example.png' });

        // ==================== MODERATION POLICY SECTION ====================
        const modPolicyEmbed = new EmbedBuilder()
            .setTitle("🛡️ **Sistem Moderasi & Peringatan**")
            .setDescription("Kami menerapkan sistem moderasi otomatis yang profesional untuk menjaga kenyamanan komunitas. Setiap pelanggaran akan dicatat secara sistematis.")
            .setColor(0x4ECDC4)
            .addFields(
                {
                    name: '📋 **Sistem 5 Tingkat Peringatan**',
                    value: 'Setiap pelanggaran akan mendapatkan konsekuensi yang proporsional',
                    inline: false
                },
                {
                    name: '⚠️ **Tingkat 1**',
                    value: '**Peringatan Lisan**\nPemberitahuan dan edukasi tentang aturan',
                    inline: true
                },
                {
                    name: '⏰ **Tingkat 2**',
                    value: '**Diamkan 1 Jam**\nWaktu untuk refleksi dan pendinginan',
                    inline: true
                },
                {
                    name: '🕐 **Tingkat 3**',
                    value: '**Diamkan 1 Hari**\nKonsekuensi untuk pelanggaran serius',
                    inline: true
                },
                {
                    name: '📅 **Tingkat 4**',
                    value: '**Diamkan 7 Hari**\nPelanggaran berulang atau berat',
                    inline: true
                },
                {
                    name: '🚫 **Tingkat 5**',
                    value: '**Ban Permanent**\nTindakan terakhir untuk pelanggaran ekstrem',
                    inline: true
                }
            )
            .setFooter({ text: 'Tujuan kami adalah edukasi, bukan punishment', iconURL: 'https://i.imgur.com/example.png' });

        // ==================== COUNTING SECTION ====================
        const countingEmbed = new EmbedBuilder()
            .setTitle("🔢 **Game Counting & Role Eksklusif**")
            .setDescription("Ikuti tantangan counting seru kami dan unlock role eksklusif yang menunjukkan dedikasi Anda! Setiap angka membawa Anda lebih dekat ke prestasi berikutnya.")
            .setColor(0x9B59B6)
            .addFields(
                {
                    name: '🎯 **Tingkat Pemula**',
                    value: '**50+ Counts** - 🧪 `@Elixir`\n**125+ Counts** - 🟡 `@Amber`\n**250+ Counts** - ♟️ `@Gambit`',
                    inline: true
                },
                {
                    name: '🏅 **Tingkat Advanced**',
                    value: '**500+ Counts** - ⚡ `@Odin`\n**750+ Counts** - 🚶 `@Walker`\n**1000+ Counts** - 🐆 `@Jaguar`',
                    inline: true
                },
                {
                    name: '📊 **Cek Progress Anda**',
                    value: 'Gunakan command `/user` di channel bot-commands untuk melihat statistik counting terbaru Anda!',
                    inline: false
                }
            )
            .setFooter({ text: 'Semakin tinggi count, semakin eksklusif role yang Anda dapatkan!', iconURL: 'https://i.imgur.com/example.png' });

        return {
            welcomeHeaderEmbed,
            welcomeMainEmbed,
            welcomeButtons,
            infoSelectMenu,
            guidebookEmbed,
            guideButton,
            guidelinesEmbed,
            levelingEmbed,
            modPolicyEmbed,
            countingEmbed
        };
    }
};
