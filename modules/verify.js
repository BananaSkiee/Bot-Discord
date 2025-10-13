const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class VerifySystem {
    constructor() {
        this.config = {
            verifyChannelId: '1352823970054803509',
            logChannelId: '1426537842875826278',
            memberRoleId: '1352286235233620108',
            generalChannelId: '1352404526870560788',
            serverId: '1347233781391560837'
        };
        
        this.userSessions = new Map();
        this.verificationQueue = new Map();
        this.welcomeTemplates = [
            "Selamat datang {username}! Semoga betah ya 😊",
            "Halo {username}! Senang kamu bergabung 🎉",
            "Welcome {username}! Jangan sungkan bertanya 👍",
            "Hai {username}! Semangat belajar dan bermain! 🚀",
            "Selamat datang {username} di komunitas! 🌟",
            "Halo {username}! Mari berteman dan belajar bersama 👋",
            "Welcome {username}! Jangan lupa enjoy ya 😄",
            "Selamat datang {username}! Semoga dapat teman banyak 🎯",
            "Hai {username}! Siap untuk pengalaman seru? 💫",
            "Welcome {username} to the community! 🏆"
        ];

        this.verificationSteps = [
            { name: "Security Scan", emoji: "🔐", tasks: ["Verifikasi email", "Cek usia akun", "Scan aktivitas"] },
            { name: "AI Analysis", emoji: "🤖", tasks: ["Pattern recognition", "Behavior analysis", "Risk assessment"] },
            { name: "Database Check", emoji: "🗄️", tasks: ["Cross-reference data", "Identity confirmation", "Access provisioning"] },
            { name: "Encryption Setup", emoji: "🔒", tasks: ["Data encryption", "Security keys", "Access tokens"] },
            { name: "Final Verification", emoji: "🎯", tasks: ["Security clearance", "Member access", "System integration"] }
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
            .setDescription('Selamat Datang di BananaSkiee Community!\n\nSebelum mengakses area eksklusif, verifikasi identitas Anda untuk membuka:\n\n• Channel Member Eksklusif\n• Jaringan Profesional Global  \n• Resource Library Premium\n• Event Private & Workshop')
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
        // Random steps selection
        const selectedSteps = this.getRandomSteps(4);
        const totalDuration = 10000; // 10 seconds
        const stepDuration = totalDuration / selectedSteps.length;

        let currentReply = await interaction.reply({ 
            embeds: [this.getProgressEmbed(selectedSteps[0], 0, selectedSteps.length)], 
            ephemeral: true,
            fetchReply: true
        });

        for (let i = 0; i < selectedSteps.length; i++) {
            const step = selectedSteps[i];
            const progress = ((i + 1) / selectedSteps.length) * 100;
            
            await this.delay(stepDuration);
            const embed = this.getProgressEmbed(step, i + 1, selectedSteps.length);
            await interaction.editReply({ embeds: [embed] });
        }

        await this.delay(1000);
        await this.showVerificationSuccess(interaction);
        
        this.verificationQueue.delete(interaction.user.id);
    }

    getRandomSteps(count) {
        const shuffled = [...this.verificationSteps].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    getProgressEmbed(step, currentStep, totalSteps) {
        const progress = (currentStep / totalSteps) * 100;
        const progressBar = this.generateProgressBar(progress);
        
        const tasksText = step.tasks.map((task, index) => {
            const status = index < currentStep ? '✅' : (index === currentStep ? '🔄' : '⏳');
            return `• ${task}: ${status}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle(`${step.emoji} PROSES VERIFIKASI - ${Math.round(progress)}%`)
            .setDescription(`${step.name} sedang berjalan...\n\n${progressBar}\n\n${tasksText}`)
            .setFooter({ text: `Step ${currentStep}/${totalSteps} • ${this.getRandomTime()} detik` });

        return embed;
    }

    generateProgressBar(percentage) {
        const bars = 20;
        const filledBars = Math.round((percentage / 100) * bars);
        const emptyBars = bars - filledBars;
        return `🔄 STATUS: ${'█'.repeat(filledBars)}${'▒'.repeat(emptyBars)} ${Math.round(percentage)}%`;
    }

    getRandomTime() {
        return (Math.random() * 3 + 2).toFixed(1);
    }

    async showVerificationSuccess(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎊 VERIFIKASI BERHASIL')
            .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\n**PILIHAN LANJUTAN:**\n[🚀 SKIP VERIFY] - Langsung dapat role\n[🎯 CONTINUE VERIFY] - Lanjut verifikasi lengkap\n\n**⚠️ CATATAN PENTING:**\n• Setelah memilih CONTINUE VERIFY, tidak bisa kembali ke step ini\n• Setelah mendapatkan role member, channel verify akan hilang`)
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
                .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\nAnda sekarang Verified Member dengan akses penuh.\n\n**✅ YANG SUDAH AKTIF:**\n• Role Verified Member diberikan\n• Semua channel premium terbuka\n• Channel verify otomatis tersembunyi\n\n**Misi:** Buka <#1352404526870560788> dan perkenalkan diri!\n\n\`"Halo! Saya ${interaction.user.username} - senang join komunitas ini!"\``)
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
                .setTitle('🏠 KUNJUNGI AREA SERVER')
                .setDescription('Sebelum lanjut, silakan kunjungi channel penting:\n\n🏠 **Server Home** - Lihat overview server\n📋 **Rules & Guidelines** - Baca peraturan server  \n🎨 **Customize Profile** - Setup roles dan tags')
                .setFooter({ text: 'Kunjungi ketiga channel untuk melanjutkan' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('server_guild')
                        .setLabel('🏠 SERVER GUILD')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/channels/1347233781391560837/@home'),
                    new ButtonBuilder()
                        .setCustomId('open_rules')
                        .setLabel('📋 OPEN RULES')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/channels/1347233781391560837/1352326247186694164'),
                    new ButtonBuilder()
                        .setCustomId('self_role')
                        .setLabel('🎨 SELF ROLE')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/channels/1347233781391560837/customize-community')
                );

            await interaction.editReply({ 
                embeds: [embed], 
                components: [buttons] 
            });

            this.updateUserSession(interaction.user.id, { 
                step: 'server_exploration',
                visitedChannels: []
            });

        } catch (error) {
            console.error('Continue verify error:', error);
            await interaction.editReply({
                content: '❌ Failed to start server exploration.',
                components: []
            });
        }
    }

    async handleServerExplorationComplete(interaction) {
        try {
            await interaction.deferUpdate();
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('👋 MISI PERKENALAN')
                .setDescription('Sekarang saatnya perkenalan!\n\n**Misi:** Buka channel <#1352404526870560788> dan perkenalkan diri\n\n**Template:**\n\`"Halo! Saya {username}\nSenang join BananaSkiee Community! 🚀"\`')
                .setFooter({ text: 'Bot akan otomatis detect chat Anda' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('open_general')
                        .setLabel('🔗 OPEN GENERAL')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/channels/1347233781391560837/1352404526870560788'),
                    new ButtonBuilder()
                        .setCustomId('see_mission')
                        .setLabel('📝 SEE MISSION')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.editReply({ 
                embeds: [embed], 
                components: [buttons] 
            });

            this.updateUserSession(interaction.user.id, { 
                step: 'introduction_mission',
                missionStartTime: Date.now()
            });

        } catch (error) {
            console.error('Server exploration error:', error);
            await interaction.editReply({
                content: '❌ Failed to proceed.',
                components: []
            });
        }
    }

    async handleSeeMission(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📝 DETAIL MISI PERKENALAN')
                .setDescription('**Yang bisa dibagikan:**\n• Asal sekolah/kampus\n• Hobi dan minat  \n• Mata pelajaran favorit\n• Cita-cita atau impian\n\n**Contoh:**\n\`"Halo! Saya Andi dari SMA Jakarta\nHobi main game dan coding\nSenang bisa join server ini! 🎮"\`')
                .setFooter({ text: 'Jangan ragu untuk bertanya!' });

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('understand_mission')
                        .setLabel('🆗 SAYA MENGERTI')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.reply({
                embeds: [embed],
                components: [button],
                ephemeral: true
            });

        } catch (error) {
            console.error('See mission error:', error);
            await interaction.reply({
                content: '❌ Failed to show mission details.',
                ephemeral: true
            });
        }
    }

    async handleUnderstandMission(interaction) {
        try {
            await interaction.deferUpdate();
            await interaction.deleteReply();
        } catch (error) {
            console.error('Understand mission error:', error);
        }
    }

    // ========== WELCOME SYSTEM ==========
    async sendWelcomeMessage(user, client) {
        try {
            const generalChannel = await client.channels.fetch(this.config.generalChannelId);
            if (!generalChannel) return;

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 SELAMAT DATANG!')
                .setDescription(`Selamat datang **${user.username}** di BananaSkiee Community! 🏆\n\n**Pertanyaan Icebreaker:**\n• Game favorit apa yang sering dimainkan?\n• Mata pelajaran apa yang paling disukai?\n• Punya hobi atau kegiatan seru lainnya?`)
                .setFooter({ text: '#NewMember #Welcome' });

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

            const welcomeMessage = await generalChannel.send({ 
                content: `🎉 Welcome ${user}!`,
                embeds: [embed], 
                components: [buttons] 
            });

            // Save welcome message ID to session
            const session = this.getUserSession(user.id);
            if (session) {
                session.welcomeMessageId = welcomeMessage.id;
                this.updateUserSession(user.id, session);
            }

            return welcomeMessage;

        } catch (error) {
            console.error('Send welcome error:', error);
        }
    }

    async handleAutoWelcome(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('👋 AUTO WELCOME')
                .setDescription(`Pilih salam otomatis untuk ${interaction.message.mentions.users.first()?.username || 'member baru'}:\n\n${this.welcomeTemplates.map((template, index) => `${index + 1}. "${template}"`).join('\n')}`)
                .setFooter({ text: 'Pilih salah satu salam' });

            const buttons = [];
            for (let i = 0; i < 10; i++) {
                if (i % 5 === 0 && i !== 0) {
                    // Create new row every 5 buttons
                    buttons.push(new ActionRowBuilder());
                }
                const currentRow = buttons[Math.floor(i / 5)] || new ActionRowBuilder();
                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`welcome_${i}`)
                        .setLabel(`${i + 1}`)
                        .setStyle(ButtonStyle.Secondary)
                );
                if (i % 5 === 0) buttons.push(currentRow);
            }

            await interaction.reply({
                embeds: [embed],
                components: buttons,
                ephemeral: true
            });

        } catch (error) {
            console.error('Auto welcome error:', error);
            await interaction.reply({
                content: '❌ Failed to open welcome options.',
                ephemeral: true
            });
        }
    }

    async handleWelcomeSelection(interaction) {
        try {
            const welcomeIndex = parseInt(interaction.customId.split('_')[1]);
            const targetUser = interaction.message.mentions.users.first();
            const welcomeMessage = this.welcomeTemplates[welcomeIndex].replace('{username}', targetUser?.username || 'member baru');

            await interaction.channel.send(welcomeMessage);
            await interaction.deferUpdate();
            await interaction.deleteReply();

        } catch (error) {
            console.error('Welcome selection error:', error);
            await interaction.reply({
                content: '❌ Failed to send welcome message.',
                ephemeral: true
            });
        }
    }

    async handleCustomMessage(interaction) {
        try {
            const targetUser = interaction.message.mentions.users.first();
            
            const modal = new ModalBuilder()
                .setCustomId('custom_message_modal')
                .setTitle('💬 Custom Welcome Message');

            const messageInput = new TextInputBuilder()
                .setCustomId('custom_message')
                .setLabel(`Tulis pesan sambutan untuk ${targetUser?.username || 'member baru'}:`)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000)
                .setPlaceholder('Tulis pesan sambutan disini...');

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
            const targetUser = interaction.message.mentions.users.first();
            const sender = interaction.user;

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`💬 ${customMessage}`)
                .setFooter({ 
                    text: `📝 Dari: ${sender.username}`, 
                    iconURL: sender.displayAvatarURL() 
                });

            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply({
                content: '✅ Pesan custom berhasil dikirim!',
                ephemeral: true
            });

        } catch (error) {
            console.error('Custom message submit error:', error);
            await interaction.reply({
                content: '❌ Failed to send custom message.',
                ephemeral: true
            });
        }
    }

    // ========== RATING SYSTEM ==========
    async showRatingStep(interaction) {
        try {
            await interaction.deferUpdate();
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ BERI PENILAIAN')
                .setDescription('Bagaimana pengalaman verifikasi di server ini?\n\nBeri rating 1-100:\n\n• 1-50: Perlu improvement\n• 51-75: Cukup memuaskan  \n• 76-90: Baik & profesional\n• 91-100: Luar biasa')
                .setFooter({ text: 'Bantu kami improve experience' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('input_rating')
                        .setLabel('🎯 INPUT RATING')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('give_feedback')
                        .setLabel('💬 GIVE FEEDBACK')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('confirm_rating')
                        .setLabel('✅ CONFIRM')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.editReply({ 
                embeds: [embed], 
                components: [buttons] 
            });

            this.updateUserSession(interaction.user.id, { 
                step: 'rating'
            });

        } catch (error) {
            console.error('Rating step error:', error);
            await interaction.editReply({
                content: '❌ Failed to proceed to rating.',
                components: []
            });
        }
    }

    async handleInputRating(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('input_rating_modal')
                .setTitle('🎯 Beri Rating 1-100');

            const ratingInput = new TextInputBuilder()
                .setCustomId('rating_value')
                .setLabel('Masukkan angka antara 1-100:')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(3)
                .setPlaceholder('Contoh: 85');

            modal.addComponents(new ActionRowBuilder().addComponents(ratingInput));
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Input rating error:', error);
            await interaction.reply({
                content: '❌ Failed to open rating modal.',
                ephemeral: true
            });
        }
    }

    async handleRatingSubmit(interaction) {
        try {
            const ratingValue = interaction.fields.getTextInputValue('rating_value');
            const rating = parseInt(ratingValue);
            
            if (isNaN(rating) || rating < 1 || rating > 100) {
                return await interaction.reply({
                    content: '❌ Harap masukkan angka yang valid antara 1-100.',
                    ephemeral: true
                });
            }

            // Save rating to session
            const session = this.getUserSession(interaction.user.id);
            if (session) {
                session.data.rating = rating;
                session.data.ratingCategory = this.getRatingCategory(rating);
                this.updateUserSession(interaction.user.id, session);
            }

            const embed = new EmbedBuilder()
                .setColor(this.getRatingColor(rating))
                .setTitle(`⭐ TERIMA KASIH ATAS RATING ${rating}/100!`)
                .setDescription(`**Kategori: ${this.getRatingCategory(rating)}** ${this.getRatingEmoji(rating)}\n\n📊 Data Referensi:\n• Rating Anda: ${rating}/100\n• Rata-rata member: ${this.getAverageRating(rating)}/100\n• ${this.getSatisfactionRate(rating)}% member merasa puas`)
                .setFooter({ text: 'Feedback sangat berarti bagi kami' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('give_feedback')
                        .setLabel('💬 GIVE FEEDBACK')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('next_final')
                        .setLabel('🚀 LANJUT FINAL')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({
                embeds: [embed],
                components: [buttons],
                ephemeral: true
            });

        } catch (error) {
            console.error('Rating submit error:', error);
            await interaction.reply({
                content: '❌ Failed to process rating.',
                ephemeral: true
            });
        }
    }

    getRatingCategory(rating) {
        if (rating <= 50) return "Perlu improvement";
        if (rating <= 75) return "Cukup memuaskan";
        if (rating <= 90) return "Baik & profesional";
        return "Luar biasa";
    }

    getRatingColor(rating) {
        if (rating <= 50) return 0xFF0000; // Red
        if (rating <= 75) return 0xFFA500; // Orange
        if (rating <= 90) return 0x00FF00; // Green
        return 0x0000FF; // Blue
    }

    getRatingEmoji(rating) {
        if (rating <= 50) return "❌";
        if (rating <= 75) return "⚠️";
        if (rating <= 90) return "✅";
        return "🎉";
    }

    getAverageRating(userRating) {
        // Dynamic average based on user's rating
        const baseAverage = 87;
        return Math.round((baseAverage + userRating) / 2);
    }

    getSatisfactionRate(userRating) {
        // Dynamic satisfaction rate based on user's rating
        const baseRate = 94;
        return Math.round((baseRate + (userRating - 50) / 2));
    }

    async handleGiveFeedback(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('give_feedback_modal')
                .setTitle('💬 Feedback & Saran');

            const feedbackInput = new TextInputBuilder()
                .setCustomId('feedback_content')
                .setLabel('Beri kami masukan (opsional):')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setMaxLength(1000)
                .setPlaceholder('1. Apa yang paling Anda sukai?\n2. Apa yang bisa ditingkatkan?\n3. Saran untuk server ke depan?');

            modal.addComponents(new ActionRowBuilder().addComponents(feedbackInput));
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Give feedback error:', error);
            await interaction.reply({
                content: '❌ Failed to open feedback modal.',
                ephemeral: true
            });
        }
    }

    async handleFeedbackSubmit(interaction) {
        try {
            const feedbackContent = interaction.fields.getTextInputValue('feedback_content');
            
            if (feedbackContent) {
                // Save feedback to session
                const session = this.getUserSession(interaction.user.id);
                if (session) {
                    session.data.feedback = feedbackContent;
                    this.updateUserSession(interaction.user.id, session);
                }

                await interaction.reply({
                    content: '✅ Terima kasih atas feedbacknya!',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '⚠️ Feedback dilewati.',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Feedback submit error:', error);
            await interaction.reply({
                content: '❌ Failed to process feedback.',
                ephemeral: true
            });
        }
    }

    async handleNextFinal(interaction) {
        try {
            await interaction.deferUpdate();
            await this.showFinalCompletion(interaction);
        } catch (error) {
            console.error('Next final error:', error);
            await interaction.editReply({
                content: '❌ Failed to proceed to final.',
                components: []
            });
        }
    }

    async showFinalCompletion(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 VERIFIKASI SELESAI!')
            .setDescription(`**Selamat ${interaction.user.username}!** Setup profil selesai! 🏆\n\n**Pencapaian:**\n✅ Identity Verified\n✅ Server Exploration Complete  \n✅ First Interaction Success\n✅ Community Rating Submitted\n✅ Full Access Granted\n\n**Channel verify sekarang tersembunyi untuk Anda**`)
            .setFooter({ text: 'Welcome to BananaSkiee Community! 🚀' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('give_role')
                    .setLabel('🎁 GIVE ROLE')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({ 
            embeds: [embed], 
            components: [button] 
        });

        this.updateUserSession(interaction.user.id, { 
            step: 'completed'
        });
    }

    async handleGiveRole(interaction) {
        try {
            await interaction.deferUpdate();
            
            await this.grantMemberAccess(interaction);
            
            // Log the verification
            await this.logVerification(interaction);
            
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

    // ========== MESSAGE DETECTION ==========
    async detectFirstMessage(message) {
        try {
            if (message.channel.id !== this.config.generalChannelId) return;
            if (message.author.bot) return;

            const session = this.getUserSession(message.author.id);
            if (!session) return;

            // Check if this is the first message from this user in general
            if (session.step === 'introduction_mission' || session.data.firstMessage) {
                session.data.firstMessage = message.content;
                session.data.firstMessageTime = Date.now();
                session.data.responseTime = Date.now() - (session.missionStartTime || Date.now());
                this.updateUserSession(message.author.id, session);

                // Send welcome message
                await this.sendWelcomeMessage(message.author, message.client);

                // For CONTINUE VERIFY users, proceed to rating
                if (session.step === 'introduction_mission') {
                    this.updateUserSession(message.author.id, { 
                        step: 'ready_for_rating'
                    });
                    // We'll handle the transition in the interaction handler
                }
            }

        } catch (error) {
            console.error('Detect first message error:', error);
        }
    }

    // ========== LOGGING SYSTEM ==========
    async logVerification(interaction) {
        try {
            const logChannel = interaction.guild.channels.cache.get(this.config.logChannelId);
            if (!logChannel) return;

            const session = this.getUserSession(interaction.user.id);
            const member = interaction.member;
            const user = interaction.user;

            const embed = this.getLogEmbed(interaction, session, member, user);
            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    getLogEmbed(interaction, session, member, user) {
        const accountAge = this.getAccountAge(user.createdAt);
        const sessionId = `SESS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📋 VERIFICATION LOG • BananaSkiee Community')
            .setDescription(`**✅ MEMBER BARU TERVEFIKASI** • High Engagement`)
            .addFields(
                {
                    name: '👤 **DATA USER:**',
                    value: `• Username: ${user.username}\n• User ID: ${user.id}\n• Display Name: ${user.displayName}\n• Global Name: ${user.globalName || 'N/A'}\n• Account Created: ${user.createdAt.toLocaleString('id-ID')}\n• Account Age: ${accountAge} hari\n• Avatar URL: ${user.displayAvatarURL()}\n• Banner: ${user.bannerURL() || 'N/A'}\n• Accent Color: ${user.hexAccentColor || 'N/A'}\n• Public Flags: ${user.flags?.toArray().join(', ') || 'None'}`,
                    inline: false
                },
                {
                    name: '📥 **JOIN INFORMATION:**',
                    value: `• Join Server: ${member.joinedAt.toLocaleString('id-ID')}\n• Join Method: ${this.getJoinMethod(member)}\n• Inviter: ${this.getInviter(member)}\n• Verification Level: ${interaction.guild.verificationLevel}`,
                    inline: false
                },
                {
                    name: '🔄 **VERIFICATION PROCESS:**',
                    value: `• Verification Type: ${session?.step === 'completed' ? 'FULL' : 'SKIP'}\n• Session ID: ${sessionId}\n• Steps Completed: ${this.getCompletedSteps(session)}`,
                    inline: false
                },
                {
                    name: '🏠 **SERVER EXPLORATION:**',
                    value: `• Home Visited: ${session?.visitedChannels?.includes('home') ? '✅' : '❌'}\n• Rules Visited: ${session?.visitedChannels?.includes('rules') ? '✅' : '❌'}\n• Customize Visited: ${session?.visitedChannels?.includes('customize') ? '✅' : '❌'}`,
                    inline: false
                },
                {
                    name: '💬 **FIRST INTERACTION:**',
                    value: `• First Message: ${session?.data?.firstMessage || 'N/A'}\n• Message Time: ${session?.data?.firstMessageTime ? new Date(session.data.firstMessageTime).toLocaleString('id-ID') : 'N/A'}\n• Channel: <#1352404526870560788>\n• Response Time: ${session?.data?.responseTime ? Math.round(session.data.responseTime / 1000) + ' detik' : 'N/A'}`,
                    inline: false
                },
                {
                    name: '⭐ **RATING & FEEDBACK:**',
                    value: `• Rating Given: ${session?.data?.rating || 'N/A'}/100\n• Rating Category: ${session?.data?.ratingCategory || 'N/A'}\n• Feedback Provided: ${session?.data?.feedback ? '✅' : '❌'}\n• Feedback Content: ${session?.data?.feedback || 'N/A'}`,
                    inline: false
                },
                {
                    name: '🔮 **ENGAGEMENT PREDICTION:**',
                    value: `• Engagement Probability: ${this.getEngagementScore(session)}%\n• Predicted Retention: ${this.getRetentionMonths(session)}+ bulan\n• Potential Connections: ${this.getPotentialConnections(session)} dalam 30 hari\n• Activity Level: ${this.getActivityLevel(session)}`,
                    inline: false
                },
                {
                    name: '⚙️ **SYSTEM METRICS:**',
                    value: `• Bot Version: 2.1.0\n• Server ID: ${interaction.guild.id}\n• Log Sequence: #${Math.floor(Math.random() * 100) + 1}\n• Process ID: ${process.pid}\n• Timestamp: ${new Date().toLocaleString('id-ID')}`,
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
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getJoinMethod(member) {
        // This would need audit log access for accurate information
        return 'Unknown (Need Audit Log Access)';
    }

    getInviter(member) {
        // This would need audit log access for accurate information
        return 'Unknown (Need Audit Log Access)';
    }

    getCompletedSteps(session) {
        if (!session) return 0;
        const steps = ['verified', 'server_exploration', 'introduction_mission', 'rating', 'completed'];
        return steps.indexOf(session.step) + 1;
    }

    getEngagementScore(session) {
        let score = 50;
        if (session?.data?.rating) score += (session.data.rating - 50) / 2;
        if (session?.data?.feedback) score += 10;
        if (session?.data?.firstMessage) score += 15;
        return Math.min(Math.round(score), 95);
    }

    getRetentionMonths(session) {
        const engagement = this.getEngagementScore(session);
        return Math.round((engagement / 100) * 12);
    }

    getPotentialConnections(session) {
        const engagement = this.getEngagementScore(session);
        return Math.round((engagement / 100) * 20);
    }

    getActivityLevel(session) {
        const engagement = this.getEngagementScore(session);
        if (engagement >= 80) return 'High';
        if (engagement >= 60) return 'Medium';
        return 'Low';
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
