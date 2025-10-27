// File: /workspace/modules/verify.js

const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, 
    UserFlags, MessageFlags
} = require('discord.js');

class VerifySystem {
    constructor() {
        if (VerifySystem.instance) {
            console.log('🔄 Returning existing VerifySystem instance');
            return VerifySystem.instance;
        }
        VerifySystem.instance = this;
        console.log('✅ Creating new VerifySystem instance');

        // PASTIKAN ID BERIKUT SUDAH BENAR!
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
                try { await message.delete(); await this.delay(100); } catch (error) {/* Ignored */}
            }
        } catch (error) { console.log('⚠️ Channel cleanup warning:', error.message); }
    }

    // PESAN UTAMA VERIFY (NON-EPHEMERAL)
    async sendVerifyMessage(channel) {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎯 VERIFIKASI PREMIUM ACCESS')
            .setDescription('Selamat Datang di BananaSkiee Community!\n\nSebelum mengakses area eksklusif, verifikasi identitas Anda untuk membuka:\n\n• Channel Member Eksklusif\n• Jaringan Profesional Global \n• Resource Library Premium\n• Event Private & Workshop')
            .setFooter({ text: 'Enterprise Security • Zero Data Storage' });
        const button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('verify_account').setLabel('✅ VERIFY MY ACCOUNT').setStyle(ButtonStyle.Success));
        await channel.send({ embeds: [embed], components: [button] });
        console.log(`[LOG PUBLIK] Pesan Verifikasi Utama dikirim (Non-Dismissive).`);
    }

    // ========== MAIN VERIFICATION FLOW ========== 
    async handleVerify(interaction) {
        try {
            if (this.verificationQueue.has(interaction.user.id)) {
                console.log(`[LOG DISMISS] Sedang proses. Mengirim peringatan EPHEMERAL.`);
                return await interaction.reply({ content: '⏳ Verification already in progress. Please wait...', flags: [MessageFlags.Ephemeral] });
            }

            this.verificationQueue.set(interaction.user.id, true);
            
            // DEFER REPLY PUBLIK (NON-EPHEMERAL)
            await interaction.deferReply(); 
            console.log(`[LOG PUBLIK] Defer Reply utama (Progress Bar) sebagai PUBLIK.`);

            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                return await interaction.editReply({ content: '✅ Anda sudah terverifikasi!' }); // Publik
            }

            // Progress Bar (Publik)
            for (let i = 0; i < this.verificationSteps.length; i++) {
                // ... (embed progress) ...
                await interaction.editReply({ embeds: [this.getProgressEmbed(this.verificationSteps[i], i + 1, this.verificationSteps.length)] });
                await this.delay(this.verificationSteps[i].duration);
            }

            await this.showVerificationSuccess(interaction); // Publik
            this.verificationQueue.delete(interaction.user.id);
        } catch (error) {
             // ... (Error handling - Cek apakah bisa mengirim ephemeral) ...
            if (!interaction.replied && !interaction.deferred) {
                 console.log(`[LOG DISMISS] Gagal verifikasi (initial). Mengirim error EPHEMERAL.`);
                 await interaction.reply({ content: '❌ Terjadi kesalahan saat verifikasi.', flags: [MessageFlags.Ephemeral] }); 
            } else if (interaction.deferred) {
                 console.log(`[LOG PUBLIK] Gagal verifikasi (deferred). Mengedit pesan PUBLIK dengan error.`);
                 await interaction.editReply({ content: '❌ Terjadi kesalahan saat verifikasi.', components: [] }); // Ini tetap PUBLIK
            }
        } 
    }
    
    // ... (getProgressEmbed, generateProgressBar, showVerificationSuccess - Semua Non-Dismissive/Publik) ...
    // ... (handleSkipVerify, handleContinueVerify - Semua Non-Dismissive/Publik) ...
    // ... (handleNextVerify, handleNextFinal, showFinalCompletion, handleBackToVerify - Semua Non-Dismissive/Publik) ...

    // ========== BUTTON HANDLERS - DISMISSIVE (Ephemeral/Modal) ==========

    async handleSeeMission(interaction) {
        try {
            console.log(`[LOG DISMISS] User ${interaction.user.username} klik See Mission. Mengirim balasan EPHEMERAL.`);
            // PESAN INI HARUS DISMISSIVE
            await interaction.reply({ 
                flags: [MessageFlags.Ephemeral], 
                embeds: [new EmbedBuilder()
                    .setColor(0x5865F2).setTitle('📋 DETAIL MISI PERKENALAN')
                    .setDescription(`**Lakukan:**\n1. Buka <#${this.config.generalChannelId}>\n2. Kirim pesan perkenalan.\n\nTombol **NEXT VERIFY** akan aktif setelahnya.`)
                    .setFooter({ text: 'Pesan bebas, yang penting perkenalan.' })
                ]
            });
            console.log(`✅ [LOG DISMISS] Balasan See Mission EPHEMERAL berhasil dikirim.`);
        } catch (error) {
            console.error('See mission error:', error);
            try { // Coba kirim error ephemeral
                await interaction.reply({ content: '❌ Gagal menampilkan detail misi.', flags: [MessageFlags.Ephemeral] }); 
            } catch (e) { console.error("Gagal mengirim error reply:", e);}
        } 
    }

    async handleFaqs(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2).setTitle(this.faqData.title)
                .setDescription(this.faqData.questions.map((item, index) => `**${index + 1}. ${item.q}**\n${item.a}`).join('\n\n'))
                .setFooter({ text: 'Butuh bantuan lebih? Hubungi staff.' });
            
            console.log(`[LOG DISMISS] User ${interaction.user.username} klik FAQ. Mengirim balasan EPHEMERAL.`);
            // PESAN INI HARUS DISMISSIVE
            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] }); 
            console.log(`✅ [LOG DISMISS] Balasan FAQ EPHEMERAL berhasil dikirim.`);
        } catch (error) {
            console.error('FAQs error:', error);
            try { // Coba kirim error ephemeral
               await interaction.reply({ content: '❌ Failed to show FAQs.', flags: [MessageFlags.Ephemeral] }); 
            } catch (e) { console.error("Gagal mengirim error reply:", e);}
        }
    }

    // ========== RATING MODAL HANDLERS (Modal otomatis dismiss interaksi tombol) ==========
    async handleInputRating(interaction) {
        console.log(`[LOG MODAL] Menampilkan Modal Rating.`);
        // ... (Kode Modal) ...
        const modal = new ModalBuilder().setCustomId('input_rating_modal').setTitle('⭐ Beri Rating Verifikasi');
        const ratingInput = new TextInputBuilder().setCustomId('rating_value').setLabel("Rating Anda (1-100):").setStyle(TextInputStyle.Short).setRequired(true);
        const firstRow = new ActionRowBuilder().addComponents(ratingInput);
        modal.addComponents(firstRow);
        await interaction.showModal(modal);
    }
    async handleGiveFeedback(interaction) {
        console.log(`[LOG MODAL] Menampilkan Modal Feedback.`);
        // ... (Kode Modal) ...
        const modal = new ModalBuilder().setCustomId('give_feedback_modal').setTitle('💬 Beri Saran/Feedback');
        const feedbackInput = new TextInputBuilder().setCustomId('feedback_content').setLabel("Saran atau kritik Anda:").setStyle(TextInputStyle.Paragraph).setMinLength(10).setRequired(true);
        const firstRow = new ActionRowBuilder().addComponents(feedbackInput);
        modal.addComponents(firstRow);
        await interaction.showModal(modal);
    }
    
    // ========== RATING MODAL SUBMIT (Edit Reply Non-Dismissive, Error pakai FollowUp Ephemeral) ==========
    async handleRatingSubmit(interaction) {
        try {
            // DeferReply NON-EPHEMERAL karena ini akan mengedit pesan utama
            await interaction.deferReply(); 
            console.log(`[LOG PUBLIK] Modal submit rating (Defer NON-EPHEMERAL).`);

            const ratingValue = interaction.fields.getTextInputValue('rating_value');
            const rating = parseInt(ratingValue);
            
            if (isNaN(rating) || rating < 1 || rating > 100) {
                // SOLUSI ERROR DISMISSIVE: Gunakan followUp Ephemeral
                console.log(`[LOG DISMISS] Rating tidak valid (${ratingValue}). Mengirim error EPHEMERAL via followUp.`);
                await interaction.followUp({ 
                    content: '❌ Harap masukkan angka yang valid antara 1-100.', 
                    flags: [MessageFlags.Ephemeral] 
                });
                return; // Hentikan eksekusi lebih lanjut
            }

            // ... (Update session) ...
            this.updateUserSession(interaction.user.id, { data: { rating: rating, ratingCategory: this.getRatingCategory(rating), ratingTime: Date.now() } });

            const resultEmbed = new EmbedBuilder()
                .setColor(this.getRatingColor(rating))
                .setTitle(`⭐ TERIMA KASIH ATAS RATING ${rating}/100!`)
                .setDescription(`**Kategori: ${this.getRatingCategory(rating)} ${this.getRatingEmoji(rating)}**`)
                .setFooter({ text: 'Feedback sangat berarti bagi kami' });
            const resultButtons = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('next_final').setLabel('🚀 LANJUT FINAL').setStyle(ButtonStyle.Primary));
            
            // EDIT MESSAGE YANG ADA (NON-DISMISSIVE)
            await interaction.editReply({ embeds: [resultEmbed], components: [resultButtons] });
            console.log(`[LOG PUBLIK] Rating valid. Pesan utama diedit (Non-Dismissive).`);

        } catch (error) {
            console.error('Rating submit error:', error);
            // Error handling fallback - coba kirim ephemeral
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Failed to process rating.', flags: [MessageFlags.Ephemeral] });
                } else {
                    await interaction.followUp({ content: '❌ Failed to process rating.', flags: [MessageFlags.Ephemeral] });
                }
            } catch(e) { console.error("Gagal mengirim error followUp/reply:", e); }
        } 
    }

    // ========== FEEDBACK MODAL SUBMIT (DISMISSIVE Reply) ==========
    async handleFeedbackSubmit(interaction) {
        try {
            // DeferReply EPHEMERAL karena ini hanya konfirmasi
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }); 
            console.log(`[LOG DISMISS] Modal submit feedback (Defer EPHEMERAL/DISMISSIVE).`);

            const feedbackContent = interaction.fields.getTextInputValue('feedback_content');
            // ... (Update session) ...
            this.updateUserSession(interaction.user.id, { data: { feedback: feedbackContent, feedbackTime: Date.now() } });

            // EDIT MESSAGE YANG ADA (DISMISSIVE)
            await interaction.editReply({ content: feedbackContent ? '✅ Terima kasih atas feedbacknya!' : '⚠️ Feedback dilewati.', components: [] });
            console.log(`[LOG DISMISS] Konfirmasi feedback EPHEMERAL berhasil diedit.`);
        } catch (error) {
            console.error('Feedback submit error:', error);
            try { // Coba edit error ephemeral
                await interaction.editReply({ content: '❌ Failed to process feedback.', flags: [MessageFlags.Ephemeral] }); 
            } catch (e) { console.error("Gagal mengirim error editReply:", e); }
        } 
    }
    
    // ... (detectFirstMessage, autoProceedToMission, enableNextVerifyButton - logika sama) ...
    // ... (handleGiveRole, logVerification - logika logging sama) ...
    // ... (generateLogContent dan helper functions sama) ...

    // UTILITY
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    createUserSession(userId) { /* ... */ }
    getUserSession(userId) { return this.userSessions.get(userId); }
    updateUserSession(userId, updates) { /* ... */ }
}

module.exports = VerifySystem;
