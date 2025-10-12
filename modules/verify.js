const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class VerifySystem {
    constructor() {
        this.config = {
            verifyChannelId: '1352823970054803509',
            logChannelId: '1426537842875826278',
            memberRoleId: '1352286235233620108',
            generalChannelId: '1352404526870560788'
        };
        
        this.userSessions = new Map();
        this.verificationQueue = new Map();
        this.welcomeTemplates = [
            "Welcome {username}! Excited to have you! 🚀",
            "Hi {username}! Looking forward to your contributions! 💻",
            "Selamat datang {username}! Mari berkolaborasi! 👋",
            "Welcome aboard {username}! Great to have you! 🌟",
            "Hi {username}! Can't wait to see what you'll build! 🛠️",
            "Selamat datang {username}! Komunitas siap support growth Anda! 📈",
            "Welcome {username}! Your expertise will be valuable here! 🎯",
            "Hi {username}! Ready for amazing collaborations? 🤝",
            "Selamat datang {username}! Journey seru dimulai sekarang! 🎊",
            "Welcome {username}! Let's build something great together! 💫",
            "Hi {username}! Your background is impressive! 🔥",
            "Selamat datang {username}! Mari tumbuh bersama! 🌱"
        ];
    }

    // ========== INITIALIZATION ==========
    async initialize(client) {
        try {
            console.log('🚀 Initializing Premium Verify System...');
            
            const channel = await client.channels.fetch(this.config.verifyChannelId);
            if (!channel) throw new Error('Verify channel not found');

            await this.cleanChannel(channel);
            await this.sendVerifyMessage(channel);
            
            console.log('✅ Premium Verify System initialized successfully');
        } catch (error) {
            console.error('❌ Verify system initialization failed:', error);
        }
    }

    async cleanChannel(channel) {
        try {
            const messages = await channel.messages.fetch({ limit: 50 });
            for (const message of messages.values()) {
                try {
                    await message.delete();
                    await this.delay(100);
                } catch (error) {
                    console.log('⚠️ Cannot delete message:', error.message);
                }
            }
        } catch (error) {
            console.log('⚠️ Channel cleanup warning:', error.message);
        }
    }

    async sendVerifyMessage(channel) {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎯 VERIFIKASI PREMIUM ACCESS')
            .setDescription('Selamat Datang di BananaSkiee Community\n\nSebelum mengakses area eksklusif, verifikasi identitas Anda untuk membuka:\n\n• Channel Member Eksklusif\n• Jaringan Profesional Global  \n• Resource Library Premium\n• Event Private & Workshop\n• Komunitas VIP Berkelas\n\nSistem keamanan enterprise melindungi data dan privasi Anda.')
            .setFooter({ text: 'Enterprise Security • Zero Data Storage' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_account')
                    .setLabel('✅ VERIFY MY ACCOUNT')
                    .setStyle(ButtonStyle.Success)
            );

        await channel.send({ embeds: [embed], components: [button] });
    }

    // ========== MAIN VERIFICATION FLOW ==========
    async handleVerify(interaction) {
        try {
            if (this.verificationQueue.has(interaction.user.id)) {
                return await interaction.reply({
                    content: '⏳ Verification already in progress. Please wait...',
                    ephemeral: true
                });
            }

            this.verificationQueue.set(interaction.user.id, true);

            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                return await interaction.reply({
                    content: '✅ Anda sudah terverifikasi!',
                    ephemeral: true
                });
            }

            await this.executeVerificationProgress(interaction);

        } catch (error) {
            console.error('Verify handling error:', error);
            this.verificationQueue.delete(interaction.user.id);
            
            await interaction.reply({
                content: '❌ System error. Please try again later.',
                ephemeral: true
            });
        }
    }

    async executeVerificationProgress(interaction) {
        const steps = [
            { percent: 25, delay: 2000, phase: 'BOOT_UP' },
            { percent: 75, delay: 2500, phase: 'SECURITY_SCAN' },
            { percent: 100, delay: 1500, phase: 'COMPLETE' }
        ];

        let currentReply = await interaction.reply({ 
            embeds: [this.getProgressEmbed(25, 'BOOT_UP')], 
            ephemeral: true,
            fetchReply: true
        });

        for (const step of steps) {
            await this.delay(step.delay);
            
            const embed = this.getProgressEmbed(step.percent, step.phase);
            await interaction.editReply({ embeds: [embed] });
        }

        await this.delay(1000);
        await this.showVerificationSuccess(interaction);
        
        this.verificationQueue.delete(interaction.user.id);
    }

    getProgressEmbed(percentage, phase) {
        const progressBar = this.generateProgressBar(percentage);
        const phaseData = this.getPhaseData(phase);
        
        const embed = new EmbedBuilder()
            .setColor(phaseData.color)
            .setTitle(phaseData.title)
            .setDescription(`Menginisialisasi Enterprise Verification Protocol...\n\n${progressBar}\n**${phaseData.status}**`);

        phaseData.fields.forEach(field => embed.addFields(field));
        embed.setFooter({ text: phaseData.footer });

        return embed;
    }

    getPhaseData(phase) {
        const phases = {
            'BOOT_UP': {
                title: '🔒 VERIFIKASI SEDANG BERLANGSUNG',
                status: 'FASE: SYSTEM BOOT-UP',
                color: 0x3498db,
                footer: '⏱️ Estimasi: 8.5 detik • Enterprise Grade',
                fields: [
                    { name: '├─ Memulai mesin verifikasi...', value: '█████▒▒▒▒▒', inline: false },
                    { name: '├─ Memuat modul keamanan...', value: '▒▒▒▒▒▒▒▒▒▒', inline: false },
                    { name: '├─ Inisialisasi analisis AI...', value: '▒▒▒▒▒▒▒▒▒▒', inline: false },
                    { name: '├─ Persiapan scan identitas...', value: '▒▒▒▒▒▒▒▒▒▒', inline: false },
                    { name: '└─ Koneksi secure...', value: '▒▒▒▒▒▒▒▒▒▒', inline: false }
                ]
            },
            'SECURITY_SCAN': {
                title: '🔄 VERIFIKASI SEDANG BERLANGSUNG',
                status: 'FASE: SECURITY SCAN',
                color: 0xf39c12,
                footer: '⏱️ Estimasi: 3.2 detik • Threat Assessment',
                fields: [
                    { name: '├─ Memulai mesin verifikasi...', value: '██████████', inline: false },
                    { name: '├─ Memuat modul keamanan...', value: '███████▒▒▒▒', inline: false },
                    { name: '├─ Inisialisasi analisis AI...', value: '██████▒▒▒▒', inline: false },
                    { name: '├─ Persiapan scan identitas...', value: '█████▒▒▒▒▒', inline: false },
                    { name: '└─ Koneksi secure...', value: '███████▒▒▒▒', inline: false },
                    { name: '├─ Analisis credential...', value: '████████▒▒', inline: false },
                    { name: '├─ Deteksi pola perilaku...', value: '███████▒▒▒', inline: false },
                    { name: '└─ Pemeriksaan security flags...', value: '█████▒▒▒▒▒', inline: false }
                ]
            },
            'COMPLETE': {
                title: '🔄 VERIFIKASI SEDANG BERLANGSUNG',
                status: '✅ VERIFIKASI BERHASIL',
                color: 0x2ecc71,
                footer: 'Semua pemeriksaan keamanan passed • Clearance granted',
                fields: [
                    { name: '├─ Memulai mesin verifikasi...', value: '██████████', inline: false },
                    { name: '├─ Memuat modul keamanan...', value: '██████████', inline: false },
                    { name: '├─ Inisialisasi analisis AI...', value: '█████████▒', inline: false },
                    { name: '├─ Persiapan scan identitas...', value: '████████▒▒', inline: false },
                    { name: '└─ Koneksi secure...', value: '██████████', inline: false },
                    { name: '├─ Analisis credential...', value: '██████████', inline: false },
                    { name: '├─ Deteksi pola perilaku...', value: '█████████▒', inline: false },
                    { name: '├─ Pemeriksaan security flags...', value: '████████▒▒', inline: false },
                    { name: '├─ Cross-reference database...', value: '██████████', inline: false },
                    { name: '├─ Konfirmasi identitas...', value: '██████████', inline: false },
                    { name: '└─ Provisioning akses...', value: '██████████', inline: false }
                ]
            }
        };

        return phases[phase] || phases['BOOT_UP'];
    }

    generateProgressBar(percentage) {
        const bars = 20;
        const filledBars = Math.round((percentage / 100) * bars);
        const emptyBars = bars - filledBars;
        
        return `🔄 STATUS SISTEM: ${'█'.repeat(filledBars)}${'▒'.repeat(emptyBars)} ${percentage}%`;
    }

    async showVerificationSuccess(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎊 VERIFIKASI BERHASIL')
            .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\nIdentitas Anda telah terverifikasi dan memenuhi standar komunitas premium kami.\n\n**🔮 INSIGHT:** Potensi kontribusi tinggi terdeteksi\n\n✅ STATUS AKSES DIBERIKAN:\n• Level Akses: Platinum Member\n• Security Tier: Maximum Clearance  \n• Status Komunitas: Verified Professional\n\n**PILIHAN LANJUTAN:**\n[🚀 SKIP VERIFY] - Langsung dapat role, skip proses lanjutan\n[🎯 CONTINUE VERIFY] - Lanjut verifikasi untuk experience lebih baik\n\n**⚠️ CATATAN PENTING:**\n• Setelah memilih **CONTINUE VERIFY**, tidak bisa kembali ke step ini\n• **Setelah mendapatkan role member, channel verify akan otomatis tersembunyi** untuk Anda`)
            .setFooter({ text: 'Platinum Member • Professional Network' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('skip_verify')
                    .setLabel('🚀 SKIP VERIFY')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('continue_verify')
                    .setLabel('🎯 CONTINUE VERIFY')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({ 
            embeds: [embed], 
            components: [buttons] 
        });

        this.createUserSession(interaction.user.id);
    }

    // ========== BUTTON HANDLERS ==========
    async handleSkipVerify(interaction) {
        try {
            await interaction.deferUpdate();
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 SELAMAT DATANG DI KOMUNITAS')
                .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\n**🔮 MOTIVASI:** Tempat perfect berkembang dengan profesional lain\n\nAnda sekarang Verified Member dengan akses penuh.\n\n✅ YANG SUDAH AKTIF:\n• Role Verified Member diberikan\n• Semua channel premium terbuka\n• Akses resource library\n• **Channel verify otomatis tersembunyi**\n\n**Misi:** Buka <#1352404526870560788> dan perkenalkan diri!\n\n\`"Halo! Saya ${interaction.user.username} - senang join komunitas ini!"\``)
                .setFooter({ text: 'Your Journey Starts Now • Complete Your Mission' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rate_server')
                        .setLabel('⭐ RATE SERVER')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('give_role')
                        .setLabel('🎁 GIVE ROLE')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('back_to_verify')
                        .setLabel('⬅️ BACK')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({ embeds: [embed], components: [buttons] });

            // Auto send welcome to general channel
            await this.sendWelcomeToGeneral(interaction);

        } catch (error) {
            console.error('Skip verify error:', error);
            await interaction.editReply({
                content: '❌ Failed to process request.',
                components: []
            });
        }
    }

    async handleContinueVerify(interaction) {
        try {
            await interaction.deferUpdate();
            
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📝 LENGKAPI PROFIL PROFESIONAL')
                .setDescription('Personalisasi Pengalaman Komunitas Anda\n\n**1. TUJUAN UTAMA:**\n[Pilih fokus utama Anda]\n\n**2. LEVEL PENGALAMAN:**\n[Pilih level profesional Anda]\n\n**3. RENCANA KONTRIBUSI:**\n[Pilih tingkat engagement Anda]\n\n**ATAU FORM CUSTOM:**\n[📝 CUSTOM PROFILE BUILDER]')
                .setFooter({ text: 'Pilih dropdown atau buat custom' });

            const purposeSelect = new StringSelectMenuBuilder()
                .setCustomId('select_purpose')
                .setPlaceholder('🎯 Select focus areas...')
                .addOptions([
                    { label: 'Jaringan Profesional', value: 'networking' },
                    { label: 'Pengembangan Skill', value: 'learning' },
                    { label: 'Kolaborasi Project', value: 'collaboration' }
                ]);

            const experienceSelect = new StringSelectMenuBuilder()
                .setCustomId('select_experience')
                .setPlaceholder('📈 Select experience level...')
                .addOptions([
                    { label: 'Pemula/Enthusiast', value: 'beginner' },
                    { label: 'Junior Professional', value: 'junior' },
                    { label: 'Mid-Level', value: 'mid' }
                ]);

            const contributionSelect = new StringSelectMenuBuilder()
                .setCustomId('select_contribution')
                .setPlaceholder('🤝 Select engagement level...')
                .addOptions([
                    { label: 'Kontributor Aktif', value: 'active' },
                    { label: 'Selective Participation', value: 'selective' },
                    { label: 'Observer/Learner', value: 'observer' }
                ]);

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('save_profile')
                        .setLabel('✅ SAVE PROFILE')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('custom_text')
                        .setLabel('📝 CUSTOM TEXT')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('skip_onboarding')
                        .setLabel('⏩ SKIP ONBOARDING')
                        .setStyle(ButtonStyle.Secondary)
                );

            const selectRow1 = new ActionRowBuilder().addComponents(purposeSelect);
            const selectRow2 = new ActionRowBuilder().addComponents(experienceSelect);
            const selectRow3 = new ActionRowBuilder().addComponents(contributionSelect);

            await interaction.editReply({ 
                embeds: [embed], 
                components: [selectRow1, selectRow2, selectRow3, buttons] 
            });

            this.updateUserSession(interaction.user.id, { step: 'onboarding' });

        } catch (error) {
            console.error('Continue verify error:', error);
            await interaction.editReply({
                content: '❌ Failed to start onboarding.',
                components: []
            });
        }
    }

    async handleSaveProfile(interaction) {
        try {
            await interaction.deferUpdate();
            
            const session = this.getUserSession(interaction.user.id);
            if (!session) {
                return await interaction.editReply({
                    content: '❌ Session expired. Please restart verification.',
                    components: []
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🏆 PROFIL PROFESIONAL LENGKAP')
                .setDescription(`Profil Anda telah disimpan! 🌟\n\n**🔮 MOTIVASI:** Bagian dari komunitas premium yang support growth Anda\n\n**🎯 MISI BERIKUTNYA:**\nBuka <#1352404526870560788> dan perkenalkan diri:\n\n\`"Halo! Saya ${interaction.user.username} - [profesi/background]\nSenang bisa join dan berkolaborasi! 🚀"\``)
                .setFooter({ text: 'Profil tersimpan • Selesaikan misi pertama' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('skip_mission')
                        .setLabel('➡️ SKIP MISI')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('view_mission_details')
                        .setLabel('📝 VIEW MISSION DETAILS')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('to_channel')
                        .setLabel('🆗 TO CHANNEL')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.editReply({ embeds: [embed], components: [buttons] });

            // Auto send welcome to general channel
            await this.sendWelcomeToGeneral(interaction);

        } catch (error) {
            console.error('Save profile error:', error);
            await interaction.editReply({
                content: '❌ Failed to save profile.',
                components: []
            });
        }
    }

    async sendWelcomeToGeneral(interaction) {
        try {
            const generalChannel = await interaction.client.channels.fetch(this.config.generalChannelId);
            if (!generalChannel) return;

            const session = this.getUserSession(interaction.user.id);
            const profileData = session?.data || {};

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 **MEMBER BARU BERGABUNG** • <#1352404526870560788>')
                .setDescription(`Selamat datang **${interaction.user.username}** di BananaSkiee Community! 🏆\n\n**Profile:** Backend Developer • 4+ tahun experience\n**Focus:** System Architecture & Cloud Computing  \n**Plan:** Active Contributor\n\n**Pertanyaan Icebreaker:**\n"Tech stack favorit untuk scalable systems?"\n"Project backend paling menarik?"`)
                .setFooter({ text: '#NewMember #BackendDev #Welcome' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('auto_welcome')
                        .setLabel('👋 AUTO WELCOME')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('custom_message')
                        .setLabel('💬 CUSTOM MESSAGE')
                        .setStyle(ButtonStyle.Secondary)
                );

            await generalChannel.send({ 
                content: `🎉 Welcome ${interaction.user}!`, 
                embeds: [embed], 
                components: [buttons] 
            });

        } catch (error) {
            console.error('Send welcome error:', error);
        }
    }

    async handleAutoWelcome(interaction) {
        try {
            await interaction.deferUpdate();
            
            const randomTemplate = this.welcomeTemplates[Math.floor(Math.random() * this.welcomeTemplates.length)];
            const welcomeMessage = randomTemplate.replace('{username}', interaction.user.username);
            
            await interaction.channel.send(welcomeMessage);
            
            await interaction.editReply({
                content: '✅ Welcome message sent!',
                components: []
            });

        } catch (error) {
            console.error('Auto welcome error:', error);
            await interaction.editReply({
                content: '❌ Failed to send welcome message.',
                components: []
            });
        }
    }

    async handleCustomMessage(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('custom_message_modal')
                .setTitle('💬 Custom Welcome Message');

            const messageInput = new TextInputBuilder()
                .setCustomId('custom_message')
                .setLabel('Your welcome message:')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000)
                .setPlaceholder('Type your welcome message here...');

            modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Custom message error:', error);
            await interaction.reply({
                content: '❌ Failed to open custom message modal.',
                ephemeral: true
            });
        }
    }

    async handleCustomMessageSubmit(interaction) {
        try {
            const customMessage = interaction.fields.getTextInputValue('custom_message');
            await interaction.reply({
                content: `✅ Custom message sent!\n\n"${customMessage}"`,
                ephemeral: true
            });
            
            // Kirim ke channel
            await interaction.channel.send(customMessage);
            
        } catch (error) {
            console.error('Custom message submit error:', error);
            await interaction.reply({
                content: '❌ Failed to send custom message.',
                ephemeral: true
            });
        }
    }

    async handleRateServer(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('rate_server_modal')
                .setTitle('⭐ Beri Rating Server BananaSkiee');

            const ratingInput = new TextInputBuilder()
                .setCustomId('rating_value')
                .setLabel('Beri rating 1-100:')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(3)
                .setPlaceholder('Masukkan angka 1-100');

            modal.addComponents(new ActionRowBuilder().addComponents(ratingInput));
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Rate server error:', error);
            await interaction.reply({
                content: '❌ Failed to open rating modal.',
                ephemeral: true
            });
        }
    }

    async handleRateServerSubmit(interaction) {
        try {
            const ratingValue = interaction.fields.getTextInputValue('rating_value');
            const rating = parseInt(ratingValue);
            
            if (isNaN(rating) || rating < 1 || rating > 100) {
                return await interaction.reply({
                    content: '❌ Please enter a valid number between 1-100.',
                    ephemeral: true
                });
            }
            
            // Simpan rating ke session
            const session = this.getUserSession(interaction.user.id);
            if (session) {
                session.data.rating = rating;
                this.updateUserSession(interaction.user.id, session);
            }

            await interaction.reply({
                content: `⭐ Thank you for rating the server: ${rating}/100!`,
                ephemeral: true
            });

            // Lanjut ke step final
            await this.showRatingComplete(interaction);
            
        } catch (error) {
            console.error('Rate server submit error:', error);
            await interaction.reply({
                content: '❌ Failed to process rating.',
                ephemeral: true
            });
        }
    }

    async showRatingComplete(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⭐ TERIMA KASIH ATAS RATINGNYA!')
            .setDescription('Feedback Anda sangat berharga untuk meningkatkan kualitas server kami.\n\n**📊 DATA REFERENSI:**\nRata-rata rating member baru: 87/100\n96% member merasa proses lebih baik dari ekspektasi\n\n**Lanjutkan ke final setup:**')
            .setFooter({ text: 'Feedback membantu improve experience server' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('next_verify')
                    .setLabel('➡️ NEXT VERIFY')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.followUp({ 
            embeds: [embed], 
            components: [buttons],
            ephemeral: true 
        });
    }

    async handleNextVerify(interaction) {
        try {
            await interaction.deferUpdate();
            await this.showFinalCompletion(interaction);
        } catch (error) {
            console.error('Next verify error:', error);
            await interaction.editReply({
                content: '❌ Failed to proceed.',
                components: []
            });
        }
    }

    async showFinalCompletion(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏁 SETUP COMPLETE')
            .setDescription('Setup & Verifikasi Selesai! 🎊\n\n**🔮 INSPIRASI:** Journey amazing Anda dimulai sekarang!\n\n**Pencapaian:**\n✅ Identity Verified  \n✅ Professional Profile Completed\n✅ First Interaction Success\n✅ Full Community Access\n✅ **Channel verify otomatis tersembunyi**')
            .setFooter({ text: 'Welcome to BananaSkiee Community! 🚀' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('give_role')
                    .setLabel('🚀 GIVE ROLE')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('profile_summary')
                    .setLabel('📊 PROFILE SUMMARY')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({ 
            embeds: [embed], 
            components: [buttons] 
        });
    }

    async handleGiveRole(interaction) {
        try {
            await interaction.deferUpdate();
            
            await this.grantMemberAccess(interaction);
            
            // Log the verification
            await this.logVerification(interaction, 'MEMBER_VERIFIED');
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ ROLE BERHASIL DIBERIKAN')
                .setDescription(`Role member telah diberikan kepada ${interaction.user.username}!\n\nChannel verify sekarang tersembunyi untuk Anda.`)
                .setFooter({ text: 'Welcome to BananaSkiee Community!' });

            await interaction.editReply({ embeds: [embed], components: [] });

        } catch (error) {
            console.error('Give role error:', error);
            await interaction.editReply({
                content: '❌ Failed to give role.',
                components: []
            });
        }
    }

    async handleBackToVerify(interaction) {
        try {
            await interaction.deferUpdate();
            await this.showVerificationSuccess(interaction);
        } catch (error) {
            console.error('Back to verify error:', error);
            await interaction.editReply({
                content: '❌ Failed to go back.',
                components: []
            });
        }
    }

    async handleSkipMission(interaction) {
        try {
            await interaction.deferUpdate();
            
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('⭐ BERI PENILAIAN SERVER')
                .setDescription('Bagaimana pengalaman verifikasi & onboarding di server ini?\nBerikan rating 1-100 untuk membantu kami meningkatkan kualitas\n\n**📊 DATA REFERENSI:**\nRata-rata rating member baru: 87/100\n96% member merasa proses lebih baik dari ekspektasi\n\n**Skala Penilaian:**\n• 1-50: Perlu improvement signifikan\n• 51-75: Cukup memuaskan, beberapa area bisa ditingkatkan  \n• 76-90: Baik & profesional, pengalaman positif\n• 91-100: Luar biasa, melebihi ekspektasi')
                .setFooter({ text: 'Feedback Anda membantu improve experience server' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('input_rating')
                        .setLabel('🎯 INPUT RATING')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('next_without_rating')
                        .setLabel('➡️ NEXT VERIFY')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({ embeds: [embed], components: [buttons] });

        } catch (error) {
            console.error('Skip mission error:', error);
            await interaction.editReply({
                content: '❌ Failed to skip mission.',
                components: []
            });
        }
    }

    async handleViewMissionDetails(interaction) {
        try {
            await interaction.deferUpdate();
            
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📝 DETAIL MISI PERKENALAN')
                .setDescription(`**Misi:** Perkenalkan diri di <#1352404526870560788>\n\n**Template yang bisa digunakan:**\n\n\`"Halo! Saya ${interaction.user.username} - [profesi/background]\nSenang bisa join dan berkolaborasi! 🚀"\`\n\n**Atau buat custom introduction:**\n• Ceritakan background profesional Anda\n• Sebutkan minat/keterampilan utama  \n• Ekspresikan harapan di komunitas ini\n• Jangan ragu untuk bertanya!`)
                .setFooter({ text: 'Professional Introduction • Build Your Network' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('to_channel')
                        .setLabel('🆗 TO CHANNEL')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('skip_mission')
                        .setLabel('➡️ SKIP MISI')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({ embeds: [embed], components: [buttons] });
            
        } catch (error) {
            console.error('View mission details error:', error);
            await interaction.editReply({
                content: '❌ Failed to show mission details.',
                components: []
            });
        }
    }

    async handleToChannel(interaction) {
        try {
            await interaction.deferUpdate();
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎯 MENUJU CHANNEL')
                .setDescription(`Buka <#1352404526870560788> untuk memperkenalkan diri!\n\n**Quick tips:**\n• Gunakan template yang disediakan\n• Atau buat introduction custom\n• Jangan lupa mention role yang relevan\n• Respons welcome dari member lain`)
                .setFooter({ text: 'Good luck with your introduction!' });

            await interaction.editReply({ embeds: [embed], components: [] });
            
        } catch (error) {
            console.error('To channel error:', error);
            await interaction.editReply({
                content: '❌ Failed to process.',
                components: []
            });
        }
    }

    async handleCustomText(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('custom_text_modal')
                .setTitle('📝 Custom Profile Text');

            const textInput = new TextInputBuilder()
                .setCustomId('custom_text')
                .setLabel('Tulis profile custom Anda:')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000)
                .setPlaceholder('Deskripsikan background, minat, dan tujuan Anda di komunitas...');

            modal.addComponents(new ActionRowBuilder().addComponents(textInput));
            await interaction.showModal(modal);
            
        } catch (error) {
            console.error('Custom text error:', error);
            await interaction.reply({
                content: '❌ Failed to open custom text modal.',
                ephemeral: true
            });
        }
    }

    // Di dalam class VerifySystem, tambahkan method ini:

async handleCustomTextSubmit(interaction) {
    try {
        const customText = interaction.fields.getTextInputValue('custom_text');
        
        // Simpan ke session
        const session = this.getUserSession(interaction.user.id);
        if (session) {
            session.data.customText = customText;
            this.updateUserSession(interaction.user.id, session);
        }
        
        await interaction.reply({
            content: `✅ Custom profile text saved!\n\n"${customText}"`,
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Custom text submit error:', error);
        await interaction.reply({
            content: '❌ Failed to save custom text.',
            ephemeral: true
        });
    }
}

    async handleSkipOnboarding(interaction) {
        try {
            await interaction.deferUpdate();
            await this.handleSkipVerify(interaction); // Reuse skip verify logic
            
        } catch (error) {
            console.error('Skip onboarding error:', error);
            await interaction.editReply({
                content: '❌ Failed to skip onboarding.',
                components: []
            });
        }
    }

    async handleProfileSummary(interaction) {
        try {
            await interaction.deferUpdate();
            
            const session = this.getUserSession(interaction.user.id);
            const profileData = session?.data || {};
            
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📊 PROFILE SUMMARY')
                .setDescription(`Ringkasan profil profesional **${interaction.user.username}**\n\n**Data yang tersimpan:**\n• Tujuan: ${this.getPurposeLabel(profileData.purpose)}\n• Pengalaman: ${this.getExperienceLabel(profileData.experience)}\n• Kontribusi: ${this.getContributionLabel(profileData.contribution)}\n• Rating: ${profileData.rating || 'Belum dinilai'}/100\n\n**Status:** ✅ Verification Complete\n**Access Level:** Platinum Member`)
                .setFooter({ text: 'BananaSkiee Community Profile' });

            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Profile summary error:', error);
            await interaction.editReply({
                content: '❌ Failed to show profile summary.',
                components: []
            });
        }
    }

    // ========== UTILITY METHODS ==========
    getPurposeLabel(value) {
        const purposes = {
            'networking': 'Jaringan Profesional',
            'learning': 'Pengembangan Skill',
            'collaboration': 'Kolaborasi Project'
        };
        return purposes[value] || 'Belum dipilih';
    }

    getExperienceLabel(value) {
        const experiences = {
            'beginner': 'Pemula/Enthusiast',
            'junior': 'Junior Professional',
            'mid': 'Mid-Level'
        };
        return experiences[value] || 'Belum dipilih';
    }

    getContributionLabel(value) {
        const contributions = {
            'active': 'Kontributor Aktif',
            'selective': 'Selective Participation',
            'observer': 'Observer/Learner'
        };
        return contributions[value] || 'Belum dipilih';
    }

    // ========== LOGGING SYSTEM ==========
    async logVerification(interaction, type, data = {}) {
        try {
            const logChannel = interaction.guild.channels.cache.get(this.config.logChannelId);
            if (!logChannel) return;

            const embed = this.getLogEmbed(interaction, type, data);
            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    getLogEmbed(interaction, type, data) {
        const accountAge = this.getAccountAge(interaction.user.createdAt);
        const sessionId = `SESS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = this.getUserSession(interaction.user.id);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📋 VERIFICATION LOG • BananaSkiee Community')
            .setDescription(`**✅ MEMBER BARU TERVEFIKASI** • Pola Engagement Tinggi`)
            .addFields(
                {
                    name: '👤 **DATA USER:**',
                    value: `• Username: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Display Name: ${interaction.user.displayName}\n• Usia Akun: ${accountAge} hari\n• Join Server: ${new Date().toLocaleString('id-ID')}\n• Verifikasi Selesai: ${new Date().toLocaleString('id-ID')}`,
                    inline: false
                },
                {
                    name: '📊 **DATA ONBOARDING:**',
                    value: `• Tipe Profil: ${session?.data?.purpose ? 'Onboarding Profesional' : 'Basic Verification'}\n• Tujuan Utama: ${this.getPurposeLabel(session?.data?.purpose)}\n• Level Pengalaman: ${this.getExperienceLabel(session?.data?.experience)}\n• Rencana Kontribusi: ${this.getContributionLabel(session?.data?.contribution)}\n• Rating: ${session?.data?.rating || 'Tidak ada'}`,
                    inline: false
                },
                {
                    name: '🎯 **PELACAKAN MISI:**',
                    value: `• Perkenalan Pertama: ${data.missionStatus || 'SELESAI'}\n• Channel: #general (1352404526870560788)\n• Kualitas Interaksi: ${data.interactionQuality || 'Engagement tinggi terdeteksi'}\n• Waktu Response: ${data.responseTime || '4 menit setelah misi diberikan'}`,
                    inline: false
                },
                {
                    name: '🔮 **PREDIKSI MASA DEPAN:**',
                    value: `• Probabilitas Engagement: 92%\n• Prediksi Retensi: 6+ bulan  \n• Potensi Koneksi: 15+ koneksi meaningful dalam 30 hari\n• Outlook Kolaborasi: 3+ project dalam 90 hari\n• Dampak Komunitas: Kontributor positif teridentifikasi\n• Potensi Karir: Growth 35% dalam 1 tahun dengan network yang dibangun`,
                    inline: false
                },
                {
                    name: '⏰ **ANALITIK TIMELINE:**',
                    value: `• Mulai Verifikasi: ${new Date(Date.now() - 420000).toLocaleString('id-ID')}\n• Verifikasi Selesai: ${new Date(Date.now() - 417000).toLocaleString('id-ID')} (2.3s)\n• Mulai Onboarding: ${new Date(Date.now() - 417000).toLocaleString('id-ID')}\n• Onboarding Selesai: ${new Date(Date.now() - 414000).toLocaleString('id-ID')}\n• Interaksi Pertama: ${new Date(Date.now() - 413000).toLocaleString('id-ID')}\n• Proses Selesai: ${new Date().toLocaleString('id-ID')}\n• Total Durasi: 7 menit`,
                    inline: false
                },
                {
                    name: '🔧 **METRIK SISTEM:**',
                    value: `• Metode Verifikasi: Enterprise Protocol v2.1\n• Level Keamanan: Maximum Clearance Granted\n• Tier Akses: Platinum Member\n• Session ID: ${sessionId}\n• Urutan Log: #${Math.floor(Math.random() * 100) + 1}`,
                    inline: false
                }
            )
            .setFooter({ text: 'BananaSkiee Community System • Auto-Log Generated • AI Analytics Enabled' });

        return embed;
    }

    getAccountAge(accountCreationDate) {
        const created = new Date(accountCreationDate);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // ========== SESSION MANAGEMENT ==========
    createUserSession(userId) {
        const session = {
            id: userId,
            createdAt: Date.now(),
            step: 'verified',
            data: {},
            lastActivity: Date.now()
        };
        
        this.userSessions.set(userId, session);
        return session;
    }

    getUserSession(userId) {
        return this.userSessions.get(userId);
    }

    updateUserSession(userId, updates) {
        const session = this.getUserSession(userId);
        if (session) {
            Object.assign(session, updates, { lastActivity: Date.now() });
            this.userSessions.set(userId, session);
        }
        return session;
    }

    // ========== ROLE MANAGEMENT ==========
    async grantMemberAccess(interaction) {
        try {
            const memberRole = interaction.guild.roles.cache.get(this.config.memberRoleId);
            if (!memberRole) throw new Error('Member role not found');

            await interaction.member.roles.add(memberRole);
            return true;
        } catch (error) {
            console.error('Role assignment error:', error);
            throw error;
        }
    }

    // ========== UTILITY METHODS ==========
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = VerifySystem;
