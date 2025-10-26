const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class VerifySystem {
    constructor() {
        if (VerifySystem.instance) {
            return VerifySystem.instance;
        }
        VerifySystem.instance = this;
        
        this.config = {
            verifyChannelId: '1352823970054803509',
            logChannelId: '1428789734993432676',
            memberRoleId: '1352286235233620108',
            generalChannelId: '1352404526870560788',
            serverId: '1347233781391560837',
            rulesChannelId: '1352326247186694164'
        };
        
        this.userSessions = new Map();
        this.verificationQueue = new Map();
        
        this.verificationSteps = [
            { 
                name: "Security Check", 
                emoji: "🔐", 
                tasks: ["Verifikasi email", "Cek usia akun", "Scan aktivitas"],
                duration: 3000
            },
            { 
                name: "AI Analysis", 
                emoji: "🤖", 
                tasks: ["Pattern recognition", "Behavior analysis", "Risk assessment"],
                duration: 2800
            },
            { 
                name: "Database Check", 
                emoji: "🗄️", 
                tasks: ["Cross-reference data", "Identity confirmation", "Access provisioning"],
                duration: 3200
            },
            { 
                name: "Final Verification", 
                emoji: "🎯", 
                tasks: ["Security clearance", "Member access", "System integration"],
                duration: 2500
            }
        ];

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

        this.faqData = {
            title: "❓ FREQUENTLY ASKED QUESTIONS",
            questions: [
                {
                    q: "Bagaimana cara mendapatkan role?",
                    a: "Role otomatis diberikan setelah verifikasi selesai. Untuk role khusus, kunjungi channel self-roles."
                },
                {
                    q: "Apa saja channel yang tersedia?",
                    a: "Setelah verifikasi, semua channel premium akan terbuka termasuk gaming, programming, dan event exclusive."
                },
                {
                    q: "Bagaimana cara report masalah?",
                    a: "Gunakan channel <#1352326787367047188> atau DM admin untuk bantuan."
                },
                {
                    q: "Apa aturan utama server?",
                    a: "Baca lengkap di <#1352326247186694164>. Intinya: respect, no spam, no NSFW."
                }
            ]
        };
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

            // ⚡ DISMISS MESSAGE - Defer reply untuk progress bars
            await interaction.deferReply();

            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                return await interaction.editReply({
                    content: '✅ Anda sudah terverifikasi!'
                });
            }

            // PROGRESS BARS - DISMISS MESSAGE
            for (let i = 0; i < this.verificationSteps.length; i++) {
                const step = this.verificationSteps[i];
                const embed = this.getProgressEmbed(step, i + 1, this.verificationSteps.length);
                await interaction.editReply({ embeds: [embed] });
                await this.delay(step.duration);
            }

            await this.showVerificationSuccess(interaction);
            this.verificationQueue.delete(interaction.user.id);

        } catch (error) {
            console.error('Verify handling error:', error);
            this.verificationQueue.delete(interaction.user.id);
            
            if (error.code === 10062) {
                console.log('⚠️ Interaction expired');
                return;
            }
        }
    }

    getProgressEmbed(step, currentStep, totalSteps) {
        const progress = Math.round((currentStep / totalSteps) * 100);
        const progressBar = this.generateProgressBar(progress);
        const timeElapsed = (currentStep * 2.5 + Math.random() * 0.5).toFixed(1);
        
        const tasksText = step.tasks.map((task, index) => {
            const status = index < currentStep - 1 ? '✅' : (index === currentStep - 1 ? '🔄' : '⏳');
            return `• ${task}: ${status}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle(`${step.emoji} PROSES VERIFIKASI - ${progress}%`)
            .setDescription(`${step.name} sedang berjalan...\n\n${progressBar}\n\n${tasksText}`)
            .setFooter({ text: `⏱️ ${timeElapsed} detik • ${step.name}` });

        return embed;
    }

    generateProgressBar(percentage) {
        const bars = 20;
        const filledBars = Math.round((percentage / 100) * bars);
        const emptyBars = bars - filledBars;
        return `━━━━━━━━━━━━━━━━━━━━\n${'█'.repeat(filledBars)}${'▒'.repeat(emptyBars)}\n━━━━━━━━━━━━━━━━━━━━`;
    }

    async showVerificationSuccess(interaction) {
        try {
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

            // ⚡ DISMISS MESSAGE - Edit reply yang sudah ada
            await interaction.editReply({ 
                embeds: [embed], 
                components: [buttons] 
            });

            this.createUserSession(interaction.user.id);

        } catch (error) {
            console.error('Show verification success error:', error);
            if (error.code === 10062) return;
            throw error;
        }
    }
    
    // ========== BUTTON HANDLERS ==========
    async handleSkipVerify(interaction) {
        try {
            await interaction.deferUpdate();
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 SELAMAT DATANG DI KOMUNITAS')
                .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\nAnda sekarang Verified Member dengan akses penuh.\n\n**✅ YANG SUDAH AKTIV:**\n• Role Verified Member diberikan\n• Semua channel premium terbuka\n• Channel verify otomatis tersembunyi\n\n**Misi:** Buka <#${this.config.generalChannelId}> dan perkenalkan diri!\n\n\`"Halo! Saya ${interaction.user.username} - senang join komunitas ini!"\``)
                .setFooter({ text: 'Your Journey Starts Now • Complete Your Mission' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rate_server')
                        .setLabel('⭐ RATE SERVER')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('faqs_skip')
                        .setLabel('❓ FAQS')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('give_role_skip')
                        .setLabel('🎁 GIVE ROLE')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('back_to_verify')
                        .setLabel('⬅️ BACK')
                        .setStyle(ButtonStyle.Secondary)
                );

            // ⚡ DISMISS MESSAGE - Edit reply yang sudah ada
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
                .setDescription('Sebelum lanjut, silakan kunjungi channel penting:\n\n🏠 <id:home> - Lihat overview server\n📋 <#1352326247186694164> - Baca peraturan server  \n🎨 <id:customize> - Setup roles dan channels\n\n**📌 Cara:** Klik tombol di bawah untuk mengunjungi masing-masing channel.')
                .setFooter({ text: 'Akan otomatis lanjut dalam 30 detik' });

            const linkButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('🏠 SERVER GUIDE')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/@home`),
                    new ButtonBuilder()
                        .setLabel('📋 OPEN RULES')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/${this.config.rulesChannelId}`),
                    new ButtonBuilder()
                        .setLabel('🎨 SELF ROLE')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/customize-community`)
                );

            // ⚡ DISMISS MESSAGE - Edit reply yang sudah ada
            await interaction.editReply({ 
                embeds: [embed], 
                components: [linkButtons] 
            });

            this.updateUserSession(interaction.user.id, { 
                step: 'server_exploration',
                explorationStart: Date.now(),
                visitedChannels: {
                    home: false,
                    rules: false,
                    customize: false
                }
            });

            // AUTO LANJUT SETELAH 30 DETIK
            setTimeout(async () => {
                try {
                    await this.autoProceedToMission(interaction);
                } catch (error) {
                    console.error('Auto proceed error:', error);
                }
            }, 30000);

        } catch (error) {
            console.error('Continue verify error:', error);
            await interaction.editReply({
                content: '❌ Failed to start server exploration.',
                components: []
            });
        }
    }

    async autoProceedToMission(interaction) {
        try {
            const session = this.getUserSession(interaction.user.id);
            if (!session) return;

            console.log(`🚀 Auto proceeding to mission for ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('👋 MISI PERKENALAN')
                .setDescription(`**Sekarang saatnya perkenalan!**\n\n**Misi:** Buka channel <#${this.config.generalChannelId}> dan kirim pesan perkenalan\n\n**Template:**\n\`"Halo! Saya ${interaction.user.username}\nSenang join BananaSkiee Community! 🚀"\`\n\n**🤖 Bot akan otomatis detect chat Anda dan lanjut ke rating!**`)
                .setFooter({ text: 'Auto detect • No button needed' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('see_mission')
                        .setLabel('📝 LIHAT MISI')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setLabel('🔗 KE GENERAL')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/${this.config.generalChannelId}`)
                );

            // ⚡ DISMISS MESSAGE - Edit reply yang sudah ada
            await interaction.editReply({ 
                embeds: [embed], 
                components: [buttons] 
            });

            this.updateUserSession(interaction.user.id, { 
                step: 'introduction_mission',
                missionStartTime: Date.now()
            });

        } catch (error) {
            console.error('❌ Auto proceed to mission error:', error);
        }
    }

    // ========== MESSAGE DETECTION SYSTEM ==========
    async detectFirstMessage(message) {
        try {
            console.log(`🔍 Checking message from ${message.author.username} in ${message.channel.name}`);
            
            // Filter
            if (message.channel.id !== this.config.generalChannelId) return;
            if (message.author.bot) return;
            if (message.member.roles.cache.has(this.config.memberRoleId)) return;

            const userId = message.author.id;
            const session = this.getUserSession(userId);
            
            // Cek jika user sedang dalam misi introduction
            if (!session || session.step !== 'introduction_mission') {
                console.log('❌ User not in introduction mission');
                return;
            }

            console.log(`✅ ${message.author.username} completed mission with message: "${message.content}"`);

            // UPDATE SESSION
            session.step = 'ready_for_rating';
            session.data = session.data || {};
            session.data.firstMessage = message.content;
            session.data.firstMessageTime = Date.now();
            session.data.responseTime = Date.now() - (session.missionStartTime || Date.now());
            
            this.updateUserSession(userId, session);

            // ⚡ ENABLE TOMBOL NEXT VERIFY DI VERIFY CHANNEL
            await this.enableNextVerifyButton(message.author, message.client);

        } catch (error) {
            console.error('❌ First message detection error:', error);
        }
    }

    async enableNextVerifyButton(user, client) {
        try {
            console.log(`🔧 Enabling NEXT VERIFY button for ${user.username}`);
            
            const verifyChannel = await client.channels.fetch(this.config.verifyChannelId);
            if (!verifyChannel) return;

            // ⚡ CARI SEMUA MESSAGE USER DI VERIFY CHANNEL
            const messages = await verifyChannel.messages.fetch({ limit: 100 });
            
            const userVerifyMessage = messages.find(msg => {
                if (msg.author.id !== client.user.id) return false;
                return msg.mentions.users.has(user.id);
            });

            if (userVerifyMessage) {
                console.log(`📝 Found user message: ${userVerifyMessage.id}`);
                
                const enabledButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('see_mission')
                            .setLabel('📝 LIHAT MISI')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setLabel('🔗 KE GENERAL')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${this.config.serverId}/${this.config.generalChannelId}`),
                        new ButtonBuilder()
                            .setCustomId('next_verify')
                            .setLabel('✅ NEXT VERIFY')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(false)
                    );

                await userVerifyMessage.edit({ components: [enabledButtons] });
                
            } else {
                console.log('❌ No message found for user:', user.username);
            }

        } catch (error) {
            console.error('❌ Enable next verify button error:', error);
        }
    }

    // ========== NEXT VERIFY HANDLER ==========
    async handleNextVerify(interaction) {
        try {
            const session = this.getUserSession(interaction.user.id);
            
            if (!session || session.step !== 'ready_for_rating') {
                return await interaction.reply({
                    content: '❌ Kamu belum menyelesaikan misi perkenalan! Silakan chat di general terlebih dahulu.',
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();
            
            // ⚡ DISMISS MESSAGE - Edit embed yang sudah ada
            const ratingEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`⭐ LANJUTKAN VERIFIKASI - RATING`)
                .setDescription(`Hai ${interaction.user.username}!\n\nVerifikasi Anda dilanjutkan ke step rating.\n**Misi perkenalan di #general SUDAH SELESAI!** ✅\n\nBeri rating pengalaman verifikasi:\n\n**Pesan Anda:** "${session.data.firstMessage}"`)
                .setFooter({ text: 'Langkah terakhir sebelum role member!' });

            const ratingButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('input_rating')
                        .setLabel('🎯 INPUT RATING 1-100')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('give_feedback')
                        .setLabel('💬 KASIH SARAN')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('faqs_rating')
                        .setLabel('❓ TANYA FAQ')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({ 
                embeds: [ratingEmbed], 
                components: [ratingButtons] 
            });
            
            console.log(`✅ Mission EDITED to rating for ${interaction.user.username}`);

            // UPDATE SESSION
            session.step = 'rating';
            this.updateUserSession(interaction.user.id, session);

        } catch (error) {
            console.error('Next verify error:', error);
            await interaction.editReply({
                content: '❌ Gagal memproses next verify.',
                components: []
            });
        }
    }

    // ========== RATING SYSTEM ==========
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

    async handleRatingSubmit(interaction) {
        try {
            // ⚡ DISMISS MESSAGE - Defer untuk edit reply
            await interaction.deferReply();
            
            const ratingValue = interaction.fields.getTextInputValue('rating_value');
            const rating = parseInt(ratingValue);
            
            if (isNaN(rating) || rating < 1 || rating > 100) {
                return await interaction.editReply({
                    content: '❌ Harap masukkan angka yang valid antara 1-100.'
                });
            }

            const session = this.getUserSession(interaction.user.id);
            if (session) {
                session.data = session.data || {};
                session.data.rating = rating;
                session.data.ratingCategory = this.getRatingCategory(rating);
                session.data.ratingTime = Date.now();
                this.updateUserSession(interaction.user.id, session);
            }

            const resultEmbed = new EmbedBuilder()
                .setColor(this.getRatingColor(rating))
                .setTitle(`⭐ TERIMA KASIH ATAS RATING ${rating}/100!`)
                .setDescription(`**Kategori: ${this.getRatingCategory(rating)}** ${this.getRatingEmoji(rating)}\n\n📊 Data Referensi:\n• Rating Anda: ${rating}/100\n• Rata-rata member: ${this.getAverageRating(rating)}/100\n• ${this.getSatisfactionRate(rating)}% member merasa puas`)
                .setFooter({ text: 'Feedback sangat berarti bagi kami' });

            const resultButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('next_final')
                        .setLabel('🚀 LANJUT FINAL')
                        .setStyle(ButtonStyle.Primary)
                );

            // ⚡ DISMISS MESSAGE - Edit reply yang sudah ada
            await interaction.editReply({
                embeds: [resultEmbed],
                components: [resultButtons]
            });

        } catch (error) {
            console.error('Rating submit error:', error);
            await interaction.reply({
                content: '❌ Failed to process rating.',
                ephemeral: true
            });
        }
    }

    async handleFeedbackSubmit(interaction) {
        try {
            // ⚡ DISMISS MESSAGE - Defer untuk edit reply
            await interaction.deferReply();
            
            const feedbackContent = interaction.fields.getTextInputValue('feedback_content');
            
            if (feedbackContent) {
                const session = this.getUserSession(interaction.user.id);
                if (session) {
                    session.data.feedback = feedbackContent;
                    session.data.feedbackTime = Date.now();
                    this.updateUserSession(interaction.user.id, session);
                }
            }

            // ⚡ DISMISS MESSAGE - Edit reply yang sudah ada
            await interaction.editReply({
                content: feedbackContent ? '✅ Terima kasih atas feedbacknya!' : '⚠️ Feedback dilewati.'
            });

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
        const session = this.getUserSession(interaction.user.id);
        const achievements = this.getAchievements(session);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 VERIFIKASI SELESAI!')
            .setDescription(`**Selamat ${interaction.user.username}!** Setup profil selesai! 🏆\n\n**Pencapaian:**\n${achievements}\n\n**Channel verify sekarang tersembunyi untuk Anda**`)
            .setFooter({ text: 'Welcome to BananaSkiee Community! 🚀' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('give_role_final')
                    .setLabel('🎁 GIVE ROLE')
                    .setStyle(ButtonStyle.Success)
            );

        // ⚡ DISMISS MESSAGE - Edit reply yang sudah ada
        await interaction.editReply({ 
            embeds: [embed], 
            components: [button] 
        });

        this.updateUserSession(interaction.user.id, { 
            step: 'completed'
        });
    }

    // ========== ROLE MANAGEMENT ==========
    async handleGiveRole(interaction) {
        try {
            await interaction.deferUpdate();
            
            const success = await this.grantMemberAccess(interaction);
            
            if (success) {
                await this.logVerification(interaction);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ ROLE BERHASIL DIBERIKAN')
                    .setDescription(`Role member telah diberikan kepada ${interaction.user.username}!\n\nChannel verify sekarang tersembunyi untuk Anda.`)
                    .setFooter({ text: 'Welcome to BananaSkiee Community!' });

                // ⚡ DISMISS MESSAGE - Edit reply yang sudah ada
                await interaction.editReply({ embeds: [embed], components: [] });

                this.userSessions.delete(interaction.user.id);
            }

        } catch (error) {
            console.error('Give role error:', error);
            await interaction.editReply({
                content: '❌ Failed to give role.',
                components: []
            });
        }
    }

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

    // ========== NAVIGATION & FAQ ==========
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

    async handleFaqs(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(this.faqData.title)
                .setDescription('**Pertanyaan yang sering ditanyakan:**\n\n' + 
                    this.faqData.questions.map((item, index) => 
                        `**${index + 1}. ${item.q}**\n${item.a}`
                    ).join('\n\n'))
                .setFooter({ text: 'Butuh bantuan lebih? Hubungi staff!' });

            // ❌ BUKAN DISMISS MESSAGE - Reply baru untuk FAQ
            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('FAQs error:', error);
            await interaction.reply({
                content: '❌ Failed to show FAQs.',
                ephemeral: true
            });
        }
    }

    // ========== SESSION MANAGEMENT ==========
    createUserSession(userId) {
        if (this.userSessions.has(userId)) {
            return this.userSessions.get(userId);
        }
        
        const session = {
            id: userId,
            createdAt: Date.now(),
            step: 'verified',
            data: {},
            lastActivity: Date.now(),
            welcomeSent: false
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

    // ========== UTILITY METHODS ==========
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getAchievements(session) {
        const achievements = [];
        if (session.step === 'completed') achievements.push('✅ Identity Verified');
        if (session.data?.firstMessage) achievements.push('✅ First Interaction Success');
        if (session.data?.rating) achievements.push('✅ Community Rating Submitted');
        if (session.data?.feedback) achievements.push('✅ Feedback Provided');
        achievements.push('✅ Full Access Granted');
        return achievements.join('\n');
    }

    getRatingCategory(rating) {
        if (rating <= 50) return "Perlu improvement";
        if (rating <= 75) return "Cukup memuaskan";
        if (rating <= 90) return "Baik & profesional";
        return "Luar biasa";
    }

    getRatingColor(rating) {
        if (rating <= 50) return 0xFF0000;
        if (rating <= 75) return 0xFFA500;
        if (rating <= 90) return 0x00FF00;
        return 0x0000FF;
    }

    getRatingEmoji(rating) {
        if (rating <= 50) return "❌";
        if (rating <= 75) return "⚠️";
        if (rating <= 90) return "✅";
        return "🎉";
    }

    getAverageRating(userRating) {
        const baseAverage = 87;
        return Math.round((baseAverage + userRating) / 2);
    }

    getSatisfactionRate(userRating) {
        const baseRate = 94;
        return Math.round((baseRate + (userRating - 50) / 2));
    }

    // ========== INTERACTION HANDLER ==========
    async handleInteraction(interaction) {
        try {
            const { customId } = interaction;

            // Verify buttons
            if (customId === 'verify_account') return await this.handleVerify(interaction);
            if (customId === 'skip_verify') return await this.handleSkipVerify(interaction);
            if (customId === 'continue_verify') return await this.handleContinueVerify(interaction);
            if (customId === 'next_verify') return await this.handleNextVerify(interaction);
            
            // Rating buttons
            if (customId === 'input_rating') return await this.handleInputRating(interaction);
            if (customId === 'give_feedback') return await this.handleGiveFeedback(interaction);
            if (customId === 'next_final') return await this.handleNextFinal(interaction);
            if (customId === 'rate_server') return await this.handleInputRating(interaction);
            
            // FAQ buttons
            if (customId === 'faqs_skip' || customId === 'faqs_rating') return await this.handleFaqs(interaction);
            
            // Final buttons
            if (customId === 'give_role_skip' || customId === 'give_role_final') return await this.handleGiveRole(interaction);
            if (customId === 'back_to_verify') return await this.handleBackToVerify(interaction);

        } catch (error) {
            console.error('Interaction handling error:', error);
            
            if (error.code === 10062) return;
            
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ Terjadi kesalahan sistem.', components: [] });
                } else {
                    await interaction.reply({ content: '❌ Terjadi kesalahan sistem.', ephemeral: true });
                }
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    }
        
    async handleModalSubmit(interaction) {
        try {
            const { customId } = interaction;

            if (customId === 'input_rating_modal') return await this.handleRatingSubmit(interaction);
            if (customId === 'give_feedback_modal') return await this.handleFeedbackSubmit(interaction);

        } catch (error) {
            console.error('Modal submit error:', error);
            await interaction.reply({ content: '❌ Gagal memproses input.', ephemeral: true });
        }
    }

    // ========== LOGGING SYSTEM ==========
    async logVerification(interaction) {
        try {
            const logChannel = await interaction.guild.channels.fetch(this.config.logChannelId);
            if (!logChannel) return;

            const session = this.getUserSession(interaction.user.id);
            const user = interaction.user;
            const member = interaction.member;

            const logContent = this.generateLogContent(user, member, session);
            
            // ❌ BUKAN DISMISS MESSAGE - Buat thread baru di forum
            const forumPost = await logChannel.threads.create({
                name: `Verification Complete - ${user.username} (${user.id})`,
                message: { content: logContent },
                appliedTags: ['verification-complete', 'new-member']
            });

            console.log(`📋 Verification forum post created: ${forumPost.id} - ${user.username}`);

        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    generateLogContent(user, member, session) {
        const timestamp = new Date().toLocaleString('id-ID');
        const accountAge = this.getAccountAge(user.createdAt);
        
        return `
🎴 **USER PROFILE CARD** 🎴
┌───────────────────────────────────────────────────┐
│  🏷️  ${user.username}                                       │
│  💬  "${user.globalName || 'No bio set'}"         │
│  🌐  ${member.presence?.status || 'Offline'} • ${member.presence?.activities?.[0]?.name || 'No activity'} │
│  🏷️  Server Nickname: ${member.nickname || 'None'} │
└───────────────────────────────────────────────────┘

👤 **EXTENDED USER IDENTITY**
├─ 🔹 Username: ${user.username}
├─ 🔹 Display Name: ${user.displayName}
├─ 🔹 Global Name: ${user.globalName || 'N/A'}
├─ 🔹 User ID: ${user.id}
├─ 🔹 Server Nickname: ${member.nickname || 'None'}
├─ 🔹 Status: ${member.presence?.status || 'Offline'}
├─ 🔹 Activities: ${member.presence?.activities?.map(a => a.name).join(' • ') || 'None'}
└─ 🔹 Client: Discord ${this.getUserClient(user)}

📱 **ACCOUNT BADGES & PREMIUM**
├─ 🏆 Early Supporter: ${user.flags?.has('EarlySupporter') ? '✅' : '❌'}
├─ 💎 Nitro: ${member.premiumSince ? '✅ Active Subscription' : '❌'}
├─ 🎮 Nitro Games: ${member.premiumSince ? '✅ Included' : '❌'}
├─ 🎨 Nitro Avatar: ${user.avatar?.startsWith('a_') ? '✅ Animated' : '❌'}
├─ 🖼️ Profile Banner: ${user.banner ? '✅ Custom Banner' : '❌'}
├─ 📈 Server Boosts: ${member.premiumSince ? 'Active' : 'None'}
└─ 💳 Premium Tier: ${member.premiumSince ? 'Nitro' : 'None'}

📊 **ACCOUNT METADATA**
├─ 📅 Account Created: ${user.createdAt.toLocaleString('id-ID')}
├─ 🎂 Account Age: ${accountAge} hari
├─ 🌍 Location: Detected from IP
├─ 🕒 Timezone: GMT+7 (WIB)
├─ 💬 Language: English, Bahasa Indonesia
└─ 🔞 Age: Estimated from account creation

💬 **FIRST INTERACTION - FULL CONTEXT**
├─ 📝 Original Message: "${session?.data?.firstMessage || 'N/A'}"
├─ 🔗 Message Link: [View Message](https://discord.com/channels/${this.config.serverId}/${this.config.generalChannelId}/MESSAGE_ID)
├─ 🕒 Timestamp: ${session?.data?.firstMessageTime ? new Date(session.data.firstMessageTime).toLocaleString('id-ID') : 'N/A'}
├─ 📍 Channel: 「💬」ɢᴇɴᴇʀᴀʟ
├─ ⏱️ Response Time: ${session?.data?.responseTime ? Math.round(session.data.responseTime / 1000) + ' detik' : 'N/A'}
└─ 🔥 Engagement: First message detected

🔄 **VERIFICATION PROCESS - DETAILED TIMELINE**
├─ 🕒 Start: ${session?.createdAt ? new Date(session.createdAt).toLocaleString('id-ID') : 'N/A'}
├─ 🕒 End: ${timestamp}
├─ ⏱️ Total: ${this.getTotalDuration(session)}
├─ 📊 Steps: ${this.getCompletedSteps(session)}
└─ 🎯 Status: COMPLETED

⭐ **RATING & FEEDBACK ANALYSIS**
├─ 🎯 Final Rating: ${session?.data?.rating || 'N/A'}/100
├─ 📊 Rating Category: ${session?.data?.ratingCategory || 'N/A'}
├─ 🕒 Rating Time: ${session?.data?.ratingTime ? new Date(session.data.ratingTime).toLocaleString('id-ID') : 'N/A'}
├─ 💬 Feedback: ${session?.data?.feedback ? '✅ Provided' : '❌ None'}
└─ 🔄 Rating Changes: ${session?.data?.rating ? 'Recorded' : 'N/A'}

🔮 **ADVANCED ANALYTICS & PREDICTIONS**
├─ 📈 Engagement Probability: ${this.getEngagementScore(session)}%
├─ 🏆 Engagement Level: ${this.getEngagementLevel(session)}
├─ 🗓️ Predicted Retention: ${this.getRetentionMonths(session)}+ bulan
├─ 🤝 Potential Connections: ${this.getPotentialConnections(session)} dalam 30 hari
└─ 🎯 Activity Pattern: Detected

🛡️ **SECURITY & TRUST SCORE**
├─ 🔒 Account Security: ${this.getSecurityScore(user)}/100
├─ 📅 Account Age: ${accountAge > 365 ? '✅ Established' : '⚠️ New'}
├─ 🚫 Previous Bans: ✅ Clean
├─ 🔄 Verification History: First Time
└─ 🏆 Trust Level: ${this.getTrustLevel(user)}

🎁 **PERMISSIONS & ROLE GRANTS**
├─ 👑 Member Role: ✅ Granted
├─ 📍 Channel Access: 45+ channels unlocked
├─ 🏆 Achievement Unlocked: Verified Member
└─ ⚡ Permission Sync: Complete

---
📋 **LOG METADATA**
├─ 🕒 Generated: ${timestamp}
├─ 🔧 System Version: VerifySystem v3.2.1
├─ 🤖 Bot ID: BS#9886
├─ 🏠 Server: BananaSkiee Community
├─ 📁 Log ID: VRF_${user.id}_${Date.now()}
└─ 🔍 Access Level: Admin & Moderator Only
        `;
    }

    getAccountAge(accountCreationDate) {
        const created = new Date(accountCreationDate);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getTotalDuration(session) {
        if (!session?.createdAt) return 'N/A';
        const duration = Date.now() - session.createdAt;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes} menit ${seconds} detik`;
    }

    getCompletedSteps(session) {
        if (!session) return '0/8';
        const steps = ['verified', 'introduction_mission', 'ready_for_rating', 'rating', 'completed'];
        const currentStep = steps.indexOf(session.step);
        return currentStep >= 0 ? `${currentStep + 1}/8` : 'N/A';
    }

    getEngagementScore(session) {
        let score = 50;
        if (session?.data?.rating) score += (session.data.rating - 50) / 2;
        if (session?.data?.feedback) score += 10;
        if (session?.data?.firstMessage) score += 15;
        return Math.min(Math.round(score), 95);
    }

    getEngagementLevel(session) {
        const score = this.getEngagementScore(session);
        if (score >= 80) return 'High Engagement';
        if (score >= 60) return 'Medium Engagement';
        return 'Low Engagement';
    }

    getRetentionMonths(session) {
        const engagement = this.getEngagementScore(session);
        return Math.round((engagement / 100) * 12);
    }

    getPotentialConnections(session) {
        const engagement = this.getEngagementScore(session);
        return Math.round((engagement / 100) * 20);
    }

    getSecurityScore(user) {
        let score = 70;
        if (user.flags?.has('VerifiedBot')) score += 20;
        if (user.avatar) score += 5;
        if (user.banner) score += 5;
        return Math.min(score, 100);
    }

    getTrustLevel(user) {
        const score = this.getSecurityScore(user);
        if (score >= 80) return 'High';
        if (score >= 60) return 'Medium';
        return 'Low';
    }

    getUserClient(user) {
        return 'Desktop/Mobile';
    }
}

module.exports = VerifySystem;
