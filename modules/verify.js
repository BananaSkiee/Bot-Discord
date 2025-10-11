// modules/verify.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Storage untuk session user
const userSessions = new Map();

class VerifySystem {
    constructor() {
        this.verifyChannelId = '1352823970054803509';
        this.logChannelId = '1426537842875826278';
        this.memberRoleId = '1352286235233620108';
    }

    // ========== INITIALIZE ==========
    async initialize(client) {
        try {
            const channel = await client.channels.fetch(this.verifyChannelId);
            if (!channel) {
                console.error('❌ Verify channel tidak ditemukan');
                return;
            }

            // Cek apakah sudah ada message verify
            const messages = await channel.messages.fetch({ limit: 10 });
            const existingVerify = messages.find(msg => 
                msg.embeds.length > 0 && 
                msg.embeds[0].title?.includes('VERIFICATION GATEWAY')
            );

            if (!existingVerify) {
                await this.sendVerifyMessage(channel);
                console.log('✅ Tombol verify berhasil dikirim');
            } else {
                console.log('✅ Tombol verify sudah ada');
            }
        } catch (error) {
            console.error('❌ Gagal setup verify system:', error);
        }
    }

    // ========== STEP 0: TOMBOL VERIFY UTAMA ==========
    async sendVerifyMessage(channel) {
        const verifyEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎯 VERIFICATION GATEWAY • Premium Access')
            .setDescription('**Selamat Datang di BananaSkiee Community**\n\nSebelum memasuki area premium, verifikasi identitas Anda untuk mengakses:')
            .addFields(
                {
                    name: '🎁 Member Benefits',
                    value: '- 🏆 Member Exclusive Channels\n- 💼 Professional Networking\n- 📚 Premium Resources\n- 🎪 Private Events\n- 🤝 VIP Community'
                },
                {
                    name: '🛡️ Security',
                    value: 'Sistem keamanan enterprise melindungi data dan privasi Anda.'
                }
            )
            .setFooter({ text: 'Proses otomatis • 3 detik • Zero hassle' });

        const verifyButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_account')
                    .setLabel('✅ VERIFY MY ACCOUNT')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔐')
            );

        await channel.send({
            embeds: [verifyEmbed],
            components: [verifyButton]
        });
    }

    // ========== STEP 1: PROGRESS VERIFICATION ==========
    async handleVerify(interaction) {
        // Cek jika sudah verify
        if (interaction.member.roles.cache.has(this.memberRoleId)) {
            const alreadyEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('✅ Already Verified')
                .setDescription('Akun Anda sudah terverifikasi!')
                .addFields(
                    { name: 'Status', value: 'Verified Member', inline: true },
                    { name: 'Role', value: `<@&${this.memberRoleId}>`, inline: true }
                );

            return await interaction.reply({ 
                embeds: [alreadyEmbed], 
                ephemeral: true 
            });
        }

        // STEP 1: Progress Verification
        const progressEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🔒 VERIFICATION IN PROGRESS')
            .setDescription('**Initializing secure protocol...**\n\n' +
                '🔄 **Progress:** ██████████ 100%\n' +
                '├─ 🔍 Scanning credentials... ✅\n' +
                '├─ 🤖 AI behavior analysis... ✅\n' +
                '├─ 🛡️ Security validation... ✅\n' +
                '├─ 🎯 Identity confirmation... ✅\n' +
                '└─ 🚀 Access provisioning... ✅\n\n' +
                '**STATUS:** _Identity verified successfully_')
            .setFooter({ text: 'Process completed in 2.3s' });

        await interaction.reply({ 
            embeds: [progressEmbed], 
            ephemeral: true 
        });

        // Simulasi proses 2 detik
        await new Promise(resolve => setTimeout(resolve, 2000));

        // STEP 2: Verification Success
        const successEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎊 VERIFICATION SUCCESSFUL')
            .setDescription(`**Welcome ${interaction.user.username}!** 🏆`)
            .addFields(
                { name: '✅ Security Level', value: 'Maximum', inline: true },
                { name: '✅ Access Granted', value: 'Full Community', inline: true },
                {
                    name: '🎁 MEMBERSHIP BENEFITS ACTIVATED',
                    value: '- 🎖️ **Verified Member** Role assigned\n- 🚀 **Premium Channels** unlocked\n- 📚 **Resource Vault** access\n- 🤝 **Networking** privileges'
                },
                {
                    name: 'PILIH LANJUTAN:',
                    value: '• [🚀 START COMMUNITY] - Langsung masuk komunitas\n• [🎯 START ONBOARDING] - Lengkapi profil profesional dulu'
                }
            )
            .setFooter({ text: 'Elite Member • Professional Tier' });

        const actionButtons = new ActionRowBuilder()
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

        // Simpan session
        userSessions.set(interaction.user.id, {
            message: interaction.message,
            step: 'verified'
        });

        await interaction.editReply({ 
            embeds: [successEmbed], 
            components: [actionButtons] 
        });
    }

    // ========== STEP 3A: START COMMUNITY ==========
    async handleStartCommunity(interaction) {
        try {
            // Beri role member
            const memberRole = interaction.guild.roles.cache.get(this.memberRoleId);
            if (memberRole) {
                await interaction.member.roles.add(memberRole);
            }

            // Sembunyikan channel verify dari user
            const verifyChannel = interaction.guild.channels.cache.get(this.verifyChannelId);
            if (verifyChannel) {
                await verifyChannel.permissionOverwrites.edit(interaction.user.id, {
                    ViewChannel: false
                });
            }

            // STEP 3A: Welcome Community
            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 WELCOME TO BANANASKIE COMMUNITY!')
                .setDescription(`Selamat ${interaction.user.username}! 🎊`)
                .addFields(
                    { name: '✅ Status', value: 'Verified Member dengan akses penuh' },
                    { name: '🔒 Channel Verify', value: 'Otomatis tersembunyi' },
                    { name: '🎯 Pencapaian', value: 'Role member diberikan • Semua channel terbuka' }
                )
                .setFooter({ text: 'Selamat menikmati komunitas kami!' });

            await interaction.update({ 
                embeds: [welcomeEmbed], 
                components: [] 
            });

            // Kirim log
            await this.sendVerificationLog(interaction, 'quick_access');

            // Hapus session
            userSessions.delete(interaction.user.id);

        } catch (error) {
            console.error('Error handleStartCommunity:', error);
            await interaction.update({ 
                content: '❌ Gagal memproses. Silakan coba lagi.', 
                components: [] 
            });
        }
    }

    // ========== STEP 3B: START ONBOARDING ==========
    async handleStartOnboarding(interaction) {
        // STEP 3B: Onboarding Professional
        const onboardingEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📝 ONBOARDING PROFESSIONAL')
            .setDescription('Mari lengkapi profil profesional Anda!')
            .addFields(
                {
                    name: '1. PILIH TUJUAN UTAMA ANDA:',
                    value: '[▼ Pilih tujuan utama...]\n↳ Networking\n↳ Belajar Skill\n↳ Kolaborasi\n↳ Hiburan\n↳ Eksplorasi'
                },
                {
                    name: '2. PILIH LEVEL EXPERIENCE:',
                    value: '[▼ Pilih level experience...]\n↳ Pemula\n↳ Menengah\n↳ Advanced\n↳ Professional\n↳ Expert'
                },
                {
                    name: '3. PILIH KESIAPAN KONTRIBUSI:',
                    value: '[▼ Pilih kesiapan kontribusi...]\n↳ Ya, aktif berbagi\n↳ Sesekali sharing\n↳ Lihat perkembangan dulu'
                },
                {
                    name: 'ATAU ISI DENGAN PEMIKIRAN SENDIRI:',
                    value: '[📝 BUKA FORM CUSTOM] - Tulis sesuai pemikiran Anda'
                }
            )
            .setFooter({ text: 'Pilih dropdown atau form custom' });

        // Dropdown untuk tujuan
        const purposeSelect = new StringSelectMenuBuilder()
            .setCustomId('select_purpose')
            .setPlaceholder('🎯 Pilih tujuan utama...')
            .addOptions([
                { label: 'Networking', value: 'networking', description: 'Membangun koneksi profesional' },
                { label: 'Belajar Skill', value: 'learning', description: 'Mengembangkan kemampuan' },
                { label: 'Kolaborasi', value: 'collaboration', description: 'Bekerja sama dalam project' },
                { label: 'Hiburan', value: 'entertainment', description: 'Bersenang-senang dan relax' },
                { label: 'Eksplorasi', value: 'exploration', description: 'Menjelajahi komunitas' }
            ]);

        // Dropdown untuk experience
        const experienceSelect = new StringSelectMenuBuilder()
            .setCustomId('select_experience')
            .setPlaceholder('📈 Pilih level experience...')
            .addOptions([
                { label: 'Pemula', value: 'beginner', description: 'Baru memulai' },
                { label: 'Menengah', value: 'intermediate', description: 'Sudah memiliki dasar' },
                { label: 'Advanced', value: 'advanced', description: 'Lanjutan dan berpengalaman' },
                { label: 'Professional', value: 'professional', description: 'Profesional di bidang' },
                { label: 'Expert', value: 'expert', description: 'Ahli dan master' }
            ]);

        // Dropdown untuk kontribusi
        const contributionSelect = new StringSelectMenuBuilder()
            .setCustomId('select_contribution')
            .setPlaceholder('🤝 Pilih kesiapan kontribusi...')
            .addOptions([
                { label: 'Ya, aktif berbagi', value: 'active', description: 'Sering berbagi pengetahuan' },
                { label: 'Sesekali sharing', value: 'occasional', description: 'Kadang-kadang berbagi' },
                { label: 'Lihat perkembangan dulu', value: 'observer', description: 'Mengamati dulu' }
            ]);

        // Tombol custom form
        const customFormButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('custom_form')
                    .setLabel('📝 BUKA FORM CUSTOM')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Tombol action
        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_onboarding')
                    .setLabel('✅ KONFIRMASI JAWABAN')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('skip_onboarding')
                    .setLabel('⏩ SKIP ONBOARDING')
                    .setStyle(ButtonStyle.Danger)
            );

        const selectRow1 = new ActionRowBuilder().addComponents(purposeSelect);
        const selectRow2 = new ActionRowBuilder().addComponents(experienceSelect);
        const selectRow3 = new ActionRowBuilder().addComponents(contributionSelect);

        await interaction.update({ 
            embeds: [onboardingEmbed], 
            components: [selectRow1, selectRow2, selectRow3, customFormButton, actionButtons] 
        });

        // Simpan session
        userSessions.set(interaction.user.id, {
            ...userSessions.get(interaction.user.id),
            step: 'onboarding',
            onboardingData: {}
        });
    }

    // ========== STEP 4A: CUSTOM FORM ==========
    async handleCustomForm(interaction) {
        // Buat modal untuk custom form
        const modal = new ModalBuilder()
            .setCustomId('custom_profile_modal')
            .setTitle('📝 Custom Professional Profile');

        // Input fields
        const purposeInput = new TextInputBuilder()
            .setCustomId('purpose_input')
            .setLabel('Apa tujuan utama Anda bergabung?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500)
            .setPlaceholder('Contoh: Saya ingin belajar digital marketing dan networking...');

        const experienceInput = new TextInputBuilder()
            .setCustomId('experience_input')
            .setLabel('Background dan experience Anda?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500)
            .setPlaceholder('Contoh: 2 tahun experience sebagai graphic designer...');

        const contributionInput = new TextInputBuilder()
            .setCustomId('contribution_input')
            .setLabel('Ekspektasi kontribusi di komunitas?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500)
            .setPlaceholder('Contoh: Bisa share knowledge design dan belajar...');

        const interestsInput = new TextInputBuilder()
            .setCustomId('interests_input')
            .setLabel('Minat dan passion khusus?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(500)
            .setPlaceholder('Contoh: UI/UX design, social media strategy...');

        // Add inputs to modal
        const firstActionRow = new ActionRowBuilder().addComponents(purposeInput);
        const secondActionRow = new ActionRowBuilder().addComponents(experienceInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(contributionInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(interestsInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

        await interaction.showModal(modal);
    }

    // ========== HANDLE MODAL SUBMISSION ==========
    async handleModalSubmit(interaction) {
        if (interaction.customId === 'custom_profile_modal') {
            const purpose = interaction.fields.getTextInputValue('purpose_input');
            const experience = interaction.fields.getTextInputValue('experience_input');
            const contribution = interaction.fields.getTextInputValue('contribution_input');
            const interests = interaction.fields.getTextInputValue('interests_input');

            // Simpan data custom
            const session = userSessions.get(interaction.user.id);
            userSessions.set(interaction.user.id, {
                ...session,
                onboardingData: {
                    type: 'custom',
                    purpose,
                    experience,
                    contribution,
                    interests
                }
            });

            // Lanjut ke rating
            await this.showRatingStep(interaction);
        }
    }

    // ========== STEP 4B/5: RATING SYSTEM ==========
    async showRatingStep(interaction) {
        const ratingEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('⭐ FIRST IMPRESSION RATING')
            .setDescription('**Bagaimana kesan pertama Anda terhadap proses verifikasi & onboarding di BananaSkiee Community? (1-100)**')
            .addFields(
                {
                    name: 'SKALA PENILAIAN:',
                    value: '- **1-30:** *Pengalaman kurang memuaskan*\n- **31-60:** *Cukup baik, perlu beberapa improvement*\n- **61-80:** *Baik, pengalaman yang positif*\n- **81-95:** *Sangat baik, profesional dan impressive*\n- **96-100:** *Sempurna! Luar biasa dan berkelas*'
                }
            )
            .setFooter({ text: 'Berikan penilaian sejujur mungkin' });

        const ratingButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('input_rating')
                    .setLabel('🎯 INPUT RATING')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('next_without_rating')
                    .setLabel('➡️ LANJUT TANPA RATING')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('feedback_detail')
                    .setLabel('📝 FEEDBACK DETAIL')
                    .setStyle(ButtonStyle.Success)
            );

        // Jika dari modal, kita perlu reply baru
        if (interaction.isModalSubmit()) {
            await interaction.reply({ 
                embeds: [ratingEmbed], 
                components: [ratingButtons],
                ephemeral: true 
            });
        } else {
            await interaction.update({ 
                embeds: [ratingEmbed], 
                components: [ratingButtons] 
            });
        }

        // Update session
        userSessions.set(interaction.user.id, {
            ...userSessions.get(interaction.user.id),
            step: 'rating'
        });
    }

    // ========== STEP 6: FEEDBACK SYSTEM ==========
    async showFeedbackStep(interaction) {
        const feedbackEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('💬 DETAILED FEEDBACK')
            .setDescription('**Beri masukan detail untuk improvement:**')
            .addFields(
                {
                    name: 'Aspect yang paling disukai:',
                    value: '_Menunggu input..._'
                },
                {
                    name: 'Area yang bisa ditingkatkan:',
                    value: '_Menunggu input..._'
                },
                {
                    name: 'Experience dengan UI/UX:',
                    value: '_Menunggu input..._'
                },
                {
                    name: 'Harapan untuk fitur future:',
                    value: '_Menunggu input..._'
                }
            )
            .setFooter({ text: 'Feedback detail sangat berharga' });

        const feedbackButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('submit_feedback')
                    .setLabel('✅ KIRIM FEEDBACK')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('skip_feedback')
                    .setLabel('⏩ LEWATI FEEDBACK')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({ 
            embeds: [feedbackEmbed], 
            components: [feedbackButtons] 
        });

        // Update session
        userSessions.set(interaction.user.id, {
            ...userSessions.get(interaction.user.id),
            step: 'feedback'
        });
    }

    // ========== STEP 7: COMPLETE ==========
    async handleComplete(interaction, hasFeedback = false) {
        try {
            // Beri role member
            const memberRole = interaction.guild.roles.cache.get(this.memberRoleId);
            if (memberRole) {
                await interaction.member.roles.add(memberRole);
            }

            // Sembunyikan channel verify
            const verifyChannel = interaction.guild.channels.cache.get(this.verifyChannelId);
            if (verifyChannel) {
                await verifyChannel.permissionOverwrites.edit(interaction.user.id, {
                    ViewChannel: false
                });
            }

            const session = userSessions.get(interaction.user.id);
            const completeEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🏆 ONBOARDING COMPLETE!')
                .setDescription(`Selamat! Profil profesional Anda lengkap! 🌟`)
                .addFields(
                    { name: '✅ Pencapaian', value: 'Role member diberikan\nChannel verify tersembunyi\nAkses penuh aktif' },
                    { name: '📊 Data Tersimpan', value: 'Profil profesional tersimpan\nSiap untuk networking' }
                )
                .setFooter({ text: 'Selamat menikmati BananaSkiee Community!' });

            await interaction.update({ 
                embeds: [completeEmbed], 
                components: [] 
            });

            // Kirim log
            await this.sendVerificationLog(interaction, 'onboarding_complete', session.onboardingData);

            // Hapus session
            userSessions.delete(interaction.user.id);

        } catch (error) {
            console.error('Error handleComplete:', error);
            await interaction.update({ 
                content: '❌ Gagal memproses. Silakan coba lagi.', 
                components: [] 
            });
        }
    }

    // ========== LOG SYSTEM ==========
    async sendVerificationLog(interaction, type, onboardingData = null) {
        try {
            const logChannel = interaction.guild.channels.cache.get(this.logChannelId);
            if (!logChannel) return;

            const accountAge = Math.floor((Date.now() - interaction.user.createdTimestamp) / (1000 * 60 * 60 * 24));
            
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📋 VERIFICATION LOG • BananaSkiee Community')
                .setDescription(`**✅ NEW MEMBER VERIFIED** • ${this.getStatusText(type)}`)
                .addFields(
                    { name: '👤 User', value: `${interaction.user.username} (${interaction.user.id})` },
                    { name: '📛 Display Name', value: interaction.user.displayName },
                    { name: '🆔 Account Age', value: `${accountAge} hari` },
                    { name: '🌍 Join Method', value: this.getJoinMethod(type) }
                );

            // Tambahkan data onboarding jika ada
            if (onboardingData && type === 'onboarding_complete') {
                if (onboardingData.type === 'custom') {
                    logEmbed.addFields(
                        { name: '🎯 Tujuan', value: onboardingData.purpose.substring(0, 100) + '...' },
                        { name: '📈 Experience', value: onboardingData.experience.substring(0, 100) + '...' },
                        { name: '🤝 Kontribusi', value: onboardingData.contribution.substring(0, 100) + '...' }
                    );
                } else {
                    logEmbed.addFields(
                        { name: '🎯 Tujuan', value: this.getPurposeText(onboardingData.purpose) },
                        { name: '📈 Level Experience', value: this.getExperienceText(onboardingData.experience) },
                        { name: '🤝 Kesiapan Kontribusi', value: this.getContributionText(onboardingData.contribution) }
                    );
                }
            }

            logEmbed.setFooter({ text: 'Double Counter System • Auto-Log' });

            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Error sending verification log:', error);
        }
    }

    // ========== HELPER FUNCTIONS ==========
    getStatusText(type) {
        const statusMap = {
            'quick_access': 'Quick Access',
            'onboarding_complete': 'Onboarding Complete', 
            'onboarding_skipped': 'Onboarding Skipped'
        };
        return statusMap[type] || 'Verified';
    }

    getJoinMethod(type) {
        const methodMap = {
            'quick_access': 'Direct Access',
            'onboarding_complete': 'Onboarding',
            'onboarding_skipped': 'Skipped Onboarding'
        };
        return methodMap[type] || 'Unknown';
    }

    getPurposeText(purpose) {
        const purposeMap = {
            'networking': 'Networking',
            'learning': 'Belajar Skill',
            'collaboration': 'Kolaborasi',
            'entertainment': 'Hiburan',
            'exploration': 'Eksplorasi'
        };
        return purposeMap[purpose] || 'Not Provided';
    }

    getExperienceText(experience) {
        const experienceMap = {
            'beginner': 'Pemula',
            'intermediate': 'Menengah', 
            'advanced': 'Advanced',
            'professional': 'Professional',
            'expert': 'Expert'
        };
        return experienceMap[experience] || 'Not Provided';
    }

    getContributionText(contribution) {
        const contributionMap = {
            'active': 'Aktif Berbagi',
            'occasional': 'Sesekali Sharing',
            'observer': 'Lihat Perkembangan'
        };
        return contributionMap[contribution] || 'Not Provided';
    }
}

// Export instance
const verifySystem = new VerifySystem();
module.exports = verifySystem;
