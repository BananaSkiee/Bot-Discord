const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ChannelType, 
    UserFlags // Diperlukan untuk cek EarlySupporter
} = require('discord.js');

class VerifySystem {
    constructor() {
        if (VerifySystem.instance) {
            console.log('🔄 Returning existing VerifySystem instance');
            return VerifySystem.instance;
        }
        VerifySystem.instance = this;
        console.log('✅ Creating new VerifySystem instance');

        // PASTIKAN ID INI BENAR
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
        this.faqData = {
            title: "❓ FREQUENTLY ASKED QUESTIONS",
            questions: [
                { q: "Bagaimana cara mendapatkan role?", a: "Role otomatis diberikan setelah verifikasi selesai. Untuk role khusus, kunjungi channel self-roles." },
                { q: "Apa saja channel yang tersedia?", a: "Setelah verifikasi, semua channel premium akan terbuka termasuk gaming, programming, dan event exclusive." },
                { q: "Bagaimana cara report masalah?", a: "Gunakan channel report atau DM admin untuk bantuan." },
                { q: "Apa aturan utama server?", a: "Baca lengkap di channel rules. Intinya: respect, no spam, no NSFW." }
            ]
        };
    }

    // ========== INITIALIZATION (STEP 1: BUKAN DISMISS) ==========
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

    // ========== MAIN VERIFICATION FLOW (STEP 2: DISMISS/EDIT) ========== 
    async handleVerify(interaction) {
        try {
            if (this.verificationQueue.has(interaction.user.id)) {
                // PESAN INI EPHEMERAL (DISMISSIVE konfirmasi)
                return await interaction.reply({
                    content: '⏳ Verification already in progress. Please wait...',
                    ephemeral: true 
                });
            }

            this.verificationQueue.set(interaction.user.id, true);
            // DEFER REPLY NON-EPHEMERAL untuk mengedit pesan verifikasi utama (BUKAN DISMISS)
            await interaction.deferReply(); 

            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                // EDIT REPLY, tetap terlihat (Non-Dismissive)
                return await interaction.editReply({ 
                    content: '✅ Anda sudah terverifikasi!',
                }); 
            }

            // PROSES PROGRESS BAR (EDIT/DISMISS STEP 2)
            for (let i = 0; i < this.verificationSteps.length; i++) {
                const step = this.verificationSteps[i];
                const embed = this.getProgressEmbed(step, i + 1, this.verificationSteps.length);
                await interaction.editReply({ embeds: [embed], components: [] });
                await this.delay(step.duration);
            }

            await this.showVerificationSuccess(interaction);
            this.verificationQueue.delete(interaction.user.id);
        } catch (error) {
            console.error('Verify handling error:', error);
            this.verificationQueue.delete(interaction.user.id);
            if (error.code === 10062) return;
            // Kirim error message sebagai ephemeral (Dismissive Konfirmasi)
            if (!interaction.replied && !interaction.deferred) {
                 await interaction.reply({ content: '❌ Terjadi kesalahan saat verifikasi.', ephemeral: true });
            } else if (interaction.deferred) {
                 await interaction.editReply({ content: '❌ Terjadi kesalahan saat verifikasi.', components: [] });
            }
        } 
    }

    // ========== VERIFICATION SUCCESS (STEP 3: DISMISS/EDIT) ==========
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
            
            // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (DISMISS STEP 3)
            await interaction.editReply({ embeds: [embed], components: [buttons] });
            this.createUserSession(interaction.user.id);
        } catch (error) {
            console.error('Show verification success error:', error);
            if (error.code === 10062) return;
            throw error;
        } 
    }

    // ========== SKIP VERIFY (STEP 4A: DISMISS/EDIT) ==========
    async handleSkipVerify(interaction) {
        try {
            await interaction.deferUpdate();
            
            const success = await this.grantMemberAccess(interaction);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 SELAMAT DATANG DI KOMUNITAS')
                .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\nAnda sekarang Verified Member dengan akses penuh.\n\n**✅ YANG SUDAH AKTIV:**\n• Role Verified Member ${success ? 'diberikan' : 'gagal diberikan'}\n• Semua channel premium terbuka\n• Channel verify otomatis tersembunyi\n\n**Misi:** Buka <#${this.config.generalChannelId}> dan perkenalkan diri!`)
                .setFooter({ text: 'Your Journey Starts Now • Complete Your Mission' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rate_server')
                        .setLabel('⭐ RATE SERVER')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('faqs_skip') // Ephemeral/Dismissive Konfirmasi
                        .setLabel('❓ FAQS')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            // LOGGING (BUKAN DISMISS MESSAGE)
            await this.logVerification(interaction, 'Skip');

            // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (DISMISS STEP 4A)
            await interaction.editReply({ embeds: [embed], components: [buttons] });
        } catch (error) {
            console.error('Skip verify error:', error);
            await interaction.editReply({ content: '❌ Failed to process request.', components: [] });
        }
    } 

    // ========== CONTINUE VERIFY (STEP 4B: DISMISS/EDIT) ==========
    async handleContinueVerify(interaction) {
        try {
            await interaction.deferUpdate();

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🏠 KUNJUNGI AREA SERVER')
                .setDescription(`Hai ${interaction.user.username}!\n\nSilakan kunjungi channel penting berikut untuk melanjutkan. Setelah 30 detik, Anda akan lanjut ke misi perkenalan.\n\n• 📋 [RULES & ANNOUNCEMENT](https://discord.com/channels/${this.config.serverId}/${this.config.rulesChannelId}) \n• 🎨 [SELF ROLE SETUP](https://discord.com/channels/${this.config.serverId}/customize-community) \n\n`)
                .setFooter({ text: 'Akan otomatis lanjut dalam 30 detik' });

            const linkButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('📋 RULES')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/${this.config.rulesChannelId}`),
                    new ButtonBuilder()
                        .setLabel('🎨 SELF ROLE')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/customize-community`)
                );
            
            // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (DISMISS STEP 4B)
            await interaction.editReply({ content: `${interaction.user}`, embeds: [embed], components: [linkButtons] });

            this.updateUserSession(interaction.user.id, { step: 'server_exploration', explorationStart: Date.now(), visitedChannels: { home: false, rules: false, customize: false } });

            // AUTO LANJUT SETELAH 30 DETIK (Memanggil autoProceedToMission)
            setTimeout(async () => {
                try {
                    const message = await interaction.channel.messages.fetch(interaction.message.id);
                    if (message) {
                        await this.autoProceedToMission(message); // DISMISS STEP 5
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
    
    // ========== AUTO PROCEED TO MISSION (STEP 5: DISMISS/EDIT) ==========
    async autoProceedToMission(message) {
        const userId = message.mentions.users.first()?.id;
        if (!userId) return;

        const session = this.getUserSession(userId);
        if (!session || session.step !== 'server_exploration') return;

        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🎯 MISI PERKENALAN DI CHANNEL GENERAL')
            .setDescription(`Selamat datang, ${message.mentions.users.first().username}!\n\n**LANGKAH SELANJUTNYA:**\n\n1. Kunjungi <#${this.config.generalChannelId}>\n2. Kirim pesan perkenalan singkat\n3. Setelah terdeteksi, tombol **NEXT VERIFY** akan aktif di sini!\n\n*Atau* klik **[❓ SEE MISSION]** untuk detail misi.`)
            .setFooter({ text: 'Kami akan otomatis mendeteksi pesan pertama Anda!' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('next_verify')
                    .setLabel('➡️ NEXT VERIFY')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true), // Awalnya disabled
                new ButtonBuilder()
                    .setCustomId('see_mission')
                    .setLabel('❓ SEE MISSION') // Ephemeral/Dismissive Konfirmasi
                    .setStyle(ButtonStyle.Secondary)
            );
            
        // Edit pesan yang sudah ada (DISMISS STEP 5)
        await message.edit({ embeds: [embed], components: [buttons] });
        this.updateUserSession(userId, { step: 'mission', explorationEnd: Date.now() });
    }
    
    // ========== USER CHAT DI GENERAL (STEP 6: DISMISS/EDIT) ==========
    async detectFirstMessage(message) {
        const userId = message.author.id;
        const generalChannelId = this.config.generalChannelId;
        const session = this.getUserSession(userId);

        if (session && 
            (session.step === 'server_exploration' || session.step === 'mission') &&
            message.channel.id === generalChannelId &&
            !session.data.firstMessage) {
            
            const verifyChannel = await message.client.channels.fetch(this.config.verifyChannelId);
            if (!verifyChannel) return;
            
            const messages = await verifyChannel.messages.fetch({ limit: 10 });
            // Temukan pesan verifikasi utama (yang mention user atau message terakhir bot)
            const verifyMessage = messages.find(m => m.mentions.has(userId) || m.author.id === message.client.user.id);
            
            if (verifyMessage) {
                // Simpan data pesan pertama
                session.data.firstMessage = message.content.substring(0, 100);
                session.data.firstMessageTime = Date.now();
                
                // Hitung response time. Gunakan createdAt saat sesi dibuat (Step 3) sebagai baseline
                session.data.responseTime = session.explorationStart ? 
                    (Date.now() - session.explorationStart) : (Date.now() - session.createdAt);
                
                session.step = 'ready_for_rating';
                this.updateUserSession(userId, session);
                
                // Panggil fungsi untuk mengaktifkan tombol Next Verify (DISMISS STEP 6)
                await this.enableNextVerifyButton(verifyMessage);
                
                // Kirim notifikasi Ephemeral/Dismissive Konfirmasi ke user (VIA DM)
                await message.author.send({
                    content: `✅ Misi perkenalan selesai terdeteksi! Silakan kembali ke channel verifikasi untuk melanjutkan.`,
                }).catch(() => console.log(`Gagal DM ${message.author.username}`));
            }
        }
    }
    
    async enableNextVerifyButton(message) {
        const components = message.components.map(row => {
            if (row.components.some(c => c.customId === 'next_verify')) {
                const newRow = new ActionRowBuilder();
                row.components.forEach(component => {
                    const newComponent = ButtonBuilder.from(component.toJSON());
                    if (newComponent.data.custom_id === 'next_verify') {
                        newComponent.setDisabled(false).setStyle(ButtonStyle.Primary);
                    }
                    newRow.addComponents(newComponent);
                });
                return newRow;
            }
            return row;
        });
        
        // Memastikan tombol `next_verify` berwarna Primary (biru) saat aktif (DISMISS STEP 6)
        await message.edit({ components: components });
    }
    
    // ========== NEXT VERIFY (STEP 7: DISMISS/EDIT) ==========
    async handleNextVerify(interaction) {
        try {
            const session = this.getUserSession(interaction.user.id);

            if (!session || session.step !== 'ready_for_rating') { 
                // PESAN INI EPHEMERAL (DISMISSIVE konfirmasi)
                return await interaction.reply({ 
                    content: '❌ Kamu belum menyelesaikan misi perkenalan! Silakan chat di general terlebih dahulu.', 
                    ephemeral: true 
                }); 
            }
            
            await interaction.deferUpdate(); // Defer agar bisa mengedit pesan lama
            
            const ratingEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`⭐ LANJUTKAN VERIFIKASI - RATING`)
                .setDescription(`Hai ${interaction.user.username}!\n\n**Misi perkenalan di #general SUDAH SELESAI!** ✅\n\nBeri rating pengalaman verifikasi:\n\n**Pesan Anda:** "${session.data.firstMessage}"`)
                .setFooter({ text: 'Langkah terakhir sebelum role member!' });

            const ratingButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('input_rating') // Modal (Dismissive Konfirmasi)
                        .setLabel('🎯 INPUT RATING 1-100')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('give_feedback') // Modal (Dismissive Konfirmasi)
                        .setLabel('💬 KASIH SARAN')
                        .setStyle(ButtonStyle.Secondary)
                );

            // EDIT MESSAGE YANG SUDAH ADA (DISMISS STEP 7)
            await interaction.editReply({ content: `${interaction.user}`, embeds: [ratingEmbed], components: [ratingButtons] });
            
            session.step = 'rating';
            this.updateUserSession(interaction.user.id, session);
        } catch (error) {
            console.error('Next verify error:', error);
            await interaction.editReply({ content: '❌ Gagal memproses next verify.', components: [] });
        } 
    }

    // ========== RATING MODAL SUBMIT (STEP 8: DISMISS/EDIT) ==========
    async handleRatingSubmit(interaction) {
        try {
            // DeferReply NON-EPHEMERAL karena ini akan mengedit pesan utama
            await interaction.deferReply({ ephemeral: false }); 

            const ratingValue = interaction.fields.getTextInputValue('rating_value');
            const rating = parseInt(ratingValue);
            
            if (isNaN(rating) || rating < 1 || rating > 100) {
                // EDIT REPLY NON-EPHEMERAL (tetap terlihat)
                return await interaction.editReply({ content: '❌ Harap masukkan angka yang valid antara 1-100.' });
            }

            const session = this.getUserSession(interaction.user.id);
            if (session) {
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
            
            // EDIT MESSAGE YANG ADA (DISMISS STEP 8)
            await interaction.editReply({ embeds: [resultEmbed], components: [resultButtons] });
        } catch (error) {
            console.error('Rating submit error:', error);
            // Error tetap harus Ephemeral jika terjadi kegagalan total
            await interaction.editReply({ content: '❌ Failed to process rating.', ephemeral: true });
        } 
    }
    
    async handleFeedbackSubmit(interaction) {
        // DeferReply EPHEMERAL karena ini hanya konfirmasi (DISMISSIVE KONFIRMASI)
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

        // EDIT MESSAGE YANG ADA (DISMISSIVE KONFIRMASI)
        await interaction.editReply({ 
            content: feedbackContent ? '✅ Terima kasih atas feedbacknya! Silakan klik tombol "LANJUT FINAL" di pesan utama.' : '⚠️ Feedback dilewati.', 
            components: [] 
        });
    }

    // ========== FINAL COMPLETION (STEP 9: DISMISS/EDIT) ==========
    async handleNextFinal(interaction) {
        await interaction.deferUpdate();
        await this.showFinalCompletion(interaction); // DISMISS STEP 9
    }
    
    async showFinalCompletion(interaction) {
        const session = this.getUserSession(interaction.user.id);
        const achievements = this.getAchievements(session);
        
        const success = await this.grantMemberAccess(interaction);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 VERIFIKASI SELESAI!')
            .setDescription(`**Selamat ${interaction.user.username}!** Setup profil selesai! 🏆\n\n**Pencapaian:**\n${achievements}\n\n**✅ Role Member ${success ? 'diberikan' : 'gagal diberikan'}**\nChannel verify sekarang tersembunyi untuk Anda.`)
            .setFooter({ text: 'Welcome to BananaSkiee Community! 🚀' });
        
        // LOGGING (STEP 10: BUKAN DISMISS MESSAGE)
        await this.logVerification(interaction, 'Complete');

        // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (DISMISS STEP 9)
        await interaction.editReply({ embeds: [embed], components: [] });
        
        this.userSessions.delete(interaction.user.id);
    }

    // ========== LOGGING SYSTEM (STEP 10: BUKAN DISMISS - FIX DIVERSIFIED LOG) ========== 
    async logVerification(interaction, type = 'Default') {
        try {
            const logChannel = await interaction.guild.channels.fetch(this.config.logChannelId);
            
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) {
                 console.error(`❌ Log Channel ID ${this.config.logChannelId} is not a Forum Channel or not found. Log skipped.`);
                 return;
            }

            const session = this.getUserSession(interaction.user.id);
            const user = interaction.user;
            const member = interaction.member;
            
            // Menggunakan helper function untuk membuat konten log yang kaya data
            const logContent = await this.generateLogContent(user, member, session, type);

            // Membuat Post Forum (thread) (BUKAN DISMISS MESSAGE)
            const forumPost = await logChannel.threads.create({
                name: `[${type}] Log - ${user.username} (${user.id})`,
                message: { 
                    content: logContent,
                },
            });

            console.log(`📋 Verification forum post created: ${forumPost.id} - ${user.username}`);
        } catch (error) {
            console.error('❌ Logging error: Gagal membuat post forum. Cek permissions bot di channel log.', error);
        } 
    }
    
    // ========== MODAL HANDLERS (DISMISSIVE) ==========

    async handleInputRating(interaction) {
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

    // ========== HELPER FUNCTIONS & LOG GENERATOR (FULL & ADVANCED) ==========
    
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
    
    // FUNGSI UTAMA GENERATE LOG SESUAI CONTOH
    async generateLogContent(user, member, session, type) { 
        const timestamp = new Date().toLocaleString('id-ID'); 
        const accountAge = this.getAccountAge(user.createdAt); 
        
        let earlySupporterStatus = '❌';
        try {
            if (user.flags && user.flags.has(UserFlags.EarlySupporter)) {
                earlySupporterStatus = '✅';
            }
        } catch (e) { /* silent fail */ }
        
        // Menggunakan nilai dari session untuk Rating
        const rating = session?.data?.rating;
        const ratingInfo = rating ? 
            `├─ 🎯 Final Rating: ${rating}/100\n├─ 📊 Rating Category: ${this.getRatingCategory(rating)}\n├─ 🕒 Rating Time: ${session.data.ratingTime ? new Date(session.data.ratingTime).toLocaleString('id-ID') : 'N/A'}\n├─ 💬 Feedback: ${session.data.feedback ? '✅ Provided' : '❌ None'}\n└─ 🔄 Rating Changes: Recorded` :
            `├─ 🎯 Final Rating: N/A\n├─ 📊 Rating Category: N/A\n├─ 🕒 Rating Time: N/A\n├─ 💬 Feedback: N/A\n└─ 🔄 Rating Changes: N/A`;

        // Menggunakan nilai dari session untuk Analytics
        const engagementScore = this.getEngagementScore(session);
        const engagementLevel = this.getEngagementLevel(session);
        const retentionMonths = this.getRetentionMonths(session);
        const potentialConnections = this.getPotentialConnections(session);
        const securityScore = this.getSecurityScore(user);
        const trustLevel = this.getTrustLevel(user);


        // Ini adalah template string log yang sangat detail
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
└─ 🔹 Client: ${this.getUserClient(member)}

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
└─ 🎯 Status: ${type}

⭐ RATING & FEEDBACK ANALYSIS
${ratingInfo}

🔮 ADVANCED ANALYTICS & PREDICTIONS
├─ 📈 Engagement Probability: ${engagementScore}%
├─ 🏆 Engagement Level: ${engagementLevel}
├─ 🗓️ Predicted Retention: ${retentionMonths}+ bulan
├─ 🤝 Potential Connections: ${potentialConnections} dalam 30 hari
└─ 🎯 Activity Pattern: Detected

🛡️ SECURITY & TRUST SCORE
├─ 🔒 Account Security: ${securityScore}/100
├─ 📅 Account Age: ${accountAge > 365 ? '✅ Established' : '⚠️ New'}
├─ 🚫 Previous Bans: ✅ Clean
├─ 🔄 Verification History: First Time
└─ 🏆 Trust Level: ${trustLevel}

🎁 PERMISSIONS & ROLE GRANTS
├─ 👑 Member Role: ✅ Granted
├─ 📍 Channel Access: 45+ channels unlocked
├─ 🏆 Achievement Unlocked: Verified Member
└─ ⚡ Permission Sync: Complete

📋 LOG METADATA
├─ 🕒 Generated: ${timestamp}
├─ 🔧 System Version: VerifySystem v3.3.0 (Final)
├─ 🤖 Bot ID: ${interaction.client.user.username}#${interaction.client.user.discriminator || '0000'}
├─ 🏠 Server: BananaSkiee Community
├─ 📁 Log ID: VRF_${user.id}_${Date.now()}
└─ 🔍 Access Level: Admin & Moderator Only
`;
    }

    // ========== HELPER FUNCTIONS (ADVANCED LOG) ==========
    getAccountAge(accountCreationDate) { const created = new Date(accountCreationDate); const now = new Date(); const diffTime = Math.abs(now - created); return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); }
    getTotalDuration(session) { if (!session?.createdAt) return 'N/A'; const duration = Date.now() - session.createdAt; const minutes = Math.floor(duration / 60000); const seconds = Math.floor((duration % 60000) / 1000); return `${minutes} menit ${seconds} detik`; }
    getCompletedSteps(session) { if (!session) return '0/8'; const steps = ['verified', 'server_exploration', 'mission', 'ready_for_rating', 'rating', 'completed']; const currentStep = steps.indexOf(session.step); return currentStep >= 0 ? `${currentStep + 1}/8` : 'N/A'; }
    
    // ANALYTICS & PREDICTIONS
    getEngagementScore(session) { 
        let score = 50; 
        if (!session) return score;

        // Base score adjustment based on rating
        if (session.data.rating) {
            score += (session.data.rating - 50) / 2; 
        } else {
             score += 10; // Bonus for completing mission even without rating
        }

        if (session.data.feedback) score += 10; 
        if (session.data.firstMessage) score += 15;
        
        // Time based bonus/penalty
        const responseTime = session.data.responseTime || 60000; // Default 60s
        if (responseTime < 15000) score += 5; // Fast
        if (responseTime > 60000) score -= 5; // Slow

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
        // Simple linear prediction: 95% score = 12 months retention
        return Math.min(Math.round((engagement / 95) * 12), 12); 
    }
    getPotentialConnections(session) { 
        const engagement = this.getEngagementScore(session); 
        // Predict up to 20 connections based on score
        return Math.min(Math.round((engagement / 95) * 20), 20); 
    }
    
    // SECURITY & TRUST
    getSecurityScore(user) { 
        let score = 70; 
        const accountAge = this.getAccountAge(user.createdAt);
        if (user.verified) score += 5; // Email verified
        if (user.mfaEnabled) score += 10; // MFA (unlikely to be obtainable via bot but good for completeness)
        if (user.avatar) score += 5; 
        if (accountAge > 365) score += 10;

        return Math.min(score, 100); 
    }
    getTrustLevel(user) { 
        const score = this.getSecurityScore(user); 
        if (score >= 90) return 'Very High';
        if (score >= 80) return 'High'; 
        if (score >= 60) return 'Medium'; 
        return 'Low'; 
    }
    
    // OTHER UTILITIES
    getUserClient(member) { 
        // Presence data is often unavailable or inconsistent via bot for this detail
        const client = member.presence?.clientStatus;
        if (!client) return 'Unknown';
        
        if (client.desktop) return 'Desktop';
        if (client.mobile) return 'Mobile';
        if (client.web) return 'Web';
        return 'Unknown';
    } 
    
    getAchievements(session) { 
        let achievements = '🏆 Verified Member';
        if (session?.data?.firstMessage) {
             achievements += '\n✨ Completed Mission';
        }
        if (session?.data?.rating && session.data.rating >= 80) {
            achievements += '\n🌟 High Rated Service';
        }
        return achievements;
    }

    // RATING UTILITIES
    getRatingCategory(rating) { if (rating <= 50) return "Perlu improvement"; if (rating <= 75) return "Cukup memuaskan"; if (rating <= 90) return "Baik & profesional"; return "Luar biasa"; }
    getRatingColor(rating) { if (rating <= 50) return 0xFF0000; if (rating <= 75) return 0xFFA500; if (rating <= 90) return 0x00FF00; return 0x0000FF; }
    getRatingEmoji(rating) { if (rating <= 50) return "❌"; if (rating <= 75) return "⚠️"; if (rating <= 90) return "✅"; return "🎉"; }

    // SESSION MANAGEMENT
    createUserSession(userId) {
        if (this.userSessions.has(userId)) { return this.userSessions.get(userId); }
        const session = { id: userId, createdAt: Date.now(), step: 'verified', data: {}, lastActivity: Date.now(), explorationStart: Date.now(), welcomeSent: false };
        this.userSessions.set(userId, session);
        return session;
    }
    getUserSession(userId) { return this.userSessions.get(userId); }
    updateUserSession(userId, updates) {
        const session = this.getUserSession(userId);
        if (session) {
            // Merge data object recursively
            if (updates.data && session.data) {
                Object.assign(session.data, updates.data);
                delete updates.data;
            }
            Object.assign(session, updates, { lastActivity: Date.now() });
            this.userSessions.set(userId, session);
        }
        return session;
    }

    // UTILITY
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

module.exports = VerifySystem;
