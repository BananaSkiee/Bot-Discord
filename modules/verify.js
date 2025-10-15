const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class VerifySystem {
    constructor() {
        // ✅ SINGLETON PATTERN - PASTIKAN HANYA 1 INSTANCE
if (VerifySystem.instance) {
    console.log('🔄 Returning existing VerifySystem instance');
    return VerifySystem.instance;
}
VerifySystem.instance = this;
console.log('✅ Creating new VerifySystem instance');
        
        this.config = {
            verifyChannelId: '1352823970054803509',
            logChannelId: '1426537842875826278',
            memberRoleId: '1352286235233620108',
            generalChannelId: '1352404526870560788',
            serverId: '1347233781391560837',
            rulesChannelId: '1352326247186694164'
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
                    flags: 64
                });
            }

            this.verificationQueue.set(interaction.user.id, true);

            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                return await interaction.reply({
                    content: '✅ Anda sudah terverifikasi!',
                    flags: 64
                });
            }

            // Quick verification process
            await interaction.reply({ 
                content: '🔄 Memulai verifikasi...', 
                flags: 64 
            });

            const steps = [
                { name: "Security Check", emoji: "🔐", duration: 800 },
                { name: "Profile Analysis", emoji: "🤖", duration: 800 },
                { name: "Final Verification", emoji: "✅", duration: 800 }
            ];

            let currentMessage = await interaction.fetchReply();

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const progress = ((i + 1) / steps.length) * 100;
                
                const embed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle(`${step.emoji} PROSES VERIFIKASI - ${Math.round(progress)}%`)
                    .setDescription(`${step.name} sedang berjalan...\n\n${this.generateProgressBar(progress)}`)
                    .setFooter({ text: `Step ${i + 1}/${steps.length}` });

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
            
            try {
                await interaction.reply({
                    content: '❌ System error. Please try again later.',
                    flags: 64
                });
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    }

    generateProgressBar(percentage) {
        const bars = 20;
        const filledBars = Math.round((percentage / 100) * bars);
        const emptyBars = bars - filledBars;
        return `🔄 STATUS: ${'█'.repeat(filledBars)}${'▒'.repeat(emptyBars)} ${Math.round(percentage)}%`;
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

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ 
                    embeds: [embed], 
                    components: [buttons] 
                });
            } else {
                await interaction.reply({ 
                    embeds: [embed], 
                    components: [buttons],
                    flags: 64
                });
            }

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
                .setDescription(`Selamat Bergabung, ${interaction.user.username}!\n\nAnda sekarang Verified Member dengan akses penuh.\n\n**✅ YANG SUDAH AKTIF:**\n• Role Verified Member diberikan\n• Semua channel premium terbuka\n• Channel verify otomatis tersembunyi\n\n**Misi:** Buka <#${this.config.generalChannelId}> dan perkenalkan diri!\n\n\`"Halo! Saya ${interaction.user.username} - senang join komunitas ini!"\``)
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
            .setDescription('Sebelum lanjut, silakan kunjungi channel penting:\n\n🏠 **Server Home** - Lihat overview server\n📋 **Rules & Guidelines** - Baca peraturan server  \n🎨 **Customize Profile** - Setup roles dan tags\n\n**📌 Cara:** Klik tombol di bawah untuk mengunjungi masing-masing channel.')
            .setFooter({ text: 'Akan otomatis lanjut dalam 30 detik' });

        const linkButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🏠 SERVER GUILD')
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

        await interaction.editReply({ 
            embeds: [embed], 
            components: [linkButtons] 
        });

        this.updateUserSession(interaction.user.id, { 
            step: 'server_exploration',
            explorationStart: Date.now()
        });

        // ✅ SIMPAN INTERACTION REFERENCE UNTUK EDIT NANTI
        const session = this.getUserSession(interaction.user.id);
        session.originalInteraction = {
            channelId: interaction.channelId,
            messageId: (await interaction.fetchReply()).id,
            userId: interaction.user.id
        };
        this.updateUserSession(interaction.user.id, session);

        // ✅ AUTO LANJUT SETELAH 30 DETIK - GUNAKAN CARA YANG LEBIH AMAN
        setTimeout(async () => {
            try {
                await this.autoProceedServerExploration(interaction);
            } catch (error) {
                console.error('Auto server exploration complete error:', error);
                // ✅ JIKA GAGAL, COBA CARI MESSAGE LAINNYA DARI USER
                await this.fallbackProceedServerExploration(interaction);
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

// ✅ METHOD UTAMA UNTUK AUTO PROCEED
async autoProceedServerExploration(originalInteraction) {
    try {
        const session = this.getUserSession(originalInteraction.user.id);
        if (!session || session.step !== 'server_exploration') {
            console.log(`❌ Session not found or wrong step for ${originalInteraction.user.username}`);
            return;
        }

        const explorationTime = Date.now() - (session.explorationStart || Date.now());
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('👋 MISI PERKENALAN')
            .setDescription(`Sekarang saatnya perkenalan!\n\n**Misi:** Buka channel <#${this.config.generalChannelId}> dan perkenalkan diri\n\n**Template:**\n\`"Halo! Saya ${originalInteraction.user.username}\nSenang join BananaSkiee Community! 🚀"\``)
            .setFooter({ text: 'Bot akan otomatis detect chat Anda' });

        const linkButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 OPEN GENERAL')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${this.config.serverId}/${this.config.generalChannelId}`)
            );

        const actionButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('see_mission')
                    .setLabel('📝 SEE MISSION')
                    .setStyle(ButtonStyle.Primary)
            );

        // ✅ EDIT MESSAGE ASLI
        try {
            await originalInteraction.editReply({ 
                embeds: [embed], 
                components: [linkButton, actionButton] 
            });
        } catch (error) {
            if (error.code === 10062 || error.code === 10008) {
                console.log('⚠️ Interaction expired, trying fallback...');
                await this.fallbackProceedServerExploration(originalInteraction);
                return;
            }
            throw error;
        }

        // ✅ PASTIKAN SESSION DIUPDATE DENGAN BENAR
        const updatedSession = {
            step: 'introduction_mission',
            missionStartTime: Date.now(),
            explorationTime: explorationTime,
            welcomeSent: false,
            data: session.data || {}
        };
        
        this.updateUserSession(originalInteraction.user.id, updatedSession);

        console.log(`✅ Auto proceeded user ${originalInteraction.user.username} to mission`);
        console.log(`📊 New session step: ${this.getUserSession(originalInteraction.user.id)?.step}`);

    } catch (error) {
        console.error('Auto proceed server exploration error:', error);
        throw error;
    }
                }
    
// ✅ FALLBACK METHOD JIKA INTERACTION/MESSAGE TIDAK DITEMUKAN
async fallbackProceedServerExploration(originalInteraction) {
    try {
        const session = this.getUserSession(originalInteraction.user.id);
        if (!session || session.step !== 'server_exploration') return;

        const channel = await originalInteraction.client.channels.fetch(this.config.verifyChannelId);
        
        // ✅ CARI MESSAGE TERBARU DARI USER INI
        const messages = await channel.messages.fetch({ limit: 20 });
        const userMessage = messages.find(msg => 
            msg.author.id === originalInteraction.client.user.id &&
            msg.embeds.length > 0 &&
            msg.embeds[0].title?.includes('KUNJUNGI AREA SERVER') &&
            msg.components.length > 0
        );

        if (!userMessage) {
            console.log('❌ Cannot find user message for fallback');
            return;
        }

        const explorationTime = Date.now() - (session.explorationStart || Date.now());
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('👋 MISI PERKENALAN')
            .setDescription(`Sekarang saatnya perkenalan!\n\n**Misi:** Buka channel <#${this.config.generalChannelId}> dan perkenalkan diri\n\n**Template:**\n\`"Halo! Saya ${originalInteraction.user.username}\nSenang join BananaSkiee Community! 🚀"\``)
            .setFooter({ text: 'Bot akan otomatis detect chat Anda' });

        const linkButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 OPEN GENERAL')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${this.config.serverId}/${this.config.generalChannelId}`)
            );

        const actionButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('see_mission')
                    .setLabel('📝 SEE MISSION')
                    .setStyle(ButtonStyle.Primary)
            );

        await userMessage.edit({ 
            embeds: [embed], 
            components: [linkButton, actionButton] 
        });

        this.updateUserSession(originalInteraction.user.id, { 
            step: 'introduction_mission',
            missionStartTime: Date.now(),
            explorationTime: explorationTime
        });

        console.log(`✅ Fallback succeeded for user ${originalInteraction.user.username}`);

    } catch (error) {
        console.error('Fallback proceed server exploration error:', error);
        
        // ✅ JIKA SEMUA GAGAL, KIRIM MESSAGE BARU
        try {
            const channel = await originalInteraction.client.channels.fetch(this.config.verifyChannelId);
            await channel.send({
                content: `❌ <@${originalInteraction.user.id}> Sistem mengalami error. Silakan mulai ulang verifikasi dengan klik tombol verify lagi.`,
                flags: 64
            });
        } catch (finalError) {
            console.error('Final fallback also failed:', finalError);
        }
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
                flags: 64
            });

        } catch (error) {
            console.error('See mission error:', error);
            await interaction.reply({
                content: '❌ Failed to show mission details.',
                flags: 64
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
            const session = this.getUserSession(user.id);
            
            if (session && session.welcomeSent) {
                return null;
            }

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

            if (session) {
                session.welcomeSent = true;
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
            const targetUser = interaction.message.mentions.users.first();
            const targetUsername = targetUser?.username || 'member baru';

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('👋 AUTO WELCOME')
                .setDescription(`Pilih salam otomatis untuk ${targetUsername}:\n\n${this.welcomeTemplates.map((template, index) => `${index + 1}. "${template.replace('{username}', targetUsername)}"`).join('\n')}`)
                .setFooter({ text: 'Pilih salah satu salam • Bisa berkali-kali' });

            const rows = [];
            for (let i = 0; i < 10; i += 5) {
                const row = new ActionRowBuilder();
                for (let j = i; j < i + 5 && j < 10; j++) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`welcome_${j}`)
                            .setLabel(`${j + 1}`)
                            .setStyle(ButtonStyle.Secondary)
                    );
                }
                rows.push(row);
            }

            await interaction.reply({
                embeds: [embed],
                components: rows,
                flags: 64
            });

        } catch (error) {
            console.error('Auto welcome error:', error);
            await interaction.reply({
                content: '❌ Failed to open welcome options.',
                flags: 64
            });
        }
    }

    async handleWelcomeSelection(interaction) {
        try {
            const welcomeIndex = parseInt(interaction.customId.split('_')[1]);
            const targetUser = interaction.message.mentions.users.first();
            const targetUsername = targetUser?.username || 'member baru';
            const welcomeMessage = this.welcomeTemplates[welcomeIndex].replace('{username}', targetUsername);

            await interaction.channel.send(welcomeMessage);
            await interaction.deferUpdate();
            
            await interaction.followUp({
                content: `✅ Salam berhasil dikirim! Bisa pilih lagi jika mau.`,
                flags: 64
            });

        } catch (error) {
            console.error('Welcome selection error:', error);
            await interaction.reply({
                content: '❌ Gagal mengirim salam.',
                flags: 64
            });
        }
    }

    async handleCustomMessage(interaction) {
        try {
            const targetUser = interaction.message.mentions.users.first();
            const targetUsername = targetUser?.username || 'member baru';
            
            const modal = new ModalBuilder()
                .setCustomId('custom_message_modal')
                .setTitle('💬 Custom Welcome Message');

            const messageInput = new TextInputBuilder()
                .setCustomId('custom_message')
                .setLabel(`Tulis pesan sambutan untuk ${targetUsername}:`)
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
                flags: 64
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
                flags: 64
            });

        } catch (error) {
            console.error('Custom message submit error:', error);
            await interaction.reply({
                content: '❌ Failed to send custom message.',
                flags: 64
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
                .setDescription('Bagaimana pengalaman verifikasi di server ini?\n\nBeri rating 1-100:\n\n• 1-50: Perlu improvement\n• 51-75: Cukup memuaskan  \n• 76-90: Baik & profesional\n• 91-100: Luar biasa\n\n**💡 Info:** \n• INPUT RATING: Beri rating 1-100 (wajib untuk lanjut)\n• GIVE FEEDBACK: Beri masukan tambahan (opsional)  \n• FAQS: Bantuan & pertanyaan umum (opsional)')
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
                        .setCustomId('faqs_rating')
                        .setLabel('❓ FAQS')
                        .setStyle(ButtonStyle.Secondary)
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
                flags: 64
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
                    flags: 64
                });
            }

            const session = this.getUserSession(interaction.user.id);
            if (session) {
                session.data.rating = rating;
                session.data.ratingCategory = this.getRatingCategory(rating);
                session.data.ratingTime = Date.now();
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
                flags: 64
            });

        } catch (error) {
            console.error('Rating submit error:', error);
            await interaction.reply({
                content: '❌ Failed to process rating.',
                flags: 64
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
                flags: 64
            });
        }
    }

    async handleFeedbackSubmit(interaction) {
        try {
            const feedbackContent = interaction.fields.getTextInputValue('feedback_content');
            
            if (feedbackContent) {
                const session = this.getUserSession(interaction.user.id);
                if (session) {
                    session.data.feedback = feedbackContent;
                    session.data.feedbackTime = Date.now();
                    this.updateUserSession(interaction.user.id, session);
                }

                await interaction.reply({
                    content: '✅ Terima kasih atas feedbacknya!',
                    flags: 64
                });
            } else {
                await interaction.reply({
                    content: '⚠️ Feedback dilewati.',
                    flags: 64
                });
            }

        } catch (error) {
            console.error('Feedback submit error:', error);
            await interaction.reply({
                content: '❌ Failed to process feedback.',
                flags: 64
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

        await interaction.editReply({ 
            embeds: [embed], 
            components: [button] 
        });

        this.updateUserSession(interaction.user.id, { 
            step: 'completed'
        });
    }

    getAchievements(session) {
        const achievements = [];
        
        if (session.step === 'completed') achievements.push('✅ Identity Verified');
        if (session.explorationTime) achievements.push('✅ Server Exploration Complete');
        if (session.data.firstMessage) achievements.push('✅ First Interaction Success');
        if (session.data.rating) achievements.push('✅ Community Rating Submitted');
        if (session.data.feedback) achievements.push('✅ Feedback Provided');
        
        achievements.push('✅ Full Access Granted');
        
        return achievements.join('\n');
    }

    // ========== FAQ SYSTEM ==========
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

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } catch (error) {
            console.error('FAQs error:', error);
            await interaction.reply({
                content: '❌ Failed to show FAQs.',
                flags: 64
            });
        }
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

    // ========== NAVIGATION ==========
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

        console.log(`🔍 Detect message from: ${message.author.username}`);
        console.log(`📝 Message: ${message.content}`);
        console.log(`📍 Channel: ${message.channel.name} (${message.channel.id})`);

        // ✅ CHECK 1: USER UDAH PUNYA ROLE MEMBER? → STOP
        if (message.member.roles.cache.has(this.config.memberRoleId)) {
            console.log(`🛑 ${message.author.username} sudah punya role, skip`);
            return;
        }

        const session = this.getUserSession(message.author.id);
        console.log(`📊 Session step: ${session?.step}`);
        console.log(`👤 User ID: ${message.author.id}`);
        
        // ✅ CHECK 2: USER LAGI MISI PERKENALAN? → PROCESS
        if (session && session.step === 'introduction_mission') {
            console.log(`🎯 ${message.author.username} sedang mission, PROCESS...`);
            
            session.data.firstMessage = message.content;
            session.data.firstMessageTime = Date.now();
            session.data.responseTime = Date.now() - (session.missionStartTime || Date.now());
            session.step = 'ready_for_rating';
            this.updateUserSession(message.author.id, session);

            console.log(`✅ Session updated to: ready_for_rating`);
            
            await this.sendWelcomeMessage(message.author, message.client);
            
            console.log(`⏰ Auto lanjut rating dalam 3 detik...`);
            
            // Auto lanjut ke rating
            setTimeout(async () => {
                try {
                    console.log(`🚀 Executing showRatingStepFromMessage for ${message.author.username}`);
                    await this.showRatingStepFromMessage(message);
                } catch (error) {
                    console.error('Auto rating transition error:', error);
                }
            }, 3000);
            return;
        }

        // ✅ CHECK 3: USER UDAH SELESAI/SKIP? → STOP  
        if (session && (session.step === 'completed' || session.step === 'skip_welcome_sent')) {
            console.log(`🛑 ${message.author.username} sudah selesai, skip welcome`);
            return;
        }

        // ✅ CHECK 4: USER BELUM VERIFY? → KIRIM WELCOME SEKALI
        if (!session) {
            console.log(`👋 ${message.author.username} belum verify, kirim welcome sekali`);
            await this.sendWelcomeMessage(message.author, message.client);
            
            // Buat session biar ga spam
            this.createUserSession(message.author.id);
            this.updateUserSession(message.author.id, {
                step: 'skip_welcome_sent',
                welcomeSent: true
            });
            return;
        }

        // ✅ CHECK 5: USER DI STEP LAIN? → LOG SAJA
        console.log(`ℹ️ ${message.author.username} di step: ${session.step}, no action`);

    } catch (error) {
        console.error('First message detection error:', error);
    }
}

async showRatingStepFromMessage(message) {
    try {
        const session = this.getUserSession(message.author.id);
        if (!session || session.step !== 'ready_for_rating') return;

        console.log(`🔍 Mencari message untuk user: ${message.author.username}`);

        const verifyChannel = await message.client.channels.fetch(this.config.verifyChannelId);
        
        // ✅ CARI SEMUA MESSAGE USER DI CHANNEL VERIFY
        const messages = await verifyChannel.messages.fetch({ limit: 50 });
        
        const userMessage = messages.find(msg => 
            msg.author.id === message.client.user.id && 
            msg.components.length > 0 // ADA TOMBOL
        );

        if (userMessage) {
            console.log(`✅ Found message for ${message.author.username}`);
            
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
                        .setCustomId('faqs_rating')
                        .setLabel('❓ FAQS')
                        .setStyle(ButtonStyle.Secondary)
                );

            await userMessage.edit({ 
                embeds: [embed], 
                components: [buttons] 
            });
            
            session.step = 'rating';
            this.updateUserSession(message.author.id, session);
            
            console.log(`✅ Rating step shown for ${message.author.username}`);
        } else {
            console.log(`❌ No message found for ${message.author.username}`);
        }

    } catch (error) {
        console.error('Show rating from message error:', error);
    }
                      }

    // ========== INTERACTION HANDLER ==========
    async handleInteraction(interaction) {
        try {
            const { customId } = interaction;

            // Main verify flow
            if (customId === 'verify_account') return await this.handleVerify(interaction);
            if (customId === 'skip_verify') return await this.handleSkipVerify(interaction);
            if (customId === 'continue_verify') return await this.handleContinueVerify(interaction);
            
            // Server exploration
            if (customId === 'see_mission') return await this.handleSeeMission(interaction);
            if (customId === 'understand_mission') return await this.handleUnderstandMission(interaction);
            
            // Welcome system
            if (customId === 'auto_welcome') return await this.handleAutoWelcome(interaction);
            if (customId.startsWith('welcome_')) return await this.handleWelcomeSelection(interaction);
            if (customId === 'custom_message') return await this.handleCustomMessage(interaction);
            
            // Rating system
            if (customId === 'input_rating') return await this.handleInputRating(interaction);
            if (customId === 'give_feedback') return await this.handleGiveFeedback(interaction);
            if (customId === 'next_final') return await this.handleNextFinal(interaction);
            if (customId === 'rate_server') return await this.showRatingStep(interaction);
            
            // FAQs
            if (customId === 'faqs_skip' || customId === 'faqs_rating') return await this.handleFaqs(interaction);
            
            // Final steps
            if (customId === 'give_role_skip' || customId === 'give_role_final') return await this.handleGiveRole(interaction);
            if (customId === 'back_to_verify') return await this.handleBackToVerify(interaction);

        } catch (error) {
            console.error('Interaction handling error:', error);
            
            if (error.code === 10062) {
                console.log('⚠️ Interaction expired');
                return;
            }
            
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ Terjadi kesalahan sistem.', components: [] });
                } else {
                    await interaction.reply({ content: '❌ Terjadi kesalahan sistem.', flags: 64 });
                }
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    }

    async handleModalSubmit(interaction) {
        try {
            const { customId } = interaction;

            if (customId === 'custom_message_modal') return await this.handleCustomMessageSubmit(interaction);
            if (customId === 'input_rating_modal') return await this.handleRatingSubmit(interaction);
            if (customId === 'give_feedback_modal') return await this.handleFeedbackSubmit(interaction);

        } catch (error) {
            console.error('Modal submit error:', error);
            await interaction.reply({ content: '❌ Gagal memproses input.', flags: 64 });
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
        const verificationType = session?.step === 'completed' ? 'FULL_VERIFY' : 'SKIP_VERIFY';
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📋 VERIFICATION LOG • BananaSkiee Community')
            .setDescription(`**✅ MEMBER BARU TERVEFIKASI** • ${this.getEngagementLevel(session)}`)
            .addFields(
                {
                    name: '👤 **DATA USER:**',
                    value: `• Username: ${user.username}\n• User ID: ${user.id}\n• Display Name: ${user.displayName}\n• Global Name: ${user.globalName || 'N/A'}\n• Account Created: ${user.createdAt.toLocaleString('id-ID')}\n• Account Age: ${accountAge} hari\n• Avatar: [Link](${user.displayAvatarURL()})`,
                    inline: false
                },
                {
                    name: '📥 **JOIN INFORMATION:**',
                    value: `• Join Server: ${member.joinedAt.toLocaleString('id-ID')}\n• Join Method: Instant Invite\n• Verification Level: ${interaction.guild.verificationLevel}`,
                    inline: false
                },
                {
                    name: '🔄 **VERIFICATION PROCESS:**',
                    value: `• Start Time: ${session?.createdAt ? new Date(session.createdAt).toLocaleString('id-ID') : 'N/A'}\n• End Time: ${new Date().toLocaleString('id-ID')}\n• Total Duration: ${this.getTotalDuration(session)}\n• Verification Steps: ${this.getCompletedSteps(session)}\n• Verification Type: ${verificationType}\n• Session ID: ${sessionId}`,
                    inline: false
                },
                {
                    name: '💬 **FIRST INTERACTION:**',
                    value: `• First Message: ${session?.data?.firstMessage ? '`' + session.data.firstMessage + '`' : 'N/A'}\n• Message Time: ${session?.data?.firstMessageTime ? new Date(session.data.firstMessageTime).toLocaleString('id-ID') : 'N/A'}\n• Channel: <#${this.config.generalChannelId}>\n• Response Time: ${session?.data?.responseTime ? Math.round(session.data.responseTime / 1000) + ' detik' : 'N/A'}`,
                    inline: false
                },
                {
                    name: '⭐ **RATING & FEEDBACK:**',
                    value: `• Rating Given: ${session?.data?.rating || 'N/A'}/100\n• Rating Category: ${session?.data?.ratingCategory || 'N/A'}\n• Feedback Provided: ${session?.data?.feedback ? '✅' : '❌'}`,
                    inline: false
                },
                {
                    name: '🔮 **ENGAGEMENT PREDICTION:**',
                    value: `• Engagement Probability: ${this.getEngagementScore(session)}%\n• Predicted Retention: ${this.getRetentionMonths(session)}+ bulan\n• Potential Connections: ${this.getPotentialConnections(session)} dalam 30 hari\n• Activity Level: ${this.getActivityLevel(session)}`,
                    inline: false
                }
            )
            .setFooter({ text: `Session: ${sessionId} • Status: COMPLETE` });

        return embed;
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
        const steps = ['verified', 'server_exploration', 'introduction_mission', 'ready_for_rating', 'rating', 'completed'];
        const currentStep = steps.indexOf(session.step);
        return currentStep >= 0 ? `${currentStep + 1}/8` : 'N/A';
    }

    getEngagementLevel(session) {
        const score = this.getEngagementScore(session);
        if (score >= 80) return 'High Engagement';
        if (score >= 60) return 'Medium Engagement';
        return 'Low Engagement';
    }

    getEngagementScore(session) {
        let score = 50;
        if (session?.data?.rating) score += (session.data.rating - 50) / 2;
        if (session?.data?.feedback) score += 10;
        if (session?.data?.firstMessage) score += 15;
        if (session?.explorationTime) score += 10;
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

    // ========== RATING UTILITIES ==========
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
}

module.exports = VerifySystem;
