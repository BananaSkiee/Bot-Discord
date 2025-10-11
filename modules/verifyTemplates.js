const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

class VerifyTemplates {
    constructor(verifySystem) {
        this.system = verifySystem;
    }

    // ========== MAIN VERIFICATION GATEWAY ==========
    getVerifyGateway() {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎯 VERIFICATION GATEWAY • Premium Access')
            .setDescription('**Selamat Datang di BananaSkiee Community!** 🌟\n\nKami dengan bangga mempersembahkan komunitas premium yang menghubungkan profesional, kreator, dan inovator dari seluruh dunia. Sebelum memasuki area eksklusif, kami membutuhkan verifikasi identitas untuk menjaga kualitas komunitas.')
            .addFields(
                {
                    name: '🏆 KEANGGOTAAN PREMIUM YANG AKAN ANDA DAPATKAN:',
                    value: '• **Private Networking Hub** - Koneksi dengan profesional global\n• **Exclusive Resource Library** - Materi premium & tools eksklusif\n• **Member-Only Events** - Workshop, webinar, dan networking sessions\n• **VIP Community Access** - Diskusi berkualitas dengan standar tinggi\n• **Career Opportunities** - Kolaborasi dan peluang karir eksklusif\n• **Priority Support** - Bantuan dedicated dari tim komunitas'
                },
                {
                    name: '🛡️ PROTOCOL KEAMANAN KAMI:',
                    value: 'Sistem verifikasi enterprise-grade kami melindungi privasi dan data Anda dengan enkripsi tingkat militer. Proses ini sepenuhnya otomatis dan aman.'
                }
            )
            .setFooter({ text: 'Enterprise Security • Zero Data Storage • 3 Second Process' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_account')
                    .setLabel('✅ VERIFY MY ACCOUNT')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔐')
            );

        return { embed, components: button };
    }

    // ========== PROGRESS EMBEDS ==========
    getProgressEmbed(percentage, phase) {
        const { title, description, fields, color } = this.getProgressData(percentage, phase);
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description);

        fields.forEach(field => embed.addFields(field));

        const timeEstimate = this.getTimeEstimate(percentage);
        embed.setFooter({ text: `⏳ Estimated time: ${timeEstimate} • Enterprise Grade` });

        return embed;
    }

    getProgressData(percentage, phase) {
        const progressBar = this.generateProgressBar(percentage);
        const phaseData = this.getPhaseData(phase);
        
        return {
            title: '🔒 VERIFICATION IN PROGRESS',
            description: `**Initializing Enterprise Verification Protocol...**\n\n${progressBar}\n**${phaseData.status}**`,
            fields: phaseData.fields,
            color: phaseData.color
        };
    }

    getPhaseData(phase) {
        const phases = {
            'BOOT_UP': {
                status: 'SYSTEM BOOT-UP',
                color: 0x3498db,
                fields: [
                    { name: '├─ Starting verification engine', value: '█████▒▒▒▒▒', inline: false },
                    { name: '├─ Loading security modules', value: '▒▒▒▒▒▒▒▒▒▒', inline: false },
                    { name: '├─ Initializing AI analysis', value: '▒▒▒▒▒▒▒▒▒▒', inline: false },
                    { name: '├─ Preparing identity scan', value: '▒▒▒▒▒▒▒▒▒▒', inline: false },
                    { name: '└─ Establishing secure connection', value: '▒▒▒▒▒▒▒▒▒▒', inline: false }
                ]
            },
            'CREDENTIAL_ANALYSIS': {
                status: 'CREDENTIAL ANALYSIS',
                color: 0xf39c12,
                fields: [
                    { name: '├─ Starting verification engine', value: '█████████▒', inline: false },
                    { name: '├─ Loading security modules', value: '█████▒▒▒▒▒', inline: false },
                    { name: '├─ Initializing AI analysis', value: '████▒▒▒▒▒▒', inline: false },
                    { name: '├─ Preparing identity scan', value: '███▒▒▒▒▒▒▒', inline: false },
                    { name: '└─ Establishing secure connection', value: '████▒▒▒▒▒▒', inline: false },
                    { name: '📊 Scanning account credentials...', value: '✅ Basic validation passed', inline: false }
                ]
            },
            'SECURITY_SCAN': {
                status: 'SECURITY SCAN',
                color: 0x9b59b6,
                fields: [
                    { name: '├─ Starting verification engine', value: '██████████', inline: false },
                    { name: '├─ Loading security modules', value: '███████▒▒▒', inline: false },
                    { name: '├─ Initializing AI analysis', value: '██████▒▒▒▒', inline: false },
                    { name: '├─ Preparing identity scan', value: '█████▒▒▒▒▒', inline: false },
                    { name: '└─ Establishing secure connection', value: '███████▒▒▒', inline: false },
                    { name: '🔍 Analyzing account history...', value: '✅ No suspicious patterns', inline: false },
                    { name: '🤖 Running behavior pattern detection...', value: '✅ Human behavior confirmed', inline: false },
                    { name: '🛡️ Checking security flags...', value: '✅ All security checks passed', inline: false }
                ]
            },
            'IDENTITY_VERIFICATION': {
                status: 'IDENTITY VERIFICATION',
                color: 0xe74c3c,
                fields: [
                    { name: '├─ Starting verification engine', value: '██████████', inline: false },
                    { name: '├─ Loading security modules', value: '█████████▒', inline: false },
                    { name: '├─ Initializing AI analysis', value: '████████▒▒', inline: false },
                    { name: '├─ Preparing identity scan', value: '███████▒▒▒', inline: false },
                    { name: '└─ Establishing secure connection', value: '█████████▒', inline: false },
                    { name: '🎯 Cross-referencing global databases...', value: '✅ Identity records verified', inline: false },
                    { name: '🌐 Checking community standards...', value: '✅ Meets community criteria', inline: false },
                    { name: '✅ Identity confirmed - Human user verified', value: '━━━━━━━━━━━━━━━━━━━━', inline: false }
                ]
            },
            'FINALIZING': {
                status: 'FINALIZING ACCESS',
                color: 0xe67e22,
                fields: [
                    { name: '├─ Starting verification engine', value: '██████████', inline: false },
                    { name: '├─ Loading security modules', value: '██████████', inline: false },
                    { name: '├─ Initializing AI analysis', value: '█████████▒', inline: false },
                    { name: '├─ Preparing identity scan', value: '████████▒▒', inline: false },
                    { name: '└─ Establishing secure connection', value: '██████████', inline: false },
                    { name: '🚀 Provisioning member access...', value: '✅ Access permissions configured', inline: false },
                    { name: '🎖️ Assigning verified role...', value: '✅ Role assignment ready', inline: false },
                    { name: '📚 Unlocking premium features...', value: '✅ Feature access granted', inline: false }
                ]
            },
            'COMPLETE': {
                status: 'VERIFICATION COMPLETE',
                color: 0x2ecc71,
                fields: [
                    { name: '├─ Starting verification engine', value: '██████████', inline: false },
                    { name: '├─ Loading security modules', value: '██████████', inline: false },
                    { name: '├─ Initializing AI analysis', value: '██████████', inline: false },
                    { name: '├─ Preparing identity scan', value: '██████████', inline: false },
                    { name: '└─ Establishing secure connection', value: '██████████', inline: false },
                    { name: '🎉 IDENTITY SUCCESSFULLY VERIFIED!', value: '━━━━━━━━━━━━━━━━━━━━', inline: false },
                    { name: '✅ All security checks passed', value: '• Credential validation\n• Behavior analysis\n• Security screening', inline: true },
                    { name: '✅ Identity confirmed & authenticated', value: '• Human verification\n• Database cross-check\n• Community standards', inline: true },
                    { name: '✅ Premium access granted', value: '• Role assignment\n• Feature unlock\n• Community access', inline: true }
                ]
            }
        };

        return phases[phase] || phases['BOOT_UP'];
    }

    generateProgressBar(percentage) {
        const bars = 20;
        const filledBars = Math.round((percentage / 100) * bars);
        const emptyBars = bars - filledBars;
        
        return `🔄 **SYSTEM STATUS:** ${'█'.repeat(filledBars)}${'▒'.repeat(emptyBars)} **${percentage}%**`;
    }

    getTimeEstimate(percentage) {
        const remaining = ((100 - percentage) / 100) * 10;
        return `${remaining.toFixed(1)} seconds`;
    }

    // ========== SUCCESS & ONBOARDING TEMPLATES ==========
    getVerificationSuccessEmbed(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎊 VERIFICATION SUCCESSFUL')
            .setDescription(`**Welcome to The Inner Circle, ${interaction.user.username}!** 🏆\n\nSelamat! Identitas Anda telah terverifikasi dan memenuhi standar komunitas premium kami. Anda sekarang resmi menjadi bagian dari BananaSkiee Community.`)
            .addFields(
                {
                    name: '✅ SECURITY CLEARANCE GRANTED:',
                    value: '• **Access Level:** Platinum Member\n• **Security Tier:** Maximum Clearance\n• **Community Status:** Verified Professional',
                    inline: false
                },
                {
                    name: '🎁 PREMIUM MEMBERSHIP ACTIVATED:',
                    value: '🏆 **Exclusive Role & Badge**\n   - Verified Member Role dengan custom color\n   - Exclusive member badge di profile\n\n🚀 **Full Platform Access**\n   - 15+ private channels & discussion hubs\n   - Resource library dengan 500+ materials\n   - Event calendar dengan weekly activities\n\n💼 **Professional Network**\n   - Direct messaging dengan members\n   - Networking events & collaborations\n   - Career opportunity announcements\n\n📚 **Learning Resources**\n   - Tutorial library & course materials\n   - Workshop recordings & resources\n   - Expert-led session access',
                    inline: false
                },
                {
                    name: '🎯 SELECT YOUR ONBOARDING PATH:',
                    value: '[🚀 **START COMMUNITY**] - Akses langsung ke semua fitur komunitas\n[🎯 **START ONBOARDING**] - Personalisasi experience dengan profil profesional',
                    inline: false
                }
            )
            .setFooter({ text: 'Platinum Member • Professional Network • Est. 2024' });

        const components = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_community')
                    .setLabel('🚀 START COMMUNITY')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('start_onboarding')
                    .setLabel('🎯 START ONBOARDING')
                    .setStyle(ButtonStyle.Primary)
            );

        return { embed, components };
    }

    getAlreadyVerifiedEmbed(interaction) {
        return new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('✅ Already Verified')
            .setDescription(`Hello ${interaction.user.username}! Your account is already verified and has full access to the community.`)
            .addFields(
                { name: '🎯 Status', value: 'Verified Member', inline: true },
                { name: '🔐 Access', value: 'Full Platform', inline: true },
                { name: '🏆 Tier', value: 'Platinum Member', inline: true }
            )
            .setFooter({ text: 'Welcome back to BananaSkiee Community! 🎊' });
    }

    getWelcomeEmbed(interaction) {
        return new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 WELCOME TO BANANASKIE COMMUNITY!')
            .setDescription(`**Selamat Bergabung di Keluarga Kami, ${interaction.user.username}!** 🎊`)
            .addFields(
                {
                    name: '✅ MEMBERSHIP ACTIVATION COMPLETE:',
                    value: '🏆 **Status Keanggotaan:** Active Platinum Member\n🔐 **Security Level:** Maximum Clearance Granted\n🎯 **Access Permissions:** Full Platform Access\n📊 **Member Since:** ' + new Date().toLocaleDateString('id-ID'),
                    inline: false
                },
                {
                    name: '🚀 YANG SEKARANG TERSEDIA UNTUK ANDA:',
                    value: '💬 **Discussion Hubs:**\n#general • #professional-talk • #creative-corner\n#tech-innovation • #business-network • #career-growth\n\n🎯 **Resource Centers:**\n#resource-library • #learning-hub • #toolkit\n#project-collab • #opportunity-board\n\n🎪 **Community Events:**\n#events-calendar • #workshop-zone • #networking\n#community-projects • #expert-sessions\n\n🤝 **Support System:**\n#help-desk • #community-support • #feedback\n#suggestions • #moderation-help',
                    inline: false
                },
                {
                    name: '📅 NEXT STEPS UNTUK MEMAKSIMALKAN PENGALAMAN:',
                    value: '1. **Perkenalkan diri** di #introductions\n2. **Jelajahi channel** sesuai minat Anda\n3. **Join event pertama** dari calendar\n4. **Connect dengan members** yang sepemikiran\n5. **Explore resource library** untuk bahan belajar',
                    inline: false
                }
            )
            .setFooter({ text: 'Your Journey Starts Now • Make It Legendary' });
    }

    // ========== ONBOARDING TEMPLATES ==========
    getOnboardingEmbed() {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📝 ONBOARDING PROFESSIONAL')
            .setDescription('**Mari Membangun Profil Profesional Anda!** 🎯\n\nProses onboarding ini dirancang untuk mempersonalisasi pengalaman Anda di BananaSkiee Community. Dengan melengkapi profil, kami dapat menyesuaikan rekomendasi konten, koneksi, dan peluang yang paling relevan untuk Anda.')
            .addFields(
                {
                    name: '📊 PROFILE COMPLETION BENEFITS:',
                    value: '• Personalized content recommendations\n• Better networking match suggestions\n• Custom event & opportunity alerts\n• Enhanced community experience',
                    inline: false
                },
                {
                    name: '1. 🎯 PRIMARY OBJECTIVES & GOALS',
                    value: 'Pilih dari dropdown di bawah untuk menentukan fokus utama Anda',
                    inline: false
                },
                {
                    name: '2. 📈 EXPERIENCE LEVEL & BACKGROUND', 
                    value: 'Pilih level pengalaman profesional Anda',
                    inline: false
                },
                {
                    name: '3. 🤝 CONTRIBUTION READINESS',
                    value: 'Tentukan tingkat kontribusi yang Anda rencanakan',
                    inline: false
                },
                {
                    name: '🎨 PREFER PERSONAL TOUCH?',
                    value: '[📝 **OPEN CUSTOM PROFILE BUILDER**] - Create detailed narrative profile',
                    inline: false
                }
            )
            .setFooter({ text: 'Profile completion unlocks personalized features' });

        // Dropdown menus
        const purposeSelect = new StringSelectMenuBuilder()
            .setCustomId('select_purpose')
            .setPlaceholder('🎯 Select Your Main Focus Areas...')
            .addOptions([
                { label: 'Professional Networking', value: 'networking', description: 'Expand professional connections' },
                { label: 'Skill Development', value: 'learning', description: 'Learn new skills & capabilities' },
                { label: 'Project Collaboration', value: 'collaboration', description: 'Work on exciting projects' },
                { label: 'Knowledge Sharing', value: 'knowledge', description: 'Share expertise & learn from others' },
                { label: 'Career Advancement', value: 'career', description: 'Explore new opportunities' },
                { label: 'Community Building', value: 'community', description: 'Help grow the ecosystem' }
            ]);

        const experienceSelect = new StringSelectMenuBuilder()
            .setCustomId('select_experience')
            .setPlaceholder('📈 Select Your Professional Level...')
            .addOptions([
                { label: 'Student/Enthusiast', value: 'student', description: 'Currently learning & exploring' },
                { label: 'Junior Professional', value: 'junior', description: '1-3 years experience' },
                { label: 'Mid-Level Professional', value: 'mid', description: '4-7 years experience' },
                { label: 'Senior Professional', value: 'senior', description: '8+ years experience' },
                { label: 'Industry Expert', value: 'expert', description: 'Recognized authority in field' },
                { label: 'Entrepreneur/Founder', value: 'founder', description: 'Building businesses/products' }
            ]);

        const contributionSelect = new StringSelectMenuBuilder()
            .setCustomId('select_contribution')
            .setPlaceholder('🤝 Select Your Engagement Level...')
            .addOptions([
                { label: 'Active Contributor', value: 'active', description: 'Regularly share & participate' },
                { label: 'Selective Engagement', value: 'selective', description: 'Participate in specific topics' },
                { label: 'Observer/Learner', value: 'observer', description: 'Learn first, contribute later' },
                { label: 'Mentor/Advisor', value: 'mentor', description: 'Guide and help other members' }
            ]);

        const customFormButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('custom_form')
                    .setLabel('📝 OPEN CUSTOM PROFILE BUILDER')
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_onboarding')
                    .setLabel('✅ CONFIRM & PROCEED')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('skip_onboarding')
                    .setLabel('⏩ SKIP TO COMMUNITY')
                    .setStyle(ButtonStyle.Danger)
            );

        const selectRow1 = new ActionRowBuilder().addComponents(purposeSelect);
        const selectRow2 = new ActionRowBuilder().addComponents(experienceSelect);
        const selectRow3 = new ActionRowBuilder().addComponents(contributionSelect);

        return {
            embed,
            components: [selectRow1, selectRow2, selectRow3, customFormButton, actionButtons]
        };
    }

    getSkipOnboardingEmbed(interaction) {
        return new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🎯 ONBOARDING DISKIP')
            .setDescription(`Tidak masalah, ${interaction.user.username}
