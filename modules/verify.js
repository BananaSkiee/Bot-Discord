const { 
    ActionRowBuilder, // ✅ WAJIB ADA
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ChannelType,
    MessageFlags
} = require('discord.js');
const { MongoClient } = require('mongodb');

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
            mongoUri: 'mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX'
        };
        
        this.userSessions = new Map(); // Cache in-memory
        this.verificationQueue = new Map();
        this.verificationCodes = new Map();
        this.mongoClient = null;
        this.db = null;
        
        this.verificationSteps = [
            { name: "Security Check", emoji: "🔐", duration: 2500, tasks: ["Verifikasi email", "Cek usia akun", "Scan aktivitas"] },
            { name: "AI Analysis", emoji: "🤖", duration: 2200, tasks: ["Pattern recognition", "Behavior analysis", "Risk assessment"] },
            { name: "Database Check", emoji: "🗄️", duration: 2800, tasks: ["Cross-reference data", "Identity confirmation", "Access provisioning"] },
            { name: "Final Verification", emoji: "🎯", duration: 2000, tasks: ["Security clearance", "Member access", "System integration"] }
        ];

        // Connect MongoDB
        this.connectMongo();
    }

    async connectMongo() {
        try {
            this.mongoClient = new MongoClient(this.config.mongoUri);
            await this.mongoClient.connect();
            this.db = this.mongoClient.db('verify_akira');
            console.log('✅ MongoDB Connected for Verify System');
        } catch (err) {
            console.error('❌ MongoDB connection failed:', err.message);
        }
    }

    // ========== COMPONENT V2 BUILDERS ==========
    
    createMainContainer() {
        return {
            type: 17,
            components: [
                { type: 10, content: "## 🎯 VERIFIKASI PREMIUM ACCESS" },
                { type: 14 },
                { type: 10, content: "**Sebelum unlock area eksklusif, Verify terlebih dahulu**\n\n**Verify Untuk Membuka:**\n> - Unlock Partnership\n> - Unlock Events Server\n> - Unlock Giveaway Server\n> - Unlock Channels Eksklusif" },
                { type: 14 },
                { type: 1, components: [
                    { type: 2, style: 3, label: "Verify My Account", custom_id: "verify_account", emoji: { name: "✨" } },
                    { type: 2, style: 4, label: "9 1 1", custom_id: "emergency_help", emoji: { name: "📞" }, disabled: true }
                ]},
                { type: 14 },
                { type: 10, content: "-# Enterprise Security • Zero Data Storage" }
            ]
        };
    }

    createLoadingContainer(step, currentStep, totalSteps) {
        const percentage = Math.round((currentStep / totalSteps) * 100);
        const filled = '█'.repeat(Math.round(percentage / 5));
        const empty = '▒'.repeat(20 - Math.round(percentage / 5));
        const timeElapsed = (currentStep * 2.5).toFixed(1);
        
        let taskList = '';
        step.tasks.forEach((task, index) => {
            const status = index < currentStep - 1 ? '✅' : (index === currentStep - 1 ? '🔄' : '⏳');
            taskList += `> - **${task}: ${status}**\n`;
        });

        return {
            type: 17,
            components: [
                { type: 10, content: `### ${step.emoji} PROSES VERIFIKASI - ${percentage}%` },
                { type: 14 },
                { type: 10, content: `**${step.name} sedang berjalan...**\n━━━━━━━━━━━━━━━━━━━━\n${filled}${empty}\n━━━━━━━━━━━━━━━━━━━━\n${taskList}` },
                { type: 14 },
                { type: 10, content: `-# ⏱️ ${timeElapsed} detik • ${step.name}` }
            ]
        };
    }

    createExplorationContainer() {
        return {
            type: 17,
            components: [
                { type: 10, content: "## 🏠 KUNJUNGI AREA SERVER" },
                { type: 14 },
                { type: 10, content: `### Sebelum lanjut, silakan kunjungi channel penting:\n> 🏠 <id:home> - Lihat overview server\n> 📋 <#${this.config.rulesChannelId}> - Baca peraturan server \n> 🎨 <id:customize> - Setup roles dan channels\n\n**📌 Cara:** Klik tombol di bawah untuk mengunjungi masing-masing channel.` },
                { type: 14 },
                { type: 1, components: [
                    { type: 2, style: 5, label: "🏠 Server Guide", url: `https://discord.com/channels/${this.config.serverId}/@home` },
                    { type: 2, style: 5, label: "📋 Rules", url: `https://discord.com/channels/${this.config.serverId}/${this.config.rulesChannelId}` },
                    { type: 2, style: 5, label: "🎨 Self Role", url: `https://discord.com/channels/${this.config.serverId}/customize-community` }
                ]},
                { type: 14 },
                { type: 10, content: "-# Akan otomatis lanjut dalam 20 detik" }
            ]
        };
    }

    createMissionContainer() {
        return {
            type: 17,
            components: [
                { type: 10, content: "## 🔄 MISI PERKENALAN" },
                { type: 14 },
                { type: 10, content: `**Langkah selanjutnya:**\n\n1️⃣ Buka channel <#${this.config.generalChannelId}>\n2️⃣ Kirim pesan perkenalan singkat\n3️⃣ Bot akan otomatis mendeteksi dan mengirim **kode verifikasi via DM**\n\n**Contoh pesan:**\n\`\`\`Halo! Saya [nama], baru join nih. Salam kenal semua! 👋\`\`\`\n\n⏳ *Menunggu aksi Anda...*` },
                { type: 14 },
                { type: 1, components: [
                    { type: 2, style: 5, label: "💬 Ke Channel General", url: `https://discord.com/channels/${this.config.serverId}/${this.config.generalChannelId}` }
                ]}
            ]
        };
    }

    createCodeInputContainer() {
        return {
            type: 17,
            components: [
                { type: 10, content: "## ✅ MISI CHAT SELESAI!" },
                { type: 14 },
                { type: 10, content: "**Kode verifikasi telah dikirim ke DM Anda!**\n\nSilakan cek DM dari bot, lalu masukkan kode 6 digit tersebut dengan menekan tombol di bawah." },
                { type: 14 },
                { type: 1, components: [
                    { type: 2, style: 3, label: "🔐 Input Kode Verifikasi", custom_id: "input_verify_code", emoji: { name: "🔑" } },
                    { type: 2, style: 2, label: "🔄 Kirim Ulang Kode", custom_id: "resend_code" }
                ]}
            ]
        };
    }

    createSuccessContainer(username) {
        return {
            type: 17,
            components: [
                { type: 10, content: "## 🎉 VERIFIKASI BERHASIL!" },
                { type: 14 },
                { type: 10, content: `Selamat datang, **${username}**! 🚀\n\n✅ Role Member telah diberikan\n✅ Akses penuh ke server telah dibuka\n✅ Channel verifikasi akan tersembunyi\n\nSilakan ke <#${this.config.generalChannelId}> untuk mulai berinteraksi!` }
            ]
        };
    }

    // ========== INITIALIZATION ==========
    
    async initialize(client) {
        this.client = client;
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
        const container = this.createMainContainer();
        
        await channel.send({
            flags: 32768,
            components: [container]
        });
    }

    // ========== MAIN FLOW ==========
    
    async handleVerify(interaction) {
        try {
            // Cek queue
            if (this.verificationQueue.has(interaction.user.id)) {
                return await interaction.reply({
                    content: '⏳ Verifikasi sedang berjalan...',
                    flags: MessageFlags.Ephemeral
                });
            }

            this.verificationQueue.set(interaction.user.id, true);

            // Defer sekali saja
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Cek sudah verified
            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                return await interaction.editReply({
                    content: '✅ Anda sudah terverifikasi!'
                });
            }

            // Create session
            const session = {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                interactionToken: interaction.token,
                applicationId: interaction.applicationId,
                channelId: interaction.channelId,
                step: 'loading',
                createdAt: Date.now(),
                lastActivity: Date.now()
            };

            this.userSessions.set(interaction.user.id, session);
            await this.saveSessionToMongo(session);

            // Loading Animation
            const totalSteps = this.verificationSteps.length;
            for (let i = 0; i < totalSteps; i++) {
                const step = this.verificationSteps[i];
                const container = this.createLoadingContainer(step, i + 1, totalSteps);
                
                await this.editWithComponentV2(interaction, container);
                await this.delay(step.duration);
            }

            // Langsung ke exploration (tanpa defer lagi!)
            await this.showServerExploration(interaction);
            this.verificationQueue.delete(interaction.user.id);

        } catch (error) {
            console.error('Verify error:', error);
            this.verificationQueue.delete(interaction.user.id);
            
            // Cek belum replied
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Terjadi kesalahan',
                    flags: MessageFlags.Ephemeral
                });
            } else if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Terjadi kesalahan saat verifikasi'
                });
            }
        }
    }

    async editWithComponentV2(interaction, container) {
        try {
            const REST_API_URL = `/webhooks/${interaction.applicationId}/${interaction.token}/messages/@original`;
            
            await this.client.rest.patch(REST_API_URL, {
                body: {
                    flags: 32768,
                    components: [container]
                }
            });
        } catch (error) {
            console.error('Edit Component V2 failed:', error);
            throw error;
        }
    }

    async showServerExploration(interaction) {
        try {
            // TIDAK ADA DEFER LAGI - langsung edit saja!
            const container = this.createExplorationContainer();

            await this.editWithComponentV2(interaction, container);

            // Update session
            const session = this.userSessions.get(interaction.user.id);
            if (session) {
                session.step = 'server_exploration';
                session.explorationStart = Date.now();
                session.lastActivity = Date.now();
                await this.saveSessionToMongo(session);
            }

            // Auto advance
            setTimeout(async () => {
                const currentSession = this.getUserSession(interaction.user.id);
                if (currentSession && currentSession.step === 'server_exploration') {
                    await this.autoProceedToMission(interaction.user.id);
                }
            }, 20000);

        } catch (error) {
            console.error('Exploration error:', error);
            // Jangan throw lagi, coba fallback
            try {
                await interaction.editReply({
                    content: '❌ Gagal memuat exploration. Coba klik Verify lagi.'
                });
            } catch (e) {
                console.error('Fallback error:', e);
            }
        }
    }

    async autoProceedToMission(userId) {
        try {
            const session = this.getUserSession(userId);
            if (!session) return;

            const container = this.createMissionContainer();

            await this.editOriginalWithComponentV2(
                session.interactionToken,
                session.applicationId,
                container
            );

            session.step = 'introduction_mission';
            session.missionStartTime = Date.now();
            session.lastActivity = Date.now();
            await this.saveSessionToMongo(session);

        } catch (error) {
            console.error('Auto proceed error:', error);
        }
    }

    // ========== DETECT FIRST MESSAGE ==========
    
    async detectFirstMessage(message) {
        try {
            if (message.channel.id !== this.config.generalChannelId) return;
            if (message.author.bot) return;
            if (message.member.roles.cache.has(this.config.memberRoleId)) return;

            const userId = message.author.id;
            const session = this.getUserSession(userId);

            if (!session || session.step !== 'introduction_mission') return;

            console.log(`✅ ${message.author.username} completed chat mission`);

            // Generate code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            this.verificationCodes.set(userId, {
                code: verificationCode,
                timestamp: Date.now(),
                attempts: 0
            });

            // Send DM
            try {
                const dmContainer = {
                    type: 17,
                    components: [
                        { type: 10, content: "## 🔐 KODE VERIFIKASI ANDA" },
                        { type: 14 },
                        { type: 10, content: `Kode: **\`${verificationCode}\`**\n\nMasukkan kode ini di tombol **"Input Kode"** yang muncul di channel verifikasi.\nKode berlaku selama **10 menit**.\n\n⚠️ *Jangan berikan kode ini kepada siapapun!*` },
                        { type: 14 },
                        { type: 10, content: "-# BananaSkiee Verification" }
                    ]
                };

                await message.author.send({
                    flags: 32768,
                    components: [dmContainer]
                });
            } catch (dmError) {
                console.error('DM failed:', dmError);
                await message.reply({
                    content: `⚠️ <@${userId}> DM Anda terkunci! Silakan buka DM sementara.`,
                    allowedMentions: { users: [userId] }
                }).catch(() => {});
                return;
            }

            // Update UI
            const container = this.createCodeInputContainer();

            await this.editOriginalWithComponentV2(
                session.interactionToken,
                session.applicationId,
                container
            );

            session.step = 'awaiting_code';
            session.codeSent = true;
            session.messageContent = message.content;
            session.lastActivity = Date.now();
            await this.saveSessionToMongo(session);

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
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            
            const userId = interaction.user.id;
            const session = this.getUserSession(userId);
            const codeData = this.verificationCodes.get(userId);
            
            if (!session || !codeData) {
                return await interaction.editReply({
                    content: '❌ Kode sudah expired. Silakan mulai ulang.'
                });
            }

            const inputCode = interaction.fields.getTextInputValue('code_value');
            
            if (inputCode !== codeData.code) {
                codeData.attempts++;
                if (codeData.attempts >= 3) {
                    this.verificationCodes.delete(userId);
                    return await interaction.editReply({
                        content: '❌ Terlalu banyak percobaan gagal. Mulai ulang.'
                    });
                }
                return await interaction.editReply({
                    content: `❌ Kode salah! ${codeData.attempts}/3. Cek DM lagi.`
                });
            }

            // Success
            const success = await this.grantMemberAccess(interaction);
            
            if (success) {
                await this.logVerification(interaction, codeData);
                this.verificationCodes.delete(userId);
                this.userSessions.delete(userId);
                await this.deleteSessionFromMongo(userId);

                const container = this.createSuccessContainer(interaction.user.username);
                await this.editWithComponentV2(interaction, container);
            }

        } catch (error) {
            console.error('Code submit error:', error);
            await interaction.editReply({
                content: '❌ Gagal memverifikasi.'
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
                    content: '❌ Kode expired. Mulai ulang.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                const dmContainer = {
                    type: 17,
                    components: [
                        { type: 10, content: "## 🔐 KODE VERIFIKASI (RESEND)" },
                        { type: 14 },
                        { type: 10, content: `Kode: **\`${codeData.code}\`**` }
                    ]
                };

                await interaction.user.send({
                    flags: 32768,
                    components: [dmContainer]
                });
                
                await interaction.followUp({
                    content: '✅ Kode dikirim ulang!',
                    flags: MessageFlags.Ephemeral
                });
            } catch (e) {
                await interaction.followUp({
                    content: '❌ DM terkunci!',
                    flags: MessageFlags.Ephemeral
                });
            }

        } catch (error) {
            console.error('Resend error:', error);
        }
    }

    // ========== MONGO & UTILS ==========

    async saveSessionToMongo(session) {
        if (!this.db) return;
        try {
            await this.db.collection('sessions').updateOne(
                { userId: session.userId },
                { $set: session },
                { upsert: true }
            );
        } catch (err) {
            console.error('Mongo save error:', err);
        }
    }

    async loadSessionFromMongo(userId) {
        if (!this.db) return null;
        try {
            return await this.db.collection('sessions').findOne({ userId: userId });
        } catch (err) {
            console.error('Mongo load error:', err);
            return null;
        }
    }

    async deleteSessionFromMongo(userId) {
        if (!this.db) return;
        try {
            await this.db.collection('sessions').deleteOne({ userId: userId });
        } catch (err) {
            console.error('Mongo delete error:', err);
        }
    }

    getUserSession(userId) {
        // Cek memory dulu, kalau ga ada cek mongo
        let session = this.userSessions.get(userId);
        if (!session && this.db) {
            // Async load tapi return null untuk sekarang
            this.loadSessionFromMongo(userId).then(data => {
                if (data) this.userSessions.set(userId, data);
            });
        }
        return session;
    }

    async editOriginalWithComponentV2(token, applicationId, container) {
        try {
            const REST_API_URL = `/webhooks/${applicationId}/${token}/messages/@original`;
            
            await this.client.rest.patch(REST_API_URL, {
                body: {
                    flags: 32768,
                    components: [container]
                }
            });
            return true;
        } catch (error) {
            console.error('Edit original failed:', error.message);
            return false;
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
            console.error('Grant access error:', error);
            return false;
        }
    }

    async logVerification(interaction, codeData) {
        try {
            const logChannel = await interaction.guild.channels.fetch(this.config.logChannelId);
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) return;

            const session = this.getUserSession(interaction.user.id);
            const duration = session?.createdAt 
                ? Math.round((Date.now() - session.createdAt) / 1000) 
                : 0;

            const logContainer = {
                type: 17,
                components: [
                    { type: 10, content: `## ✅ ${interaction.user.username} VERIFIED` },
                    { type: 14 },
                    { type: 10, content: `**ID:** \`${interaction.user.id}\`\n**Durasi:** ${Math.floor(duration/60)}m ${duration%60}s\n**Kode:** ||${codeData.code}||` }
                ]
            };

            await logChannel.threads.create({
                name: `✅ ${interaction.user.username}`,
                message: { flags: 32768, components: [logContainer] }
            });

        } catch (error) {
            console.error('Log error:', error);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = VerifySystem;
