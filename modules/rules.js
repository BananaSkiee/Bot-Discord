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
        
        // GUIDEBOOK INTRODUCTION (Professional Design)
        const guidebookIntro = new EmbedBuilder()
            .setTitle("📖 **GUIDEBOOK**")
            .setDescription(`## Getting Started\n\nSebagai member baru, Anda mungkin merasa bingung dengan cara server ini beroperasi.\n\nKami telah menyiapkan **panduan interaktif** untuk membantu Anda memahami segala hal tentang komunitas kami.\n\n**🎯 Yang akan Anda pelajari:**\n• Struktur dan organisasi server\n• Fitur-fitur penting yang tersedia\n• Cara berinteraksi dengan komunitas\n• Sistem reward dan leveling\n\n**👉 Langkah selanjutnya:**\nKlik tombol **Start Guide** di bawah untuk memulai perjalanan Anda!`)
            .setColor(0x00AAFF)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Interactive Guide • Page 1/6', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 1/5 - The Basics (Professional Design)
        const guidebookPage1 = new EmbedBuilder()
            .setTitle("📚 **DASAR-DASAR SERVER**")
            .setDescription(`## Essential Information\n\n**📖 Pelajari Aturan:**\nBaca dan pahami pedoman komunitas kami untuk pengalaman terbaik.\n\n**⚙️ Sesuaikan Preferensi:**\nAtur role notifikasi sesuai keinginan Anda melalui **Channels & Roles**.\n\n**🎯 Tips untuk Pemula:**\n• Jelajahi semua channel yang tersedia\n• Kenali struktur role dan hierarki\n• Pahami sistem moderasi yang berlaku\n• Manfaatkan fitur-fitur premium`)
            .setColor(0x3498DB)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Interactive Guide • Page 2/6', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 2/5 - Important Roles
        const guidebookPage2 = new EmbedBuilder()
            .setTitle("👑 **STRUKTUR KEPEMIMPINAN**")
            .setDescription(`## Leadership Hierarchy\n\n**🏛️ Tim Management:**\n<@&1352279577174605884> **Headmaster** - Founder & Owner\n<@&1352282368043389069> **Principal** - Server Administrators\n<@&1352282892935368787> **Core Team** - Discord Specialists\n\n**🛡️ Tim Support:**\n<@&1352283202840039475> **Counselors** - Community Moderators\n<@&1352283798435270709> **Hall of Fame** - Recognized Members\n\n**🤖 Sistem & Default:**\n<@&1352284168234467379> **Server Bots** - Automated Systems\n<@&1352284524721209436> **Students** - Community Members`)
            .setColor(0x9B59B6)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Interactive Guide • Page 3/6', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 3/5 - Important Channels
        const guidebookPage3 = new EmbedBuilder()
            .setTitle("📁 **STRUKTUR CHANNEL**")
            .setDescription(`## Channel Organization\n\n**📢 Informasi & Update:**\n• **#announcements** - Pengumuman resmi\n• **#info** - Informasi penting server\n\n**💬 Interaksi Komunitas:**\n• **#discussion** - Diskusi umum\n• **#introductions** - Perkenalan member\n• **#help** - Bantuan & support\n\n**🎫 Layanan & Support:**\n• **#tickets** - Bantuan staff\n• **#services** - Layanan yang tersedia\n\n**🔧 Utility & Sistem:**\n• **#bot-commands** - Perintah bot\n• **#counting** - Game komunitas`)
            .setColor(0xE74C3C)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Interactive Guide • Page 4/6', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 4/5 - Navigation Guide
        const guidebookPage4 = new EmbedBuilder()
            .setTitle("🔍 **PANDUAN NAVIGASI**")
            .setDescription(`## Optimalkan Pengalaman Anda\n\n**👀 Tampilkan Semua Channel:**\n1. Klik nama server di sidebar\n2. Aktifkan opsi **"Show All Channels"**\n3. Akses penuh semua channel tersedia\n\n**🎯 Channel Utama yang Perlu Diketahui:**\n• **Welcome** - Titik awal kedatangan\n• **Announcements** - Update terbaru\n• **Discussion** - Pusat interaksi\n• **Tickets** - Support langsung\n• **Help** - Bantuan komunitas\n\n**💡 Tips Navigasi:**\n• Gunakan search untuk temukan channel\n• Bookmark channel favorit\n• Ikuti category untuk organisasi`)
            .setColor(0xF39C12)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Interactive Guide • Page 5/6', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // Page 5/5 - Completion
        const guidebookPage5 = new EmbedBuilder()
            .setTitle("🎉 **PANDUAN SELESAI**")
            .setDescription(`## Welcome to the Community!\n\n**✅ Anda telah menyelesaikan panduan!**\n\nSekarang Anda telah memahami struktur dasar **BananaSkiee Community** dan siap untuk berpartisipasi penuh dalam komunitas kami.\n\n**📚 Informasi Tambahan:**\n• Kunjungi **#faq** untuk pertanyaan umum\n• Jelajahi channel sesuai minat Anda\n• Jangan ragu bertanya di **#help**\n\n**🌟 Selanjutnya:**\nMulai berinteraksi dengan komunitas dan nikmati semua fitur premium yang tersedia!\n\n*"Great community experiences start with great understanding!"* 🍌`)
            .setColor(0x2ECC71)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setImage('https://i.ibb.co/WvSvsVfH/standard-34.gif')
            .setFooter({ 
                text: 'BananaSkiee Community • Interactive Guide • Page 6/6', 
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
                    .setLabel('Complete Guide')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

        // ==================== RULES SECTION ====================
        const rulesAllowedEmbed = new EmbedBuilder()
            .setTitle('✅ **STANDAR KOMUNITAS**')
            .setDescription(`## Aktivitas yang Didukung\n\n<a:ceklis:1402332072533823640> **Komunikasi Santai**\nInteraksi sopan dan membangun komunitas\n\n<a:ceklis:1402332072533823640> **Berbagi Konten**\nMeme dan konten menghibur yang appropriate\n\n<a:ceklis:1402332072533823640> **Diskusi Produktif**\nGame, anime, life topics, dan hobi lainnya\n\n<a:ceklis:1402332072533823640> **Utilisasi Bot**\nMusik, game, utility (tanpa spam)\n\n<a:ceklis:1402332072533823640> **Inisiatif Event**\nKolaborasi dengan persetujuan admin\n\n<a:ceklis:1402332072533823640> **Kontribusi Ide**\nSaran untuk pengembangan server`)
            .setColor(0x00FF00)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Positive Environment', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        const rulesNotAllowedEmbed = new EmbedBuilder()
            .setTitle('❌ **BATASAN KOMUNITAS**')
            .setDescription(`## Larangan Utama\n\n<a:silang:1402332141047513150> **Bahasa Tidak Pantas**\nKonsekuensi: Mute hingga ban permanen\n\n<a:silang:1402332141047513150> **Spam Mention**\n@everyone/@admin tanpa urgensi valid\n\n<a:silang:1402332141047513150> **Perilaku Toxic**\nBullying = aksi ban permanen\n\n<a:silang:1402332141047513150> **Konten NSFW**\nZero tolerance untuk konten dewasa\n\n<a:silang:1402332141047513150> **Promosi Ilegal**\nKecuali di channel yang ditentukan\n\n---\n\n**💡 Need Clarification?**\nTim admin selalu siap membantu pertanyaan Anda`)
            .setColor(0xFF0000)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Safe Environment', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setImage('https://i.ibb.co/4wcgBZQS/6f59b29a5247.gif');

        // ==================== MODERATION POLICY SECTION ====================
        const moderationPolicyEmbed = new EmbedBuilder()
            .setTitle('⚖️ **SISTEM MODERASI PREMIUM**')
            .setDescription(`## Framework Penegakan Aturan\n\n### ⚠️ Progressive Warning System\n<a:seru:1402337929556263002> **Tier 1-3** - Educational Warnings\n<a:seru:1402337929556263002> **Tier 4-7** - Temporary Restrictions  \n<a:seru:1402337929556263002> **Tier 8-11** - Account Limitations\n\n### 📊 Warning Structure\n**1-3** → Verbal → Short Mute\n**4-7** → Extended Mute → Softban\n**8-11** → Temporary Ban → Permanent\n\n### 🛡️ Auto-Moderation Triggers\n• Spam/Flood = 20m restriction\n• NSFW Content = 1-7 day escalation  \n• Security Threats = 3-5 day review\n• Hate Speech = 5 day minimum\n\n### 🔒 Zero-Tolerance Policies\n• Account NSFW = 7 day quarantine\n• Mass NSFW spam = 10 day restriction\n• Platform integrity violations = Permanent\n\n---\n\n**System designed for community excellence**\n*Effective: August 20, 2025*`)
            .setColor(0xFFA500)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Professional Moderation', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            })
            .setImage('https://i.ibb.co/WvSvsVfH/standard-34.gif');

        // ==================== LEVELING SECTION ====================
        const levelingEmbed = new EmbedBuilder()
            .setTitle("🏆 **ECOSYSTEM PROGRESSION**")
            .setDescription(`## Achievement Framework\n\n### 🥉 Foundation Tiers (1-25)\n<@&1354196247715516617> - <@&1354196683420078324>\n*Master the basics and establish presence*\n\n### 🥈 Advanced Tiers (30-45)  \n<@&1354196722716377281> - <@&1354197488264941809>\n*Consistent contribution and community impact*\n\n### 🥇 Elite Tiers (50-70)\n<@&1354197540937142503> - <@&1354197417754628176>\n*Leadership demonstration and value creation*\n\n### 👑 Legendary Tiers (80-100)\n<@&1354197284476420106> - <@&1354196993680867370>\n*Community pillar status and legacy building*\n\n---\n\n**Progression powered by <@437808476106784770>**\n*Your journey to excellence starts here*`)
            .setColor(0xFFD700)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Leveling System', 
                iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' 
            });

        // ==================== COUNTING SECTION ====================
        const countingEmbed = new EmbedBuilder()
            .setTitle("🔢 **ACHIEVEMENT GAMIFICATION**")
            .setDescription(`## Progressive Challenge System\n\n### 🎯 Milestone Recognition\n• **50+** = Initiate Status\n• **100+** = Contributor Level  \n• **250+** = Specialist Rank\n• **500+** = Expert Tier\n• **1000+** = Master Class\n\n### 🎮 Engagement Protocol\n1. Navigate to **#counting** channel\n2. Begin sequence with number **1**\n3. Maintain numerical continuity\n4. Advance through achievement tiers\n5. Claim exclusive role rewards\n\n### 💎 Value Proposition\n• **Exclusive Role Access**\n• **Community Recognition**  \n• **Premium Reward Unlocks**\n• **Achievement Legacy Building**\n\n---\n\n**Track progress with \`/user\` command**\n*Your dedication, visibly rewarded*`)
            .setColor(0x9B59B6)
            .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
            .setFooter({ 
                text: 'BananaSkiee Community • Counting System', 
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
