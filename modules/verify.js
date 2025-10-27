// File: /workspace/modules/verify.js

const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, 
    UserFlags, MessageFlags // Diperlukan untuk pesan dismissive (ephemeral)
} = require('discord.js');

// Kelas utama yang menangani sistem verifikasi
class VerifySystem {
    constructor() {
        if (VerifySystem.instance) {
            console.log('🔄 Returning existing VerifySystem instance');
            return VerifySystem.instance;
        }
        VerifySystem.instance = this;
        console.log('✅ Creating new VerifySystem instance');

        // PENTING: Ganti ID di bawah ini dengan ID server Anda yang sebenarnya
        this.config = {
            verifyChannelId: '1352823970054803509',
            logChannelId: '1428789734993432676', // ID Forum Channel (Log Verify)
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
                { q: "Bagaimana cara mendapatkan role?", a: "Role otomatis diberikan setelah verifikasi selesai." },
                { q: "Apa saja channel yang tersedia?", a: "Setelah verifikasi, semua channel premium akan terbuka." },
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
            // Hapus pesan lama, jika ada error (e.g., pesan terlalu lama), diabaikan
            const messages = await channel.messages.fetch({ limit: 50 });
            for (const message of messages.values()) {
                try {
                    await message.delete();
                    await this.delay(100);
                } catch (error) { /* Ignored error during cleanup */ }
            }
        } catch (error) {
            console.log('⚠️ Channel cleanup warning:', error.message);
        }
    }

    // PESAN UTAMA VERIFY (NON-DISMISSIVE/PUBLIK)
    async sendVerifyMessage(channel) {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎯 VERIFIKASI PREMIUM ACCESS')
            .setDescription('Selamat Datang di BananaSkiee Community!\n\nSebelum mengakses area eksklusif, verifikasi identitas Anda.')
            .setFooter({ text: 'Enterprise Security • Zero Data Storage' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_account')
                    .setLabel('✅ VERIFY MY ACCOUNT')
                    .setStyle(ButtonStyle.Success)
            );
        // Pesan ini publik, TIDAK memiliki tombol dismiss message
        await channel.send({ embeds: [embed], components: [button] });
    }

    // ========== MAIN VERIFICATION FLOW ========== 
    async handleVerify(interaction) {
        try {
            // LOG: Pengecekan antrian yang menghasilkan pesan DISMISSIVE
            if (this.verificationQueue.has(interaction.user.id)) {
                console.log(`[LOG DISMISS - ERROR] User ${interaction.user.username} sudah dalam antrian.`);
                // PESAN INI HARUS DISMISSIVE
                return await interaction.reply({
                    content: '⏳ Verification already in progress. Please wait...',
                    flags: [MessageFlags.Ephemeral] 
                });
            }

            this.verificationQueue.set(interaction.user.id, true);
            
            // Defer Reply UTAMA adalah NON-EPHEMERAL (Publik) agar progress bar terlihat
            await interaction.deferReply(); 
            console.log(`[LOG NON-DISMISS] Defer Reply utama (Progress Bar) sebagai NON-EPHEMERAL (Publik).`);


            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                // EDIT REPLY, tetap terlihat (Non-Dismissive)
                return await interaction.editReply({ 
                    content: '✅ Anda sudah terverifikasi!',
                }); 
            }

            // Looping Progress Bar (Edit Reply NON-EPHEMERAL)
            for (let i = 0; i < this.verificationSteps.length; i++) {
                const step = this.verificationSteps[i];
                const embed = this.getProgressEmbed(step, i + 1, this.verificationSteps.length);
                await interaction.editReply({ embeds: [embed] });
                await this.delay(step.duration);
            }

            await this.showVerificationSuccess(interaction);
            this.verificationQueue.delete(interaction.user.id);

        } catch (error) {
            console.error('❌ Verify handling error:', error);
            this.verificationQueue.delete(interaction.user.id);
            if (error.code === 10062) return; // Ignore "Unknown Interaction"
            
            // Penanganan error, mengirim pesan EPHEMERAL/DISMISSIVE
            if (!interaction.replied && !interaction.deferred) {
                 await interaction.reply({ content: '❌ Terjadi kesalahan saat verifikasi.', flags: [MessageFlags.Ephemeral] }); 
            } else if (interaction.deferred) {
                 await interaction.editReply({ content: '❌ Terjadi kesalahan saat verifikasi.', components: [] });
            }
        } 
    }

    getProgressEmbed(step, currentStep, totalSteps) {
        // ... (Logika progress bar) ...
        const progress = Math.round((currentStep / totalSteps) * 100);
        const progressBar = this.generateProgressBar(progress);
        const timeElapsed = (currentStep * 2.5 + Math.random() * 0.5).toFixed(1);

        const tasksText = step.tasks.map((task, index) => {
            const status = index < currentStep - 1 ? '✅' : (index === currentStep - 1 ? '🔄' : '⏳');
            return `• ${task}: ${status}`;
        }).join('\n');
        
        return new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle(`${step.emoji} PROSES VERIFIKASI - ${progress}%`)
            .setDescription(`${step.name} sedang berjalan...\n\n${progressBar}\n\n${tasksText}`)
            .setFooter({ text: `⏱️ ${timeElapsed} detik • ${step.name}` });
    }

    generateProgressBar(percentage) {
        const bars = 20;
        const filledBars = Math.round((percentage / 100) * bars);
        const emptyBars = bars - filledBars;
        return `━━━━━━━━━━━━━━━━━━━━\n${'█'.repeat(filledBars)}${'▒'.repeat(emptyBars)}\n━━━━━━━━━━━━━━━━━━━━`;
    }

    // PESAN SUKSES SETELAH PROGRESS BAR (NON-DISMISSIVE/PUBLIK)
    async showVerificationSuccess(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎊 VERIFIKASI BERHASIL')
            .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\n**PILIHAN LANJUTAN:**\n[🚀 SKIP VERIFY] - Langsung dapat role\n[🎯 CONTINUE VERIFY] - Lanjut verifikasi lengkap`)
            .setFooter({ text: 'Platinum Member • Professional Network' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('skip_verify').setLabel('🚀 SKIP VERIFY').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('continue_verify').setLabel('🎯 CONTINUE VERIFY').setStyle(ButtonStyle.Primary)
            );
        
        // EDIT REPLY AGAR TETAP TERLIHAT (Non-Dismissive)
        await interaction.editReply({ embeds: [embed], components: [buttons] });
        this.createUserSession(interaction.user.id);
    }

    // ========== BUTTON HANDLERS - NON-DISMISSIVE (Edit Message) ==========
    async handleSkipVerify(interaction) {
        await interaction.deferUpdate();
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 SELAMAT DATANG DI KOMUNITAS')
            .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\nAnda sekarang Verified Member dengan akses penuh.`)
            .setFooter({ text: 'Your Journey Starts Now • Complete Your Mission' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('rate_server').setLabel('⭐ RATE SERVER').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('faqs_skip').setLabel('❓ FAQS').setStyle(ButtonStyle.Secondary), // <-- Ini akan memicu pesan DISMISSIVE
                new ButtonBuilder().setCustomId('give_role_skip').setLabel('🎁 GIVE ROLE').setStyle(ButtonStyle.Success)
            );
        
        // EDIT REPLY AGAR TETAP TERLIHAT (Non-Dismissive)
        await interaction.editReply({ embeds: [embed], components: [buttons] });
    } 

    async handleContinueVerify(interaction) {
        await interaction.deferUpdate();

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🏠 KUNJUNGI AREA SERVER')
            .setDescription('Sebelum lanjut, silakan kunjungi channel penting: Rules, General, dll.')
            .setFooter({ text: 'Akan otomatis lanjut dalam 30 detik' });

        // EDIT REPLY AGAR TETAP TERLIHAT (Non-Dismissive)
        await interaction.editReply({ content: `${interaction.user}`, embeds: [embed], components: [] });

        this.updateUserSession(interaction.user.id, { step: 'server_exploration', explorationStart: Date.now() });

        setTimeout(async () => {
            try {
                const message = await interaction.channel.messages.fetch(interaction.message.id);
                if (message) { await this.autoProceedToMission(message); }
            } catch (error) { /* Ignore if message or interaction expires */ }
        }, 30000);
    }

    // ... (handleNextVerify, handleNextFinal, showFinalCompletion, handleBackToVerify, grantMemberAccess sama) ...

    // ========== BUTTON HANDLERS - DISMISSIVE (Ephemeral) ==========

    async handleSeeMission(interaction) {
        try {
            console.log(`[LOG DISMISS - MISI] Mengirim detail misi EPHEMERAL/DISMISSIVE.`);
            // PESAN INI HARUS DISMISSIVE
            await interaction.reply({ 
                flags: [MessageFlags.Ephemeral], 
                embeds: [new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('📋 DETAIL MISI PERKENALAN')
                    .setDescription(`**Apa yang harus dilakukan:**\n\n1. Buka channel <#${this.config.generalChannelId}>\n2. Kirim pesan perkenalan singkat.`)
                ]
            });
        } catch (error) {
            console.error('❌ See mission error:', error);
            await interaction.reply({ content: '❌ Gagal menampilkan detail misi.', flags: [MessageFlags.Ephemeral] }); 
        } 
    }

    async handleFaqs(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(this.faqData.title)
                .setDescription(this.faqData.questions.map((item, index) => `**${index + 1}. ${item.q}**\n${item.a}`).join('\n\n'))
                .setFooter({ text: 'Butuh bantuan lebih? Hubungi staff!' });
            
            console.log(`[LOG DISMISS - FAQ] Mengirim FAQ EPHEMERAL/DISMISSIVE.`);
            // PESAN INI HARUS DISMISSIVE
            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] }); 
        } catch (error) {
            console.error('❌ FAQs error:', error);
            await interaction.reply({ content: '❌ Failed to show FAQs.', flags: [MessageFlags.Ephemeral] }); 
        }
    }

    // ========== RATING MODAL SUBMIT (DISMISSIVE Reply) ==========
    
    // ... (handleInputRating dan handleGiveFeedback: showModal otomatis dismiss interaksi tombol) ...

    async handleRatingSubmit(interaction) {
        try {
            // DeferReply NON-EPHEMERAL karena ini akan mengedit pesan utama
            await interaction.deferReply(); 
            // ... (lanjutkan pemrosesan rating) ...
            
            const ratingValue = interaction.fields.getTextInputValue('rating_value');
            const rating = parseInt(ratingValue);

            if (isNaN(rating) || rating < 1 || rating > 100) {
                // Peringatan ini dikirim sebagai EPHEMERAL (karena defer awal publik)
                // PENTING: Untuk mengirim pesan EPHEMERAL setelah defer publik, gunakan followUp atau editReply dengan flags [MessageFlags.Ephemeral]
                console.log(`[LOG DISMISS - ERROR] Rating tidak valid. Mengirim peringatan EPHEMERAL.`);
                return await interaction.editReply({ 
                    content: '❌ Harap masukkan angka yang valid antara 1-100.', 
                    flags: [MessageFlags.Ephemeral] 
                }); 
            }
            
            // ... (Kode pemrosesan data rating) ...
            
            // EDIT MESSAGE YANG ADA (NON-DISMISSIVE)
            await interaction.editReply({ embeds: [/* Rating Embed */], components: [/* Next Final Button */] });
        } catch (error) {
             // ... (Error handling) ...
        } 
    }

    async handleFeedbackSubmit(interaction) {
        try {
            console.log(`[LOG DISMISS - FEEDBACK] Defer Reply Modal Submit untuk Feedback sebagai EPHEMERAL.`);
            // HARUS DISMISSIVE: Menggunakan deferReply EPHEMERAL
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }); 

            const feedbackContent = interaction.fields.getTextInputValue('feedback_content');
            // ... (Kode pemrosesan data feedback) ...

            // EDIT MESSAGE YANG ADA (DISMISSIVE)
            await interaction.editReply({ 
                content: feedbackContent ? '✅ Terima kasih atas feedbacknya!' : '⚠️ Feedback dilewati.', 
                components: [] 
            });
        } catch (error) {
             // ... (Error handling) ...
        } 
    }
    
    // ========== DETECT MESSAGE & AUTO PROCEED (Dipanggil dari messageCreate.js) ==========
    async detectFirstMessage(message) {
        const userId = message.author.id;
        const session = this.getUserSession(userId);

        if (session && (session.step === 'server_exploration' || session.step === 'mission') &&
            message.channel.id === this.config.generalChannelId && !session.data.firstMessage) {
            
            const verifyChannel = await message.client.channels.fetch(this.config.verifyChannelId);
            const messages = await verifyChannel.messages.fetch({ limit: 100 }); 
            const verifyMessage = messages.find(m => m.mentions.has(userId)); 
            
            if (verifyMessage) {
                // Simpan data pesan pertama
                session.data.firstMessage = message.content.substring(0, 100); 
                session.step = 'ready_for_rating';
                this.updateUserSession(userId, session);
                
                await this.enableNextVerifyButton(verifyMessage); 
            }
        }
    }
    
    // ... (autoProceedToMission, enableNextVerifyButton sama) ...

    // ========== ROLE MANAGEMENT & LOGGING (NON-DISMISSIVE) ==========
    async handleGiveRole(interaction) {
        try {
            await interaction.deferUpdate();
            
            const success = await this.grantMemberAccess(interaction);
            
            if (success) {
                await this.logVerification(interaction);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ ROLE BERHASIL DIBERIKAN')
                    .setDescription(`Role member telah diberikan kepada ${interaction.user.username}!`)
                    .setFooter({ text: 'Welcome to BananaSkiee Community!' });
                
                // EDIT REPLY AGAR TETAP TERLIHAT (Non-Dismissive)
                await interaction.editReply({ embeds: [embed], components: [] });
                this.userSessions.delete(interaction.user.id);
            }
        } catch (error) {
            console.error('Give role error:', error);
            await interaction.editReply({ content: '❌ Failed to give role.', components: [] });
        }
    }
    
    // ... (grantMemberAccess sama) ...

    // ========== LOGGING SYSTEM (KE FORUM CHANNEL) - Aman dari 2000 char limit ========== 
    async logVerification(interaction) {
        try {
            const logChannel = await interaction.guild.channels.fetch(this.config.logChannelId);
            
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) {
                 console.log(`⚠️ Log Channel ID ${this.config.logChannelId} is not a Forum Channel or not found. Log skipped.`);
                 return;
            }

            const logContent = this.generateLogContent(interaction.user, interaction.member, this.getUserSession(interaction.user.id));

            // POTONG LOG JIKA TERLALU PANJANG (MAX 2000 per pesan)
            const MAX_LENGTH_INITIAL = 1900; 
            const initialContent = logContent.substring(0, MAX_LENGTH_INITIAL);
            const followUpContent = logContent.substring(MAX_LENGTH_INITIAL);

            const forumPost = await logChannel.threads.create({
                name: `${interaction.user.username} - Verification Log`, 
                message: { content: initialContent },
            });

            if (followUpContent.length > 0) {
                await forumPost.send({ content: `**[LANJUTAN LOG VERIFIKASI]**\n\n${followUpContent.substring(0, 2000)}` });
            }

            console.log(`📋 Verification forum post created: ${forumPost.id} - ${interaction.user.username}`);
        } catch (error) {
            console.error('❌ Logging error:', error);
        } 
    }

    // ... (generateLogContent dan semua helper functions sama) ...

    // UTILITY
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    createUserSession(userId) { /* ... */ }
    getUserSession(userId) { return this.userSessions.get(userId); }
    updateUserSession(userId, updates) { /* ... */ }
}

module.exports = VerifySystem;├─ ⏱️ Response Time: ${session?.data?.responseTime ? Math.round(session.data.responseTime / 1000) + ' detik' : 'N/A'}
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
    getCompletedSteps(session) { if (!session) return '0/8'; const steps = ['verified', 'server_exploration', 'mission', 'ready_for_rating', 'rating', 'completed']; const currentStep = steps.indexOf(session.step); return currentStep >= 0 ? `${currentStep + 1}/8` : 'N/A'; }
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
}

module.exports = VerifySystem;
