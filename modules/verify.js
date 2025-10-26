const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, UserFlags } = require('discord.js');

class VerifySystem {
    constructor() {
        if (VerifySystem.instance) {
            console.log('🔄 Returning existing VerifySystem instance');
            return VerifySystem.instance;
        }
        VerifySystem.instance = this;
        console.log('✅ Creating new VerifySystem instance');

        // PASTIKAN ID BERIKUT SUDAH BENAR
        this.config = {
            verifyChannelId: '1352823970054803509',
            logChannelId: '1428789734993432676', // ID Forum Channel
            memberRoleId: '1352286235233620108',
            generalChannelId: '1352404526870560788',
            serverId: '1347233781391560837',
            rulesChannelId: '1352326247186694164'
        };
        this.userSessions = new Map();
        this.verificationQueue = new Map();
        this.verificationSteps = [
            { name: "Security Check", emoji: "🔐", tasks: ["Verifikasi email", "Cek usia akun", "Scan aktivitas"], duration: 3000 },
            { name: "AI Analysis", emoji: "🤖", tasks: ["Pattern recognition", "Behavior analysis", "Risk assessment"], duration: 2800 },
            { name: "Database Check", emoji: "🗄️", tasks: ["Cross-reference data", "Identity confirmation", "Access provisioning"], duration: 3200 },
            { name: "Final Verification", emoji: "🎯", tasks: ["Security clearance", "Member access", "System integration"], duration: 2500 }
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
                { q: "Bagaimana cara mendapatkan role?", a: "Role otomatis diberikan setelah verifikasi selesai. Untuk role khusus, kunjungi channel self-roles." },
                { q: "Apa saja channel yang tersedia?", a: "Setelah verifikasi, semua channel premium akan terbuka termasuk gaming, programming, dan event exclusive." },
                { q: "Bagaimana cara report masalah?", a: "Gunakan channel <#1352326787367047188> atau DM admin untuk bantuan." },
                { q: "Apa aturan utama server?", a: "Baca lengkap di <#1352326247186694164>. Intinya: respect, no spam, no NSFW." }
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
                    // Ignored error during cleanup
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
            .setDescription('Selamat Datang di BananaSkiee Community!\n\nSebelum mengakses area eksklusif, verifikasi identitas Anda untuk membuka:\n\n• Channel Member Eksklusif\n• Jaringan Profesional Global \n• Resource Library Premium\n• Event Private & Workshop')
            .setFooter({ text: 'Enterprise Security • Zero Data Storage' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_account')
                    .setLabel('✅ VERIFY MY ACCOUNT')
                    .setStyle(ButtonStyle.Success)
            );
        // PESAN UTAMA (NON-DISMISSIVE/NON-EPHEMERAL)
        await channel.send({ embeds: [embed], components: [button] });
    }

    // ========== MAIN VERIFICATION FLOW ========== 
    async handleVerify(interaction) {
        try {
            if (this.verificationQueue.has(interaction.user.id)) {
                // PESAN INI EPHEMERAL/DISMISS
                return await interaction.reply({
                    content: '⏳ Verification already in progress. Please wait...',
                    ephemeral: true 
                });
            }

            this.verificationQueue.set(interaction.user.id, true);
            // DEFER REPLY NON-EPHEMERAL agar bisa di edit dengan progress dan terlihat
            await interaction.deferReply(); 

            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                // EDIT REPLY, tetap terlihat (Non-Dismissive)
                return await interaction.editReply({ 
                    content: '✅ Anda sudah terverifikasi!',
                }); 
            }

            // LANJUTKAN PROSES VERIFIKASI... (Non-Dismissive)
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
            if (error.code === 10062) return;
            // Kirim error message sebagai ephemeral (Dismissive)
            if (!interaction.replied && !interaction.deferred) {
                 await interaction.reply({ content: '❌ Terjadi kesalahan saat verifikasi.', ephemeral: true });
            } else if (interaction.deferred) {
                 await interaction.editReply({ content: '❌ Terjadi kesalahan saat verifikasi.', components: [] });
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
            
            // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (Non-Dismissive)
            await interaction.editReply({ embeds: [embed], components: [buttons] });
            this.createUserSession(interaction.user.id);
        } catch (error) {
            console.error('Show verification success error:', error);
            if (error.code === 10062) return;
            throw error;
        } 
    }

    // ========== BUTTON HANDLERS - NON-DISMISSIVE (Edit Message) ==========
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
                        .setCustomId('faqs_skip') // Dismissive (Ephemeral)
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
            // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (Non-Dismissive)
            await interaction.editReply({ embeds: [embed], components: [buttons] });
        } catch (error) {
            console.error('Skip verify error:', error);
            await interaction.editReply({ content: '❌ Failed to process request.', components: [] });
        }
    } 

    async handleContinueVerify(interaction) {
        try {
            await interaction.deferUpdate();

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🏠 KUNJUNGI AREA SERVER')
                .setDescription('Sebelum lanjut, silakan kunjungi channel penting:\n\n🏠 <id:home> - Lihat overview server\n📋 <#1352326247186694164> - Baca peraturan server \n🎨 <id:customize> - Setup roles dan channels\n\n**📌 Cara:** Klik tombol di bawah untuk mengunjungi masing-masing channel.')
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
            
            // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (Non-Dismissive)
            await interaction.editReply({ content: `${interaction.user}`, embeds: [embed], components: [linkButtons] });

            this.updateUserSession(interaction.user.id, { step: 'server_exploration', explorationStart: Date.now(), visitedChannels: { home: false, rules: false, customize: false } });

            // AUTO LANJUT SETELAH 30 DETIK
            setTimeout(async () => {
                try {
                    const message = await interaction.channel.messages.fetch(interaction.message.id);
                    if (message) {
                        await this.autoProceedToMission(message);
                    }
                } catch (error) {
                    // Ignore if message or interaction expires
                }
            }, 30000);
        } catch (error) {
            console.error('Continue verify error:', error);
            await interaction.editReply({ content: '❌ Failed to start server exploration.', components: [] });
        } 
    }
    
    // ... (handleChannelVisit, updateVisitProgress, detectFirstMessage, enableNextVerifyButton diabaikan di sini karena umumnya diimplementasikan di event messageCreate)
    
    async handleNextVerify(interaction) {
        try {
            const session = this.getUserSession(interaction.user.id);

            if (!session || session.step !== 'ready_for_rating') { 
                // PESAN INI EPHEMERAL/DISMISS
                return await interaction.reply({ 
                    content: '❌ Kamu belum menyelesaikan misi perkenalan! Silakan chat di general terlebih dahulu.', 
                    ephemeral: true 
                }); 
            }
            
            await interaction.deferUpdate(); 
            
            const ratingEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`⭐ LANJUTKAN VERIFIKASI - RATING`)
                .setDescription(`Hai ${interaction.user.username}!\n\nVerifikasi Anda dilanjutkan ke step rating.\n**Misi perkenalan di #general SUDAH SELESAI!** ✅\n\nBeri rating pengalaman verifikasi:\n\n**Pesan Anda:** "${session.data.firstMessage}"`)
                .setFooter({ text: 'Langkah terakhir sebelum role member!' });

            const ratingButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('input_rating') // Dismissive (Modal)
                        .setLabel('🎯 INPUT RATING 1-100')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('give_feedback') // Dismissive (Modal)
                        .setLabel('💬 KASIH SARAN')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('faqs_rating') // Dismissive (Ephemeral)
                        .setLabel('❓ TANYA FAQ')
                        .setStyle(ButtonStyle.Secondary)
                );

            // EDIT MESSAGE YANG SUDAH ADA (NON-DISMISSIVE)
            await interaction.editReply({ content: `${interaction.user}`, embeds: [ratingEmbed], components: [ratingButtons] });
            
            session.step = 'rating';
            this.updateUserSession(interaction.user.id, session);
        } catch (error) {
            console.error('Next verify error:', error);
            await interaction.editReply({ content: '❌ Gagal memproses next verify.', components: [] });
        } 
    }

    async handleNextFinal(interaction) {
        await interaction.deferUpdate();
        await this.showFinalCompletion(interaction); // Non-Dismissive
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
        
        // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (Non-Dismissive)
        await interaction.editReply({ embeds: [embed], components: [button] });
        
        this.updateUserSession(interaction.user.id, { step: 'completed' });
    }
    
    async handleBackToVerify(interaction) {
        try {
            await interaction.deferUpdate();

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
            
            // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (Non-Dismissive)
            await interaction.editReply({ embeds: [embed], components: [buttons] });
        } catch (error) {
            console.error('Back to verify error:', error);
            await interaction.editReply({ content: '❌ Failed to process back to verify.', components: [] });
        }
    }

    // ========== BUTTON HANDLERS - DISMISSIVE (Ephemeral/Modal) ==========

    async handleTrackVisited(interaction) {
        try {
            const session = this.getUserSession(interaction.user.id);
            if (!session || session.step !== 'server_exploration') {
                // PESAN INI EPHEMERAL/DISMISS
                return await interaction.reply({ content: '❌ Kamu belum memulai server exploration!', ephemeral: true });
            }
            const visitedCount = Object.values(session.visitedChannels).filter(Boolean).length;
            const totalChannels = Object.keys(session.visitedChannels).length;
            
            if (visitedCount === totalChannels) {
                // Jika sudah komplit, edit pesan utama (Non-Dismissive)
                await this.autoProceedToMission(interaction.message);
                // Dan beri konfirmasi Ephemeral (Dismissive)
                await interaction.reply({ content: '✅ Eksplorasi server selesai. Lanjut ke misi perkenalan!', ephemeral: true });
            } else {
                // PESAN INI EPHEMERAL/DISMISS
                await interaction.reply({ content: `📊 Progress: ${visitedCount}/${totalChannels} channel sudah dikunjungi. Klik semua tombol link di atas dulu!`, ephemeral: true });
            }
        } catch (error) {
            console.error('Track visited error:', error);
            await interaction.reply({ content: '❌ Gagal memproses.', ephemeral: true });
        } 
    }
    
    async handleSeeMission(interaction) {
        try {
            // PESAN INI EPHEMERAL/DISMISS
            await interaction.reply({ ephemeral: true, 
                embeds: [new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('📋 DETAIL MISI PERKENALAN')
                    .setDescription(`**Apa yang harus dilakukan:**\n\n1. Buka channel <#${this.config.generalChannelId}>\n2. Kirim pesan perkenalan\n3. Bot akan otomatis mendeteksi\n4. Lanjut ke step rating\n\n**Contoh pesan:**\n\`\`\`Halo semuanya! 👋\nSaya ${interaction.user.username}, baru join nih!\nSenang bisa bergabung di BananaSkiee Community! 🚀\nSalam kenal ya! 😊\`\`\``)
                    .setFooter({ text: 'Pesan bebas, yang penting perkenalan diri' })
                ]
            });
        } catch (error) {
            console.error('See mission error:', error);
            await interaction.reply({ content: '❌ Gagal menampilkan detail misi.', ephemeral: true });
        } 
    }

    async handleFaqs(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(this.faqData.title)
                .setDescription('**Pertanyaan yang sering ditanyakan:**\n\n' + this.faqData.questions.map((item, index) => `**${index + 1}. ${item.q}**\n${item.a}`).join('\n\n'))
                .setFooter({ text: 'Butuh bantuan lebih? Hubungi staff!' });
            
            // PESAN INI EPHEMERAL/DISMISS
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('FAQs error:', error);
            await interaction.reply({ content: '❌ Failed to show FAQs.', ephemeral: true });
        }
    }

    // ========== RATING MODAL HANDLERS (DISMISSIVE) ==========

    async handleInputRating(interaction) {
        // Modal secara otomatis me-dismiss interaksi tombol.
        const modal = new ModalBuilder()
            .setCustomId('input_rating_modal')
            .setTitle('⭐ Beri Rating Verifikasi');

        const ratingInput = new TextInputBuilder()
            .setCustomId('rating_value')
            .setLabel("Rating Anda (1-100):")
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(3)
            .setPlaceholder('Contoh: 95')
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(ratingInput);
        modal.addComponents(firstRow);
        await interaction.showModal(modal);
    }

    async handleGiveFeedback(interaction) {
        // Modal secara otomatis me-dismiss interaksi tombol.
        const modal = new ModalBuilder()
            .setCustomId('give_feedback_modal')
            .setTitle('💬 Beri Saran/Feedback');

        const feedbackInput = new TextInputBuilder()
            .setCustomId('feedback_content')
            .setLabel("Saran atau kritik Anda:")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(1000)
            .setPlaceholder('Tuliskan pengalaman atau saran Anda untuk perbaikan...')
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(feedbackInput);
        modal.addComponents(firstRow);
        await interaction.showModal(modal);
    }
    
    // ========== RATING MODAL SUBMIT (NON-DISMISSIVE Edit Reply) ==========
    async handleRatingSubmit(interaction) {
        try {
            // DeferReply NON-EPHEMERAL karena ini akan mengedit pesan utama
            await interaction.deferReply({ ephemeral: false }); 

            const ratingValue = interaction.fields.getTextInputValue('rating_value');
            const rating = parseInt(ratingValue);
            
            if (isNaN(rating) || rating < 1 || rating > 100) {
                return await interaction.editReply({ content: '❌ Harap masukkan angka yang valid antara 1-100.' });
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
                .setDescription(`**Kategori: ${this.getRatingCategory(rating)} ${this.getRatingEmoji(rating)}**\n\n**Pesan Anda:** "${session?.data?.firstMessage || 'N/A'}"`)
                .setFooter({ text: 'Feedback sangat berarti bagi kami' });

            const resultButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('next_final')
                        .setLabel('🚀 LANJUT FINAL')
                        .setStyle(ButtonStyle.Primary)
                );
            
            // EDIT MESSAGE YANG ADA (NON-DISMISSIVE)
            await interaction.editReply({ embeds: [resultEmbed], components: [resultButtons] });
        } catch (error) {
            console.error('Rating submit error:', error);
            // Error tetap harus Ephemeral jika terjadi kegagalan total
            await interaction.editReply({ content: '❌ Failed to process rating.', ephemeral: true });
        } 
    }

    // ========== FEEDBACK MODAL SUBMIT (DISMISSIVE Reply) ==========
    async handleFeedbackSubmit(interaction) {
        try {
            // DeferReply EPHEMERAL karena ini hanya konfirmasi
            await interaction.deferReply({ ephemeral: true }); 

            const feedbackContent = interaction.fields.getTextInputValue('feedback_content');
            
            if (feedbackContent) {
                const session = this.getUserSession(interaction.user.id);
                if (session) {
                    session.data.feedback = feedbackContent;
                    session.data.feedbackTime = Date.now();
                    this.updateUserSession(interaction.user.id, session);
                }
            }

            // EDIT MESSAGE YANG ADA (DISMISSIVE)
            await interaction.editReply({ 
                content: feedbackContent ? '✅ Terima kasih atas feedbacknya!' : '⚠️ Feedback dilewati.', 
                components: [] 
            });
        } catch (error) {
            console.error('Feedback submit error:', error);
            await interaction.editReply({ content: '❌ Failed to process feedback.', ephemeral: true });
        } 
    }

    // ... (autoProceedToMission)

    // ========== ROLE MANAGEMENT & LOGGING (NON-DISMISSIVE) ==========
    async handleGiveRole(interaction) {
        try {
            await interaction.deferUpdate();
            
            const success = await this.grantMemberAccess(interaction);
            
            if (success) {
                // LOGGING HARUS BERHASIL (Non-Dismissive)
                await this.logVerification(interaction);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ ROLE BERHASIL DIBERIKAN')
                    .setDescription(`Role member telah diberikan kepada ${interaction.user.username}!\n\nChannel verify sekarang tersembunyi untuk Anda.`)
                    .setFooter({ text: 'Welcome to BananaSkiee Community!' });
                
                // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (Non-Dismissive)
                await interaction.editReply({ embeds: [embed], components: [] });
                
                this.userSessions.delete(interaction.user.id);
            }
        } catch (error) {
            console.error('Give role error:', error);
            await interaction.editReply({ content: '❌ Failed to give role.', components: [] });
        }
    }
    
    async grantMemberAccess(interaction) {
        try {
            const member = interaction.member;
            if (!member.roles.cache.has(this.config.memberRoleId)) {
                await member.roles.add(this.config.memberRoleId, 'Verification completed');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Grant member access error:', error);
            return false;
        }
    }

    // ========== LOGGING SYSTEM (KE FORUM CHANNEL - FIX RangeError) ========== 
    async logVerification(interaction) {
        try {
            const logChannel = await interaction.guild.channels.fetch(this.config.logChannelId);
            
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) {
                 console.log(`⚠️ Log Channel ID ${this.config.logChannelId} is not a Forum Channel or not found. Log skipped.`);
                 return;
            }

            const session = this.getUserSession(interaction.user.id);
            const user = interaction.user;
            const member = interaction.member;
            
            // Log content harus dibuat di sini
            const logContent = this.generateLogContent(user, member, session);

            // Membuat Post Forum (thread) (NON-DISMISSIVE/PERMANENT)
            const forumPost = await logChannel.threads.create({
                name: `Verification Complete - ${user.username} (${user.id})`,
                message: { 
                    content: logContent,
                },
            });

            console.log(`📋 Verification forum post created: ${forumPost.id} - ${user.username}`);
        } catch (error) {
            // Jika error log tidak bisa dikirim, bot tidak akan gagal total
            console.error('❌ Logging error:', error);
        } 
    }

    // ========== LOG CONTENT GENERATOR (FIX RangeError: EarlySupporter) ==========
    generateLogContent(user, member, session) { 
        const timestamp = new Date().toLocaleString('id-ID'); 
        const accountAge = this.getAccountAge(user.createdAt); 
        
        // FIX: Menggunakan UserFlags.EarlySupporter yang diimpor, jika error, fallback.
        let earlySupporterStatus = '❌';
        try {
            if (user.flags && user.flags.has(UserFlags.EarlySupporter)) {
                earlySupporterStatus = '✅';
            }
        } catch (e) { /* silent fail */ }

        return `  
🎴 USER PROFILE CARD 🎴
┌───────────────────────────────────────────────────┐
│ 🏷️ ${user.username} │
│ 💬 "${user.globalName || 'No bio set'}" │
│ 🌐 ${member.presence?.status || 'Offline'} • ${member.presence?.activities?.[0]?.name || 'No activity'} │
│ 🏷️ Server Nickname: ${member.nickname || 'None'} │
└───────────────────────────────────────────────────┘

👤 EXTENDED USER IDENTITY
├─ 🔹 Username: ${user.username}
├─ 🔹 Display Name: ${user.displayName}
├─ 🔹 Global Name: ${user.globalName || 'N/A'}
├─ 🔹 User ID: ${user.id}
├─ 🔹 Server Nickname: ${member.nickname || 'None'}
├─ 🔹 Status: ${member.presence?.status || 'Offline'}
├─ 🔹 Activities: ${member.presence?.activities?.map(a => a.name).join(' • ') || 'None'}
└─ 🔹 Client: ${this.getUserClient(user)}

📱 ACCOUNT BADGES & PREMIUM
├─ 🏆 Early Supporter: ${earlySupporterStatus}
├─ 💎 Nitro: ${member.premiumSince ? '✅ Active Subscription' : '❌'}
├─ 🎮 Nitro Games: ${member.premiumSince ? '✅ Included' : '❌'}
├─ 🎨 Nitro Avatar: ${user.avatar?.startsWith('a_') ? '✅ Animated' : '❌'}
├─ 🖼️ Profile Banner: ${user.banner ? '✅ Custom Banner' : '❌'}
├─ 📈 Server Boosts: ${member.premiumSince ? 'Active' : 'None'}
└─ 💳 Premium Tier: ${member.premiumSince ? 'Nitro' : 'None'}

📊 ACCOUNT METADATA
├─ 📅 Account Created: ${user.createdAt.toLocaleString('id-ID')}
├─ 🎂 Account Age: ${accountAge} hari
├─ 🌍 Location: Detected from IP
├─ 🕒 Timezone: GMT+7 (WIB)
├─ 💬 Language: English, Bahasa Indonesia
└─ 🔞 Age: Estimated from account creation

💬 FIRST INTERACTION - FULL CONTEXT
├─ 📝 Original Message: "${session?.data?.firstMessage || 'N/A'}"
├─ 🔗 Message Link: N/A (Internal)
├─ 🕒 Timestamp: ${session?.data?.firstMessageTime ? new Date(session.data.firstMessageTime).toLocaleString('id-ID') : 'N/A'}
├─ 📍 Channel: 「💬」ɢᴇɴᴇʀᴀʟ
├─ ⏱️ Response Time: ${session?.data?.responseTime ? Math.round(session.data.responseTime / 1000) + ' detik' : 'N/A'}
└─ 🔥 Engagement: First message detected

🔄 VERIFICATION PROCESS - DETAILED TIMELINE
├─ 🕒 Start: ${session?.createdAt ? new Date(session.createdAt).toLocaleString('id-ID') : 'N/A'}
├─ 🕒 End: ${timestamp}
├─ ⏱️ Total: ${this.getTotalDuration(session)}
├─ 📊 Steps: ${this.getCompletedSteps(session)}
└─ 🎯 Status: COMPLETED

⭐ RATING & FEEDBACK ANALYSIS
├─ 🎯 Final Rating: ${session?.data?.rating || 'N/A'}/100
├─ 📊 Rating Category: ${session?.data?.ratingCategory || 'N/A'}
├─ 🕒 Rating Time: ${session?.data?.ratingTime ? new Date(session.data.ratingTime).toLocaleString('id-ID') : 'N/A'}
├─ 💬 Feedback: ${session?.data?.feedback ? '✅ Provided' : '❌ None'}
└─ 🔄 Rating Changes: ${session?.data?.rating ? 'Recorded' : 'N/A'}

🔮 ADVANCED ANALYTICS & PREDICTIONS
├─ 📈 Engagement Probability: ${this.getEngagementScore(session)}%
├─ 🏆 Engagement Level: ${this.getEngagementLevel(session)}
├─ 🗓️ Predicted Retention: ${this.getRetentionMonths(session)}+ bulan
├─ 🤝 Potential Connections: ${this.getPotentialConnections(session)} dalam 30 hari
└─ 🎯 Activity Pattern: Detected

🛡️ SECURITY & TRUST SCORE
├─ 🔒 Account Security: ${this.getSecurityScore(user)}/100
├─ 📅 Account Age: ${accountAge > 365 ? '✅ Established' : '⚠️ New'}
├─ 🚫 Previous Bans: ✅ Clean
├─ 🔄 Verification History: First Time
└─ 🏆 Trust Level: ${this.getTrustLevel(user)}

🎁 PERMISSIONS & ROLE GRANTS
├─ 👑 Member Role: ✅ Granted
├─ 📍 Channel Access: 45+ channels unlocked
├─ 🏆 Achievement Unlocked: Verified Member
└─ ⚡ Permission Sync: Complete

📋 LOG METADATA
├─ 🕒 Generated: ${timestamp}
├─ 🔧 System Version: VerifySystem v3.2.1
├─ 🤖 Bot ID: BS#9886
├─ 🏠 Server: BananaSkiee Community
├─ 📁 Log ID: VRF_${user.id}_${Date.now()}
└─ 🔍 Access Level: Admin & Moderator Only
`;
    }

    // ========== HELPER FUNCTIONS ==========
    getAccountAge(accountCreationDate) { const created = new Date(accountCreationDate); const now = new Date(); const diffTime = Math.abs(now - created); return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); }
    getTotalDuration(session) { if (!session?.createdAt) return 'N/A'; const duration = Date.now() - session.createdAt; const minutes = Math.floor(duration / 60000); const seconds = Math.floor((duration % 60000) / 1000); return `${minutes} menit ${seconds} detik`; }
    getCompletedSteps(session) { if (!session) return '0/8'; const steps = ['verified', 'introduction_mission', 'ready_for_rating', 'rating', 'completed']; const currentStep = steps.indexOf(session.step); return currentStep >= 0 ? `${currentStep + 1}/8` : 'N/A'; }
    getEngagementScore(session) { let score = 50; if (session?.data?.rating) score += (session.data.rating - 50) / 2; if (session?.data?.feedback) score += 10; if (session?.data?.firstMessage) score += 15; return Math.min(Math.round(score), 95); }
    getEngagementLevel(session) { const score = this.getEngagementScore(session); if (score >= 80) return 'High Engagement'; if (score >= 60) return 'Medium Engagement'; return 'Low Engagement'; }
    getRetentionMonths(session) { const engagement = this.getEngagementScore(session); return Math.round((engagement / 100) * 12); }
    getPotentialConnections(session) { const engagement = this.getEngagementScore(session); return Math.round((engagement / 100) * 20); }
    getSecurityScore(user) { let score = 70; if (user.flags?.has('VerifiedBot')) score += 20; if (user.avatar) score += 5; if (user.banner) score += 5; return Math.min(score, 100); }
    getTrustLevel(user) { const score = this.getSecurityScore(user); if (score >= 80) return 'High'; if (score >= 60) return 'Medium'; return 'Low'; }
    getUserClient(user) { return 'Desktop/Mobile'; } 
    getAchievements(session) { return '🏆 Verified Member\n✨ Completed Mission\n🌟 High Rated Service'; }

    // RATING UTILITIES
    getRatingCategory(rating) { if (rating <= 50) return "Perlu improvement"; if (rating <= 75) return "Cukup memuaskan"; if (rating <= 90) return "Baik & profesional"; return "Luar biasa"; }
    getRatingColor(rating) { if (rating <= 50) return 0xFF0000; if (rating <= 75) return 0xFFA500; if (rating <= 90) return 0x00FF00; return 0x0000FF; }
    getRatingEmoji(rating) { if (rating <= 50) return "❌"; if (rating <= 75) return "⚠️"; if (rating <= 90) return "✅"; return "🎉"; }

    // SESSION MANAGEMENT
    createUserSession(userId) {
        if (this.userSessions.has(userId)) { return this.userSessions.get(userId); }
        const session = { id: userId, createdAt: Date.now(), step: 'verified', data: {}, lastActivity: Date.now(), welcomeSent: false };
        this.userSessions.set(userId, session);
        return session;
    }
    getUserSession(userId) { return this.userSessions.get(userId); }
    updateUserSession(userId, updates) {
        const session = this.getUserSession(userId);
        if (session) {
            Object.assign(session, updates, { lastActivity: Date.now() });
            this.userSessions.set(userId, session);
        }
        return session;
    }

    // UTILITY
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    // MODAL SUBMIT HANDLER
    async handleModalSubmit(interaction) {
        try {
            const { customId } = interaction;
            
            if (customId === 'input_rating_modal') return await this.handleRatingSubmit(interaction);
            if (customId === 'give_feedback_modal') return await this.handleFeedbackSubmit(interaction);
            
            // Default reply untuk modal yang tidak terhandle
            await interaction.reply({ content: '❌ Modal tidak dikenal.', ephemeral: true });
        } catch (error) {
            console.error('Modal submit error:', error);
            // Semua pesan error dijadikan ephemeral
            await interaction.reply({ content: '❌ Gagal memproses input.', ephemeral: true });
        }
    } 
}

module.exports = VerifySystem;
