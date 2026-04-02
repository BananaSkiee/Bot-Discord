const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType,
    ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder,
    MessageFlags, MediaGalleryBuilder, ThumbnailBuilder
} = require('discord.js');

class VerifySystem {
    constructor() {
        if (VerifySystem.instance) return VerifySystem.instance;
        VerifySystem.instance = this;

        this.config = {
            verifyChannelId: '1352823970054803509',
            logChannelId: '1428789734993432676',
            memberRoleId: '1352286235233620108',
            generalChannelId: '1352404526870560788',
            serverId: '1347233781391560837',
            rulesChannelId: '1352326247186694164',
            guideChannelId: '1352311290432983182', // @home
            verifyForumChannelId: '1428789734993432676' // Forum untuk log (opsional jika ingin log terpisah)
        };
        
        this.userSessions = new Map();
        this.verificationQueue = new Map();
        this.verificationCodes = new Map(); // Store codes: userId -> code
        
        this.verificationSteps = [
            { name: "Security Check", emoji: "🔐", duration: 2500 },
            { name: "Account Analysis", emoji: "🔍", duration: 2200 },
            { name: "Server Sync", emoji: "⚡", duration: 2800 },
            { name: "Final Preparation", emoji: "🎯", duration: 2000 }
        ];
    }

    // ========== COMPONENT V2 BUILDERS ==========
    
    createLoadingContainer(step, progress, totalSteps) {
        const container = new ContainerBuilder();
        
        // Header Section with Thumbnail
        const headerSection = new SectionBuilder()
            .addTextDisplay(
                new TextDisplayBuilder().setContent(`# ${step.emoji} VERIFIKASI ACCOUNT\n**Step ${progress}/${totalSteps}:** ${step.name}`)
            )
            .setThumbnail(new ThumbnailBuilder({ url: 'https://cdn.discordapp.com/emojis/verify.png' }));
        
        container.addSection(headerSection);
        container.addSeparator(new SeparatorBuilder().setSpacing(1));
        
        // Progress Bar
        const percentage = Math.round((progress / totalSteps) * 100);
        const filled = '█'.repeat(Math.round(percentage / 5));
        const empty = '▒'.repeat(20 - Math.round(percentage / 5));
        
        container.addTextDisplay(
            new TextDisplayBuilder().setContent(`\`${filled}${empty}\` **${percentage}%**`)
        );
        
        // Status Section
        const statusText = progress === totalSteps 
            ? '✅ Verifikasi hampir selesai...' 
            : '🔄 Memproses data akun...';
            
        container.addTextDisplay(
            new TextDisplayBuilder().setContent(`\n${statusText}\n⏱️ Estimasi: ${(totalSteps - progress) * 2} detik`)
        );
        
        return container;
    }

    createMissionContainer(title, description, status = 'pending') {
        const container = new ContainerBuilder();
        const emoji = status === 'completed' ? '✅' : status === 'active' ? '🔄' : '⏳';
        
        container.addTextDisplay(
            new TextDisplayBuilder().setContent(`# ${emoji} ${title}`)
        );
        
        container.addSeparator(new SeparatorBuilder().setSpacing(1));
        
        container.addTextDisplay(
            new TextDisplayBuilder().setContent(description)
        );
        
        if (status === 'active') {
            container.addSeparator(new SeparatorBuilder().setSpacing(2));
            container.addTextDisplay(
                new TextDisplayBuilder().setContent('*⏳ Menunggu aksi Anda...*')
            );
        }
        
        return container;
    }

    // ========== INITIALIZATION ==========
    
    async initialize(client) {
        try {
            console.log('🚀 Initializing Component V2 Verify System...');
            const channel = await client.channels.fetch(this.config.verifyChannelId);
            if (!channel) throw new Error('Verify channel not found');
            
            await this.cleanChannel(channel);
            await this.sendVerifyMessage(channel);
            console.log('✅ Component V2 Verify System ready');
        } catch (error) {
            console.error('❌ Verify init failed:', error);
        }
    }

    async cleanChannel(channel) {
        try {
            const messages = await channel.messages.fetch({ limit: 50 });
            for (const msg of messages.values()) {
                await msg.delete().catch(() => {});
                await this.delay(100);
            }
        } catch (err) {
            console.log('⚠️ Cleanup warning:', err.message);
        }
    }

    async sendVerifyMessage(channel) {
        // Component V2 Container for main message
        const container = new ContainerBuilder()
            .addTextDisplay(
                new TextDisplayBuilder().setContent('# 🎯 VERIFIKASI MEMBER\nSelamat datang di **BananaSkiee Community**!')
            )
            .addSeparator(new SeparatorBuilder().setSpacing(1))
            .addTextDisplay(
                new TextDisplayBuilder().setContent(
                    'Untuk mengakses seluruh channel dan fitur server, silakan verifikasi identitas Anda.\n\n' +
                    '**Benefit Member:**\n• Akses 45+ channel eksklusif\n• Event & giveaway khusus member\n• Networking dengan creator\n• Resource library premium'
                )
            )
            .addSeparator(new SeparatorBuilder().setSpacing(2));

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_account')
                    .setLabel('🚀 Mulai Verifikasi')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✨')
            );

        await channel.send({
            components: [container, button],
            flags: MessageFlags.IsComponentsV2
        });
    }

    // ========== MAIN FLOW ==========
    
    async handleVerify(interaction) {
        try {
            if (this.verificationQueue.has(interaction.user.id)) {
                return await interaction.reply({
                    content: '⏳ Verifikasi sedang berjalan...',
                    flags: MessageFlags.Ephemeral
                });
            }

            this.verificationQueue.set(interaction.user.id, true);
            await interaction.deferReply({ ephemeral: true });

            // Save session with token
            this.createUserSession(interaction.user.id);
            this.updateUserSession(interaction.user.id, {
                interactionToken: interaction.token,
                applicationId: interaction.applicationId,
                channelId: interaction.channelId
            });

            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                return await interaction.editReply({
                    content: '✅ Anda sudah terverifikasi!'
                });
            }

            // Loading Animation with Component V2
            const totalSteps = this.verificationSteps.length;
            for (let i = 0; i < totalSteps; i++) {
                const step = this.verificationSteps[i];
                const container = this.createLoadingContainer(step, i + 1, totalSteps);
                
                await interaction.editReply({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });
                
                await this.delay(step.duration);
            }

            // Langsung ke Server Exploration (tanpa skip option)
            await this.showServerExploration(interaction);
            this.verificationQueue.delete(interaction.user.id);

        } catch (error) {
            console.error('Verify error:', error);
            this.verificationQueue.delete(interaction.user.id);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Terjadi kesalahan',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }

    async showServerExploration(interaction) {
        try {
            await interaction.deferUpdate();
            this.updateUserSession(interaction.user.id, {
                interactionToken: interaction.token
            });

            const container = new ContainerBuilder()
                .addTextDisplay(
                    new TextDisplayBuilder().setContent('# 🏠 KUNJUNGI AREA SERVER')
                )
                .addSeparator(new SeparatorBuilder().setSpacing(1))
                .addTextDisplay(
                    new TextDisplayBuilder().setContent(
                        'Sebelum melanjutkan, silakan kunjungi channel penting berikut:\n\n' +
                        `• <id:home> - Panduan server\n` +
                        `• <#${this.config.rulesChannelId}> - Peraturan server\n` +
                        `• <id:customize> - Self roles`
                    )
                )
                .addSeparator(new SeparatorBuilder().setSpacing(2))
                .addTextDisplay(
                    new TextDisplayBuilder().setContent('*⏳ Otomatis lanjut dalam 20 detik...*')
                );

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('📖 Rules')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/${this.config.rulesChannelId}`),
                    new ButtonBuilder()
                        .setLabel('🏠 Guide')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/@home`),
                    new ButtonBuilder()
                        .setLabel('🎨 Roles')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/customize-community`)
                );

            await interaction.editReply({
                components: [container, buttons],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });

            // Update session
            this.updateUserSession(interaction.user.id, {
                step: 'server_exploration',
                explorationStart: Date.now()
            });

            // Auto advance to mission
            setTimeout(async () => {
                const session = this.getUserSession(interaction.user.id);
                if (session && session.step === 'server_exploration') {
                    await this.autoProceedToMission(interaction.client, interaction.user.id);
                }
            }, 20000);

        } catch (error) {
            console.error('Exploration error:', error);
        }
    }

    async autoProceedToMission(client, userId) {
        try {
            const session = this.getUserSession(userId);
            if (!session) return;

            const container = this.createMissionContainer(
                'MISI PERKENALAN',
                `**Langkah selanjutnya:**\n\n` +
                `1. Buka channel <#${this.config.generalChannelId}>\n` +
                `2. Kirim pesan perkenalan singkat\n` +
                `3. Bot akan otomatis mendeteksi dan mengirim kode verifikasi via DM\n\n` +
                `**Contoh:**\n\`\`\`Halo! Saya [nama], baru join nih. Salam kenal semua! 👋\`\`\``,
                'active'
            );

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('💬 Ke Channel General')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${this.config.serverId}/${this.config.generalChannelId}`)
                );

            await this.editOriginalEphemeralMessage(
                client,
                userId,
                session.interactionToken,
                session.applicationId,
                container,
                buttons
            );

            this.updateUserSession(userId, {
                step: 'introduction_mission',
                missionStartTime: Date.now()
            });

        } catch (error) {
            console.error('Auto proceed error:', error);
        }
    }

    // ========== DETECT FIRST MESSAGE & SEND CODE ==========
    
    async detectFirstMessage(message) {
        try {
            if (message.channel.id !== this.config.generalChannelId) return;
            if (message.author.bot) return;
            if (message.member.roles.cache.has(this.config.memberRoleId)) return;

            const userId = message.author.id;
            const session = this.getUserSession(userId);

            if (!session || session.step !== 'introduction_mission') return;

            console.log(`✅ ${message.author.username} completed chat mission`);

            // Generate 6-digit code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            this.verificationCodes.set(userId, {
                code: verificationCode,
                timestamp: Date.now(),
                attempts: 0
            });

            // Send DM with code
            try {
                await message.author.send({
                    content: `🔐 **KODE VERIFIKASI ANDA**\n\nKode: \`${verificationCode}\`\n\nMasukkan kode ini di tombol "Input Kode" yang muncul di channel verifikasi.\nKode berlaku selama 10 menit.\n\n*Jangan berikan kode ini kepada siapapun!*`
                });
            } catch (dmError) {
                console.error('DM failed:', dmError);
                // Fallback: tell them to enable DM
                await message.reply({
                    content: `⚠️ <@${userId}> DM Anda terkunci! Silakan buka DM sementara untuk menerima kode verifikasi.`,
                    ephemeral: true
                }).catch(() => {});
                return;
            }

            // Update UI to show Input Code button (enabled)
            const container = this.createMissionContainer(
                'VERIFIKASI KODE',
                `✅ **Misi chat selesai!**\n\n` +
                `**Kode verifikasi telah dikirim ke DM Anda.**\n\n` +
                `Silakan cek DM dari bot, lalu masukkan kode 6 digit tersebut dengan menekan tombol di bawah.`,
                'active'
            );

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('input_verify_code')
                        .setLabel('🔐 Input Kode Verifikasi')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🔑'),
                    new ButtonBuilder()
                        .setCustomId('resend_code')
                        .setLabel('🔄 Kirim Ulang Kode')
                        .setStyle(ButtonStyle.Secondary)
                );

            await this.editOriginalEphemeralMessage(
                message.client,
                userId,
                session.interactionToken,
                session.applicationId,
                container,
                buttons
            );

            this.updateUserSession(userId, {
                step: 'awaiting_code',
                codeSent: true,
                messageContent: message.content
            });

            // Auto expire code after 10 minutes
            setTimeout(() => {
                this.verificationCodes.delete(userId);
            }, 600000);

        } catch (error) {
            console.error('Detect message error:', error);
        }
    }

    // ========== CODE VERIFICATION ==========
    
    async handleCodeInput(interaction) {
        try {
            const session = this.getUserSession(interaction.user.id);
            
            if (!session || session.step !== 'awaiting_code') {
                return await interaction.reply({
                    content: '❌ Tidak ada kode yang aktif. Silakan mulai ulang verifikasi.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('verify_code_modal')
                .setTitle('🔐 Verifikasi Kode');

            const codeInput = new TextInputBuilder()
                .setCustomId('code_value')
                .setLabel("Masukkan Kode 6 Digit:")
                .setStyle(TextInputStyle.Short)
                .setMinLength(6)
                .setMaxLength(6)
                .setPlaceholder('Contoh: 123456')
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(codeInput);
            modal.addComponents(row);
            
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Code input error:', error);
        }
    }

    async handleCodeSubmit(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const userId = interaction.user.id;
            const session = this.getUserSession(userId);
            const codeData = this.verificationCodes.get(userId);
            
            if (!session || !codeData) {
                return await interaction.editReply({
                    content: '❌ Kode sudah expired atau tidak valid. Silakan mulai ulang.'
                });
            }

            const inputCode = interaction.fields.getTextInputValue('code_value');
            
            if (inputCode !== codeData.code) {
                codeData.attempts++;
                if (codeData.attempts >= 3) {
                    this.verificationCodes.delete(userId);
                    return await interaction.editReply({
                        content: '❌ Terlalu banyak percobaan gagal. Silakan mulai ulang verifikasi.'
                    });
                }
                return await interaction.editReply({
                    content: `❌ Kode salah! Percobaan ${codeData.attempts}/3. Cek DM Anda lagi.`
                });
            }

            // Code correct - Grant role
            const success = await this.grantMemberAccess(interaction);
            
            if (success) {
                // Log to forum
                await this.logVerification(interaction, codeData);
                
                // Clear data
                this.verificationCodes.delete(userId);
                this.userSessions.delete(userId);

                // Success message with Component V2
                const container = new ContainerBuilder()
                    .addTextDisplay(
                        new TextDisplayBuilder().setContent('# 🎉 VERIFIKASI BERHASIL!')
                    )
                    .addSeparator(new SeparatorBuilder().setSpacing(1))
                    .addTextDisplay(
                        new TextDisplayBuilder().setContent(
                            `Selamat datang, **${interaction.user.username}**! 🚀\n\n` +
                            `✅ Role Member telah diberikan\n` +
                            `✅ Akses penuh ke server telah dibuka\n` +
                            `✅ Channel verifikasi akan tersembunyi\n\n` +
                            `Silakan ke <#${this.config.generalChannelId}> untuk mulai berinteraksi!`
                        )
                    );

                await interaction.editReply({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });

                // Hide verify channel permission (optional, using role-based is better)
            }

        } catch (error) {
            console.error('Code submit error:', error);
            await interaction.editReply({
                content: '❌ Gagal memverifikasi kode.'
            });
        }
    }

    async handleResendCode(interaction) {
        try {
            await interaction.deferUpdate();
            
            const userId = interaction.user.id;
            const codeData = this.verificationCodes.get(userId);
            
            if (!codeData) {
                return await interaction.followUp({
                    content: '❌ Kode sudah expired. Mulai ulang verifikasi.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Resend DM
            try {
                await interaction.user.send({
                    content: `🔐 **KODE VERIFIKASI ANDA (RESEND)**\n\nKode: \`${codeData.code}\`\n\nMasukkan kode ini di channel verifikasi.`
                });
                
                await interaction.followUp({
                    content: '✅ Kode telah dikirim ulang ke DM!',
                    flags: MessageFlags.Ephemeral
                });
            } catch (e) {
                await interaction.followUp({
                    content: '❌ Gagal mengirim DM. Pastikan DM Anda terbuka!',
                    flags: MessageFlags.Ephemeral
                });
            }

        } catch (error) {
            console.error('Resend code error:', error);
        }
    }

    // ========== UTILITIES ==========
    
    async grantMemberAccess(interaction) {
        try {
            const member = interaction.member;
            if (!member.roles.cache.has(this.config.memberRoleId)) {
                await member.roles.add(this.config.memberRoleId, 'Verification completed via code');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Grant access error:', error);
            return false;
        }
    }

    async logVerification(interaction, codeData) {
        try {
            const logChannel = await interaction.guild.channels.fetch(this.config.logChannelId);
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) return;

            const session = this.getUserSession(interaction.user.id);
            
            const content = `
🎉 **VERIFIKASI BERHASIL - COMPONENT V2**

👤 **User:** ${interaction.user.tag} (${interaction.user.id})
⏱️ **Waktu:** ${new Date().toLocaleString('id-ID')}
💬 **Pesan Perkenalan:** ${session?.messageContent || 'N/A'}
🔐 **Kode Used:** ${codeData.code}
🔄 **Percobaan:** ${codeData.attempts + 1}
`;

            await logChannel.threads.create({
                name: `✅ ${interaction.user.username} - Verified`,
                message: { content }
            });

        } catch (error) {
            console.error('Log error:', error);
        }
    }

    async editOriginalEphemeralMessage(client, userId, token, applicationId, containerOrEmbed, components) {
        try {
            const REST_API_URL = `/webhooks/${applicationId}/${token}/messages/@original`;
            
            const payload = {
                components: containerOrEmbed instanceof ContainerBuilder 
                    ? [containerOrEmbed.toJSON()] 
                    : undefined,
                embeds: containerOrEmbed instanceof EmbedBuilder 
                    ? [containerOrEmbed.toJSON()] 
                    : undefined,
                content: undefined
            };

            if (components) {
                payload.components = components.map(c => c.toJSON());
            }

            await client.rest.patch(REST_API_URL, { body: payload });
            return true;
        } catch (error) {
            console.error('Edit failed:', error.message);
            return false;
        }
    }

    createUserSession(userId) {
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, {
                id: userId,
                createdAt: Date.now(),
                step: 'pending',
                data: {}
            });
        }
        return this.userSessions.get(userId);
    }

    getUserSession(userId) {
        return this.userSessions.get(userId);
    }

    updateUserSession(userId, updates) {
        const session = this.getUserSession(userId);
        if (session) {
            Object.assign(session, updates, { lastActivity: Date.now() });
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = VerifySystem;
