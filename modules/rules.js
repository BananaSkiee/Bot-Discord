const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    name: 'rules',
    description: 'Modul peraturan server premium',

    async execute(client) {
        // ==================== WELCOME EMBED UTAMA ====================
        const welcomeEmbed = new EmbedBuilder()
            .setTitle("🌟 **SELAMAT DATANG DI KOMUNITAS KAMI**")
            .setDescription(`## 🎉 Selamat Bergabung di Server Premium!\n*Tempat berkumpulnya para profesional dan enthusiast Discord*\n\n---\n\n### 🚀 **Apa yang Kami Tawarkan:**\n• Komunitas aktif dan supportive\n• Sistem leveling yang rewarding  \n• Game & aktivitas seru setiap hari\n• Moderasi profesional 24/7\n• Konten eksklusif untuk member setia\n\n### 📚 **Informasi Penting:**\n• Baca pedoman komunitas kami\n• Jelajahi fitur-fitur premium\n• Dapatkan role eksklusif\n• Ikuti event spesial\n\n---\n\n**🔍 Temukan informasi lebih lanjut di bawah ini ↓**`)
            .setColor(0x5865F2)
            .setThumbnail('https://i.imgur.com/1M8Yh6u.png')
            .setImage('https://i.imgur.com/3ZQZ9j2.png')
            .setFooter({ 
                text: 'Premium Community • Est. 2024 • Professional Environment', 
                iconURL: 'https://i.imgur.com/1M8Yh6u.png' 
            })
            .setTimestamp();

        // Tombol untuk Welcome Embed
        const welcomeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guidebook_btn')
                    .setLabel('📚 Buku Panduan')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📚'),
                new ButtonBuilder()
                    .setCustomId('server_rules_btn')
                    .setLabel('⚡ Peraturan Server')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚡'),
                new ButtonBuilder()
                    .setCustomId('yt_membership_btn')
                    .setLabel('🔴 YouTube Membership')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔴')
            );

        // Select Menu untuk informasi tambahan
        const infoSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('info_select')
                    .setPlaceholder('🔍 Jelajahi informasi penting lainnya...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🏆 Sistem Leveling & Rank')
                            .setDescription('Pelajari sistem leveling dan achievement')
                            .setValue('leveling')
                            .setEmoji('🏆'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🛡️ Kebijakan Moderasi')
                            .setDescription('Sistem peringatan dan moderasi')
                            .setValue('moderation')
                            .setEmoji('🛡️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🔢 Game Counting & Reward')
                            .setDescription('Tantangan counting dan role eksklusif')
                            .setValue('counting')
                            .setEmoji('🔢'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🎯 Panduan Pemula')
                            .setDescription('Langkah-langkah untuk member baru')
                            .setValue('beginner_guide')
                            .setEmoji('🎯')
                    )
            );

        // ==================== GUIDEBOOK SECTION ====================
        const guidebookEmbed = new EmbedBuilder()
            .setTitle("📖 **BUKU PANDUAN KOMUNITAS PREMIUM**")
            .setDescription(`## 🚀 Panduan Lengkap untuk Member Baru\n\nKami memahami bahwa bergabung dengan komunitas baru bisa menjadi pengalaman yang menantang. **Buku panduan ini** akan memandu Anda melalui semua yang perlu diketahui tentang server premium kami.\n\n### 🎯 **Tujuan Kami:**\nMenciptakan lingkungan komunitas yang profesional, supportive, dan menyenangkan bagi semua member.\n\n### 💫 **Yang Akan Anda Dapatkan:**\n• Akses ke komunitas eksklusif\n• Konten dan resource premium\n• Networking dengan member berkualitas\n• Pengalaman Discord terbaik\n\n### 📝 **Cara Memulai:**\n1. Baca peraturan server dengan seksama\n2. Perkenalkan diri di channel #perkenalan\n3. Jelajahi berbagai channel yang tersedia\n4. Ikuti aktivitas dan event komunitas\n5. Naik level dan dapatkan reward eksklusif`)
            .setColor(0x00AAFF)
            .setThumbnail('https://i.imgur.com/2M8Yh6u.png')
            .setFooter({ 
                text: 'Mari mulai perjalanan menarik Anda di komunitas kami!', 
                iconURL: 'https://i.imgur.com/1M8Yh6u.png' 
            })
            .setTimestamp();

        const guideButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_guide')
                    .setLabel('🚀 Mulai Panduan Interaktif')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🚀')
            );

        // ==================== GUIDELINES SECTION ====================
        const guidelinesEmbed = new EmbedBuilder()
            .setTitle("📜 **PEDOMAN KOMUNITAS PREMIUM**")
            .setDescription(`## 🛡️ Aturan & Etika Komunitas\n\nUntuk menjaga kenyamanan dan keamanan semua member, kami menerapkan pedoman komunitas yang profesional. **Kepatuhan terhadap aturan ini sangat dihargai dan diperlukan.**\n\n---`)
            .setColor(0xFF6B35)
            .addFields(
                {
                    name: '👑 **1. HORMATI SESAMA MEMBER**',
                    value: 'Perlakukan semua member dengan hormat dan profesionalisme tinggi. Bullying, harassment, atau perilaku tidak sopan **tidak akan ditoleransi**.',
                    inline: false
                },
                {
                    name: '🔞 **2. KONTEN RAMAH KELUARGA**',
                    value: 'Jaga semua konten tetap appropriate untuk semua usia. NSFW content, konten dewasa, atau material tidak pantas **dilarang keras** di seluruh server.',
                    inline: false
                },
                {
                    name: '💬 **3. BAHASA YANG SOPAN**',
                    value: 'Gunakan bahasa Indonesia yang baik, sopan, dan konstruktif dalam setiap percakapan. Hindari kata-kata kasar dan tidak pantas.',
                    inline: false
                },
                {
                    name: '🚫 **4. ANTI SPAM & FLOOD**',
                    value: 'Hindari spam message, emoji berlebihan, caps lock, atau link yang dapat mengganggu kenyamanan komunitas.',
                    inline: false
                },
                {
                    name: '📢 **5. TIDAK ADA PROMOSI**',
                    value: 'Dilarang beriklan, promosi, atau membagikan link tanpa izin dari tim moderasi. Ini termasuk server Discord lain.',
                    inline: false
                },
                {
                    name: '🎭 **6. LARANGAN IMPERSONASI**',
                    value: 'Jangan menyamar sebagai staff, admin, atau member lain. Identitas asli harus dijaga.',
                    inline: false
                },
                {
                    name: '❤️ **7. LINGKUNGAN POSITIF**',
                    value: 'Jaga diskusi tetap positif, konstruktif, dan hindari topik sensitif yang dapat menimbulkan konflik.',
                    inline: false
                },
                {
                    name: '📩 **8. PRIVASI & ETIKA DM**',
                    value: 'Hormati privasi member lain. Hindari DM yang tidak diinginkan atau mengganggu.',
                    inline: false
                },
                {
                    name: '⚖️ **9. KONSEKUENSI PELANGGARAN**',
                    value: 'Pelanggaran aturan akan mendapatkan konsekuensi sesuai tingkat kesalahan, mulai dari peringatan hingga ban permanent.',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Dengan bergabung di server ini, Anda menyetujui semua pedoman di atas', 
                iconURL: 'https://i.imgur.com/1M8Yh6u.png' 
            })
            .setTimestamp();

        // ==================== LEVELING SECTION ====================
        const levelingEmbed = new EmbedBuilder()
            .setTitle("🏆 **SISTEM LEVELING & PRESTASI**")
            .setDescription(`## 🌟 Naik Level & Dapatkan Reward Eksklusif!\n\nTingkatkan level Anda dengan berpartisipasi aktif dalam komunitas kami! Semakin sering berinteraksi, semakin tinggi level yang akan Anda capai dan semakin eksklusif reward yang Anda dapatkan.\n\n---`)
            .setColor(0xFFD700)
            .addFields(
                { 
                    name: '🎯 **TINGKAT PEMULA**', 
                    value: '**Level 1-10** - Dasar dan Pengenalan\n• **Level 2**  🎯 `@Pemula`\n• **Level 5**  🚀 `@Menengah`\n• **Level 10** 💪 `@Mahir`', 
                    inline: false 
                },
                { 
                    name: '🏅 **TINGKAT ADVANCED**', 
                    value: '**Level 11-50** - Perjalanan Menuju Elite\n• **Level 20** 🔥 `@Expert`\n• **Level 35** 🏅 `@Master`\n• **Level 50** 👑 `@Legenda`', 
                    inline: false 
                },
                {
                    name: '💫 **CARA NAIK LEVEL**',
                    value: '• **Aktif berkomunikasi** di text channels\n• **Ikuti event** dan aktivitas komunitas\n• **Bantu member lain** yang membutuhkan\n• **Tetap positif** dan konstruktif dalam interaksi\n• **Ikuti game** dan challenge yang tersedia',
                    inline: false
                },
                {
                    name: '🎁 **REWARD EKSKLUSIF**',
                    value: '• **Role warna-warni** yang mencolok\n• **Akses channel** khusus level tertentu\n• **Permission tambahan** yang useful\n• **Badge prestasi** di profil Discord\n• **Special mention** dalam event komunitas',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Gunakan command /rank untuk mengecek progress level Anda!', 
                iconURL: 'https://i.imgur.com/1M8Yh6u.png' 
            })
            .setTimestamp();

        // ==================== MODERATION POLICY SECTION ====================
        const modPolicyEmbed = new EmbedBuilder()
            .setTitle("🛡️ **SISTEM MODERASI & PERINGATAN**")
            .setDescription(`## ⚖️ Sistem Moderasi Profesional\n\nKami menerapkan sistem moderasi otomatis yang profesional untuk menjaga kenyamanan dan keamanan komunitas. Setiap pelanggaran akan dicatat secara sistematis dan mendapatkan konsekuensi yang proporsional.\n\n---`)
            .setColor(0x4ECDC4)
            .addFields(
                {
                    name: '📋 **SISTEM 5 TINGKAT PERINGATAN**',
                    value: 'Setiap pelanggaran akan mendapatkan konsekuensi sesuai tingkat kesalahan',
                    inline: false
                },
                {
                    name: '⚠️ **TINGKAT 1 - PERINGATAN LISAN**',
                    value: '**Konsekuensi:** Pemberitahuan dan edukasi tentang aturan\n**Durasi:** Instant\n**Untuk:** Pelanggaran ringan pertama kali',
                    inline: false
                },
                {
                    name: '⏰ **TINGKAT 2 - MUTE 1 JAM**',
                    value: '**Konsekuensi:** Tidak bisa chat selama 1 jam\n**Durasi:** 60 menit\n**Untuk:** Pelanggaran berulang atau agak serius',
                    inline: false
                },
                {
                    name: '🕐 **TINGKAT 3 - MUTE 1 HARI**',
                    value: '**Konsekuensi:** Tidak bisa chat selama 24 jam\n**Durasi:** 1 hari\n**Untuk:** Pelanggaran serius atau berulang',
                    inline: false
                },
                {
                    name: '📅 **TINGKAT 4 - MUTE 7 HARI**',
                    value: '**Konsekuensi:** Tidak bisa chat selama 7 hari\n**Durasi:** 7 hari\n**Untuk:** Pelanggaran berat atau berulang',
                    inline: false
                },
                {
                    name: '🚫 **TINGKAT 5 - BAN PERMANENT**',
                    value: '**Konsekuensi:** Dikeluarkan dari server permanent\n**Durasi:** Permanent\n**Untuk:** Pelanggaran ekstrem atau berbahaya',
                    inline: false
                },
                {
                    name: '🎯 **TUJUAN KAMI**',
                    value: 'Sistem ini dibuat untuk **edukasi dan perbaikan**, bukan punishment semata. Kami percaya setiap member bisa menjadi lebih baik.',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Moderasi yang adil untuk komunitas yang nyaman', 
                iconURL: 'https://i.imgur.com/1M8Yh6u.png' 
            })
            .setTimestamp();

        // ==================== COUNTING SECTION ====================
        const countingEmbed = new EmbedBuilder()
            .setTitle("🔢 **GAME COUNTING & ROLE EKSKLUSIF**")
            .setDescription(`## 🎮 Tantangan Counting Seru!\n\nIkuti tantangan counting seru kami dan unlock role eksklusif yang menunjukkan dedikasi dan konsistensi Anda! Setiap angka yang Anda count membawa Anda lebih dekat ke prestasi berikutnya.\n\n---`)
            .setColor(0x9B59B6)
            .addFields(
                {
                    name: '🎯 **TINGKAT PEMULA**',
                    value: 'Perjalanan awal menuju counting expert\n• **50+ Counts**   🧪 `@Elixir`\n• **125+ Counts**  🟡 `@Amber`\n• **250+ Counts**  ♟️ `@Gambit`',
                    inline: false
                },
                {
                    name: '🏅 **TINGKAT ADVANCED**',
                    value: 'Level untuk counting enthusiast sejati\n• **500+ Counts**  ⚡ `@Odin`\n• **750+ Counts**  🚶 `@Walker`\n• **1000+ Counts** 🐆 `@Jaguar`',
                    inline: false
                },
                {
                    name: '👑 **TINGKAT LEGENDARY**',
                    value: 'Elite counter dengan dedikasi tinggi\n• **1500+ Counts** 🐉 `@Dragon`\n• **2000+ Counts** 🌟 `@Superstar`\n• **3000+ Counts** 👾 `@Alien`',
                    inline: false
                },
                {
                    name: '📊 **CARA MULAI COUNTING**',
                    value: '1. Pergi ke channel **#counting**\n2. Mulai dengan angka **1**\n3. Lanjutkan dengan angka berikutnya\n4. Jangan break sequence!\n5. Nikmati perjalanan naik level',
                    inline: false
                },
                {
                    name: '💎 **KEUNTUNGAN COUNTING**',
                    value: '• **Role eksklusif** yang keren\n• **Pengakuan** dari komunitas\n• **Special rewards** untuk top counter\n• **Sense of accomplishment** yang memuaskan',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Gunakan command /user di bot-commands untuk melihat statistik counting Anda!', 
                iconURL: 'https://i.imgur.com/1M8Yh6u.png' 
            })
            .setTimestamp();

        // ==================== BEGINNER GUIDE SECTION ====================
        const beginnerGuideEmbed = new EmbedBuilder()
            .setTitle("🎯 **PANDUAN LENGKAP UNTUK PEMULA**")
            .setDescription(`## 🚀 Langkah Awal di Komunitas Kami\n\nPanduan step-by-step untuk membantu Anda memulai perjalanan di komunitas premium kami dengan lancar dan menyenangkan.\n\n---`)
            .setColor(0x00FF88)
            .addFields(
                {
                    name: '📖 **LANGKAH 1 - BACA PEDOMAN**',
                    value: 'Baca dan pahami **peraturan server** dengan seksama. Ini penting untuk menghindari kesalahan dan membuat pengalaman lebih menyenangkan.',
                    inline: false
                },
                {
                    name: '👋 **LANGKAH 2 - PERKENALAN DIRI**',
                    value: 'Kenalkan diri Anda di channel **#perkenalan**. Ceritakan minat, hobi, atau alasan bergabung dengan kami.',
                    inline: false
                },
                {
                    name: '💬 **LANGKAH 3 - MULAI BERINTERAKSI**',
                    value: 'Jelajahi berbagai channel dan mulai berinteraksi dengan member lain. Jangan ragu untuk bertanya atau berdiskusi.',
                    inline: false
                },
                {
                    name: '🎮 **LANGKAH 4 - IKUTI AKTIVITAS**',
                    value: 'Coba berbagai game yang tersedia seperti **counting**, leveling system, dan event komunitas lainnya.',
                    inline: false
                },
                {
                    name: '🏆 **LANGKAH 5 - NAIK LEVEL**',
                    value: 'Dapatkan role dan reward eksklusif dengan aktif berpartisipasi dalam komunitas.',
                    inline: false
                },
                {
                    name: '❓ **BUTUH BANTUAN?**',
                    value: 'Jika ada pertanyaan atau kendala:\n• Gunakan channel **#bantuan**\n• DM staff yang online\n• Buat ticket support',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Selamat menikmati pengalaman premium di komunitas kami!', 
                iconURL: 'https://i.imgur.com/1M8Yh6u.png' 
            })
            .setTimestamp();

        return {
            // Embed utama yang ditampilkan di channel rules
            welcomeEmbed,
            welcomeButtons,
            infoSelectMenu,
            
            // Embed untuk button interactions
            guidebookEmbed,
            guideButton,
            guidelinesEmbed,
            levelingEmbed,
            modPolicyEmbed,
            countingEmbed,
            beginnerGuideEmbed
        };
    }
};
