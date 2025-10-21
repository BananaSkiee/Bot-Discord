// modules/rules.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
  name: 'rules',
  description: 'Modul peraturan & guidebook server (BananaSkiee)',

  async execute(client) {
    // ==================== WELCOME EMBED UTAMA ====================
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('🌟 SELAMAT DATANG DI BANANASKIE COMMUNITY')
      .setDescription(
        '**Rumah bagi para penggemar Discord profesional dan komunitas berkualitas**\n\n' +
        '---\n' +
        '🎉 **Selamat Datang!**\n' +
        'Rumah bagi komunitas aktif, event seru, dan pengalaman premium.\n\n' +
        '🔍 Temukan informasi penting lewat tombol di bawah.'
      )
      .setColor(0x5865F2)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setImage('https://i.ibb.co/4wcgBZQS/6f59b29a5247.gif')
      .setFooter({ text: 'BananaSkiee Community • Est. 2024 • Professional Environment', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' })
      .setTimestamp();

    // Tombol untuk Welcome Embed
    const welcomeButtons = new ActionRowBuilder().addComponents(
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
      // GANTI: YouTube Membership -> Links Invite (link button)
      new ButtonBuilder()
        .setLabel('Links Invite')
        .setStyle(ButtonStyle.Link)
        // Jika mau mengganti link invite, ganti URL di bawah:
        .setURL('https://discord.gg/5asgbezyR6')
        .setEmoji('🔗')
    );

    // Select Menu untuk informasi tambahan (3 PILIHAN)
    const infoSelectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('info_select')
        .setPlaceholder('🔍 Explore more information...')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Server Info')
            .setDescription('Overview, channels, & announcements')
            .setValue('server_info')
            .setEmoji('ℹ️'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Events & Giveaways')
            .setDescription('Jadwal event dan mekanisme klaim hadiah')
            .setValue('events')
            .setEmoji('🎪'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Partners & Links')
            .setDescription('Partner, invite links, dan resources')
            .setValue('partners')
            .setEmoji('🤝')
        )
    );

    // ==================== GUIDEBOOK PAGES (disusun agar ringkas & informatif) ====================
    // NOTE: isi ini disusun agar mudah dibaca di Discord. Jika ingin 1:1 dari file assets,
    // beri tau aku untuk memasukkan teks mentah persis (karena kadang ada format yang perlu escape).

    // GUIDEBOOK INTRO
    const guidebookIntro = new EmbedBuilder()
      .setTitle('📖 GUIDEBOOK — BananaSkiee Community')
      .setDescription(
        '**Getting Started**\n\n' +
        'Sebagai member baru, ikuti panduan singkat ini agar cepat nyaman di server.\n\n' +
        '🎯 Apa yang akan kamu pelajari:\n' +
        '• Struktur server & channel penting\n' +
        '• Cara verifikasi & dapat role\n' +
        '• Aturan penting & sistem leveling\n\n' +
        '**Klik** `Start Guide` untuk mulai.'
      )
      .setColor(0x00AAFF)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'Interactive Guide • Page 1/5', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' });

    // PAGE 1 - BASICS
    const guidebookPage1 = new EmbedBuilder()
      .setTitle('📚 DASAR-DASAR SERVER')
      .setDescription(
        '**📖 Baca Aturan**\nBaca pedoman komunitas untuk tetap nyaman.\n\n' +
        '**⚙️ Sesuaikan Preferensi**\nAtur notifikasi & role sesuai keinginan.\n\n' +
        '**🎯 Tips Pemula**\n• Eksplor semua channel\n• Kenali role & fitur\n• Tanyakan di #help jika bingung'
      )
      .setColor(0x3498DB)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'Interactive Guide • Page 2/5', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' });

    // PAGE 2 - LEADERSHIP / ROLES (disesuaikan)
    const guidebookPage2 = new EmbedBuilder()
      .setTitle('👑 STRUKTUR KEPEMIMPINAN & ROLE PENTING')
      .setDescription(
        '**Tim & Role Penting**\n\n' +
        '<@&1352279577174605884> — Owner (Headmaster)\n' +
        '<@&1352282368043389069> — Admin / Principal\n' +
        '<@&1352282892935368787> — Core Team\n\n' +
        'Role pendukung:\n' +
        '<@&1352286235233620108> — Verified\n' +
        '<@&1358311584681693324> — Booster\n' +
        '<@&1352285051521601618> — Content Creator\n\n' +
        'Jika perlu bantuan role, minta di #verify atau hubungi staff.'
      )
      .setColor(0x9B59B6)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'Interactive Guide • Page 3/5', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' });

    // PAGE 3 - CHANNELS
    const guidebookPage3 = new EmbedBuilder()
      .setTitle('📁 STRUKTUR CHANNEL')
      .setDescription(
        '**Channel Utama**\n' +
        '• <#1352331574376665178> — Announcements\n' +
        '• <#1352404526870560788> — General\n' +
        '• <#1352823970054803509> — Verify\n' +
        '• <#1354077866895347772> — Tiket\n\n' +
        '**Interaksi**\n• #introductions — Kenalan\n• #discussion — Diskusi umum\n• #help — Minta bantuan'
      )
      .setColor(0xE74C3C)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'Interactive Guide • Page 4/5', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' });

    // PAGE 4 - NAVIGATION & FINISH
    const guidebookPage4 = new EmbedBuilder()
      .setTitle('🔍 PANDUAN NAVIGASI & PENUTUP')
      .setDescription(
        '**Cara Menavigasi Server**\n' +
        '1. Klik nama server → Show All Channels\n' +
        '2. Gunakan search untuk menemukan channel\n' +
        '3. Bookmark channel penting\n\n' +
        '🎉 Selamat bergabung — nikmati fitur dan event kami!'
      )
      .setColor(0xF39C12)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'Interactive Guide • Page 5/5', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' });

    // Tombol Start Guide
    const startGuideButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('start_guide')
        .setLabel('Start Guide')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🚀')
    );

    // Navigasi Guidebook (Back / Next)
    const guidebookNavigation = new ActionRowBuilder().addComponents(
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

    // Close / Complete Guide
    const guidebookClose = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('guide_close')
        .setLabel('Complete Guide')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );

    // ==================== RULES ====================
    const rulesAllowedEmbed = new EmbedBuilder()
      .setTitle('✅ STANDAR KOMUNITAS')
      .setDescription(
        '• Komunikasi santun & membangun komunitas\n' +
        '• Berbagi konten yang appropriate\n' +
        '• Diskusi produktif seputar game, anime, hobi\n' +
        '• Utilisasi bot (musik, game, utilitas) tanpa spam\n' +
        '• Inisiatif event dengan persetujuan admin'
      )
      .setColor(0x00FF00)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'BananaSkiee Community • Positive Environment', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' });

    const rulesNotAllowedEmbed = new EmbedBuilder()
      .setTitle('❌ BATASAN KOMUNITAS')
      .setDescription(
        '• Bahasa tidak pantas / bullying → Mute / Ban\n' +
        '• Spam mention (@everyone/@here tanpa alasan) → Sanksi\n' +
        '• Perilaku toxic → Ban permanen\n' +
        '• Konten NSFW → Zero tolerance\n' +
        '• Promosi ilegal (kecuali di channel yang ditentukan)'
      )
      .setColor(0xFF0000)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'BananaSkiee Community • Safe Environment', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' })
      .setImage('https://i.ibb.co/4wcgBZQS/6f59b29a5247.gif');

    // ==================== MODERATION POLICY ====================
    const moderationPolicyEmbed = new EmbedBuilder()
      .setTitle('⚖️ SISTEM MODERASI PREMIUM')
      .setDescription(
        'Framework penegakan aturan:\n\n' +
        '⚠️ Progressive Warning System (Tiered warnings)\n' +
        '1-3 → Verbal / Short Mute\n' +
        '4-7 → Extended Mute / Softban\n' +
        '8-11 → Temporary Ban → Permanent\n\n' +
        'Triggers otomatis: spam, NSFW, hate speech, security threats'
      )
      .setColor(0xFFA500)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'BananaSkiee Community • Professional Moderation', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' })
      .setImage('https://i.ibb.co/WvSvsVfH/standard-34.gif');

    // ==================== LEVELING ====================
    const levelingEmbed = new EmbedBuilder()
      .setTitle('🏆 ECOSYSTEM PROGRESSION')
      .setDescription(
        'Achievement & progression tiers — raih role berdasarkan kontribusi.\n\n' +
        'Foundation → Advanced → Elite → Legendary\n\n' +
        'Pantau progress dengan command `/user`'
      )
      .setColor(0xFFD700)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'BananaSkiee Community • Leveling System', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' });

    // ==================== COUNTING (GAME) ====================
    const countingEmbed = new EmbedBuilder()
      .setTitle('🔢 ACHIEVEMENT GAMIFICATION')
      .setDescription(
        'Counting challenges: mulai dari 1, jaga kontinuitas nomor, dan klaim reward role ketika milestone tercapai.\n\n' +
        'Milestone: 50 / 100 / 250 / 500 / 1000'
      )
      .setColor(0x9B59B6)
      .setThumbnail('https://i.imgur.com/RGp8pqJ.jpeg')
      .setFooter({ text: 'BananaSkiee Community • Counting System', iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg' });

    // Return semua yang dibutuhkan interactionCreate.js
    return {
      welcomeEmbed,
      welcomeButtons,
      infoSelectMenu,

      guidebookIntro,
      guidebookPage1,
      guidebookPage2,
      guidebookPage3,
      guidebookPage4,
      startGuideButton,
      guidebookNavigation,
      guidebookClose,

      rulesAllowedEmbed,
      rulesNotAllowedEmbed,
      moderationPolicyEmbed,
      levelingEmbed,
      countingEmbed
    };
  }
};
