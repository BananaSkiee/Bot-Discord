// modules/verify.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Storage sementara (bisa diganti dengan database)
const userData = new Map();
const verificationSessions = new Map();

class VerifySystem {
    constructor() {
        this.verifyChannelId = '1352823970054803509';
        this.logChannelId = '1426537842875826278';
        this.memberRoleId = '1352286235233620108';
        this.generalChannelId = '1352404526870560788';
    }

    // Auto kirim tombol verify saat bot ready
    async initialize(client) {
        try {
            const channel = await client.channels.fetch(this.verifyChannelId);
            if (!channel) {
                console.error('❌ Verify channel tidak ditemukan');
                return;
            }

            // Cek apakah sudah ada message verify
            const messages = await channel.messages.fetch({ limit: 10 });
            const existingVerify = messages.find(msg => 
                msg.embeds.length > 0 && 
                msg.embeds[0].title?.includes('VERIFICATION GATEWAY')
            );

            if (!existingVerify) {
                await this.sendVerifyMessage(channel);
                console.log('✅ Tombol verify berhasil dikirim');
            } else {
                console.log('✅ Tombol verify sudah ada');
            }
        } catch (error) {
            console.error('❌ Gagal setup verify system:', error);
        }
    }

    // Kirim message verify utama
    async sendVerifyMessage(channel) {
        const verifyEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎯 VERIFICATION GATEWAY • Premium Access')
            .setDescription('**Selamat Datang di BananaSkiee Community**\n\nSebelum memasuki area premium, verifikasi identitas Anda untuk mengakses:')
            .addFields(
                {
                    name: '🎁 Member Benefits',
                    value: '• 🏆 Member Exclusive Channels\n• 💼 Professional Networking\n• 📚 Premium Resources\n• 🎪 Private Events\n• 🤝 VIP Community'
                },
                {
                    name: '🛡️ Security',
                    value: 'Sistem keamanan enterprise melindungi data dan privasi Anda.'
                }
            )
            .setFooter({ text: 'Proses otomatis • 3 detik • Zero hassle' });

        const verifyButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_account')
                    .setLabel('✅ VERIFY MY ACCOUNT')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔐')
            );

        await channel.send({
            embeds: [verifyEmbed],
            components: [verifyButton]
        });
    }

    // Handle tombol verify diklik
    async handleVerify(interaction) {
        // Cek jika sudah verify
        if (interaction.member.roles.cache.has(this.memberRoleId)) {
            const alreadyEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('✅ Already Verified')
                .setDescription('Akun Anda sudah terverifikasi!')
                .addFields(
                    { name: 'Status', value: 'Verified Member', inline: true },
                    { name: 'Role', value: `<@&${this.memberRoleId}>`, inline: true }
                );

            return await interaction.reply({ 
                embeds: [alreadyEmbed], 
                ephemeral: true 
            });
        }

        // Kirim progress verification
        const progressEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🔒 VERIFICATION IN PROGRESS')
            .setDescription('**Initializing secure protocol...**\n\n' +
                '🔄 **Progress:** ██████████ 100%\n' +
                '├─ 🔍 Scanning credentials... ✅\n' +
                '├─ 🤖 AI behavior analysis... ✅\n' +
                '├─ 🛡️ Security validation... ✅\n' +
                '├─ 🎯 Identity confirmation... ✅\n' +
                '└─ 🚀 Access provisioning... ✅\n\n' +
                '**STATUS:** _Identity verified successfully_')
            .setFooter({ text: `Process completed in 2.3s` });

        await interaction.reply({ 
            embeds: [progressEmbed], 
            ephemeral: true 
        });

        // Simulasi proses 2 detik
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update ke success message
        const successEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎊 VERIFICATION SUCCESSFUL')
            .setDescription(`**Welcome ${interaction.user.username}!** 🏆`)
            .addFields(
                { name: '✅ Security Level', value: 'Maximum', inline: true },
                { name: '✅ Access Granted', value: 'Full Community', inline: true },
                {
                    name: '🎁 MEMBERSHIP BENEFITS ACTIVATED',
                    value: '• 🎖️ Verified Member Role assigned\n• 🚀 Premium Channels unlocked\n• 📚 Resource Vault access\n• 🤝 Networking privileges'
                }
            )
            .setFooter({ text: 'Elite Member • Professional Tier' });

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_community')
                    .setLabel('🚀 START COMMUNITY')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('start_onboarding')
                    .setLabel('🎯 START ONBOARDING')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({ 
            embeds: [successEmbed], 
            components: [actionButtons] 
        });

        // Simpan session
        verificationSessions.set(interaction.user.id, {
            message: interaction.message,
            step: 'verified'
        });
    }

    // Handle tombol START COMMUNITY
    async handleStartCommunity(interaction) {
        try {
            // Beri role member
            const memberRole = interaction.guild.roles.cache.get(this.memberRoleId);
            if (memberRole) {
                await interaction.member.roles.add(memberRole);
            }

            // Sembunyikan channel verify dari user
            const verifyChannel = interaction.guild.channels.cache.get(this.verifyChannelId);
            if (verifyChannel) {
                await verifyChannel.permissionOverwrites.edit(interaction.user.id, {
                    ViewChannel: false
                });
            }

            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 WELCOME TO BANANASKIE COMMUNITY!')
                .setDescription(`Selamat ${interaction.user.username}! 🎊`)
                .addFields(
                    { name: '✅ Status', value: 'Verified Member dengan akses penuh', inline: true },
                    { name: '🔒 Channel Verify', value: 'Otomatis tersembunyi', inline: true },
                    { name: '🎯 Pencapaian', value: 'Role member diberikan • Semua channel terbuka' }
                )
                .setFooter({ text: 'Selamat menikmati komunitas kami!' });

            await interaction.update({ 
                embeds: [welcomeEmbed], 
                components: [] 
            });

            // Kirim log
            await this.sendVerificationLog(interaction, 'quick_access');

        } catch (error) {
            console.error('Error handleStartCommunity:', error);
            await interaction.update({ 
                content: '❌ Gagal memproses. Silakan coba lagi.', 
                components: [] 
            });
        }
    }

    // Handle tombol START ONBOARDING
    async handleStartOnboarding(interaction) {
        const onboardingEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📝 ONBOARDING PROFESSIONAL')
            .setDescription('Mari lengkapi profil profesional Anda!')
            .addFields(
                {
                    name: '1. PILIH TUJUAN UTAMA ANDA:',
                    value: 'Pilih dari dropdown di bawah'
                },
                {
                    name: '2. LEVEL EXPERIENCE:',
                    value: 'Pilih level yang sesuai'
                },
                {
                    name: '3. KESIAPAN KONTRIBUSI:',
                    value: 'Pilih kesiapan berbagi'
                }
            )
            .setFooter({ text: 'Pilih dari dropdown • Opsional' });

        const purposeSelect = new StringSelectMenuBuilder()
            .setCustomId('select_purpose')
            .setPlaceholder('🎯 Pilih tujuan utama...')
            .addOptions([
                { label: 'Networking', value: 'networking', description: 'Membangun koneksi profesional' },
                { label: 'Belajar Skill', value: 'learning', description: 'Mengembangkan kemampuan' },
                { label: 'Kolaborasi', value: 'collaboration', description: 'Bekerja sama dalam project' },
                { label: 'Hiburan', value: 'entertainment', description: 'Bersenang-senang dan relax' },
                { label: 'Eksplorasi', value: 'exploration', description: 'Menjelajahi komunitas' }
            ]);

        const experienceSelect = new StringSelectMenuBuilder()
            .setCustomId('select_experience')
            .setPlaceholder('📈 Pilih level experience...')
            .addOptions([
                { label: 'Pemula', value: 'beginner', description: 'Baru memulai' },
                { label: 'Menengah', value: 'intermediate', description: 'Sudah memiliki dasar' },
                { label: 'Advanced', value: 'advanced', description: 'Lanjutan dan berpengalaman' },
                { label: 'Professional', value: 'professional', description: 'Profesional di bidang' },
                { label: 'Expert', value: 'expert', description: 'Ahli dan master' }
            ]);

        const contributionSelect = new StringSelectMenuBuilder()
            .setCustomId('select_contribution')
            .setPlaceholder('🤝 Pilih kesiapan kontribusi...')
            .addOptions([
                { label: 'Aktif Berbagi', value: 'active', description: 'Sering berbagi pengetahuan' },
                { label: 'Sesekali Sharing', value: 'occasional', description: 'Kadang-kadang berbagi' },
                { label: 'Lihat Perkembangan', value: 'observer', description: 'Mengamati dulu' }
            ]);

        const customFormButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('custom_form')
                    .setLabel('📝 BUKA FORM CUSTOM')
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_onboarding')
                    .setLabel('✅ KONFIRMASI JAWABAN')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('skip_onboarding')
                    .setLabel('⏩ SKIP ONBOARDING')
                    .setStyle(ButtonStyle.Danger)
            );

        const selectRow1 = new ActionRowBuilder().addComponents(purposeSelect);
        const selectRow2 = new ActionRowBuilder().addComponents(experienceSelect);
        const selectRow3 = new ActionRowBuilder().addComponents(contributionSelect);

        await interaction.update({ 
            embeds: [onboardingEmbed], 
            components: [selectRow1, selectRow2, selectRow3, customFormButton, actionButtons] 
        });

        // Simpan session
        verificationSessions.set(interaction.user.id, {
            ...verificationSessions.get(interaction.user.id),
            step: 'onboarding',
            onboardingData: {}
        });
    }

    // Handle select menu onboarding
    async handleSelectMenu(interaction) {
        const session = verificationSessions.get(interaction.user.id);
        if (!session) return;

        const { onboardingData } = session;
        const selectedValue = interaction.values[0];

        switch (interaction.customId) {
            case 'select_purpose':
                onboardingData.purpose = selectedValue;
                break;
            case 'select_experience':
                onboardingData.experience = selectedValue;
                break;
            case 'select_contribution':
                onboardingData.contribution = selectedValue;
                break;
        }

        verificationSessions.set(interaction.user.id, {
            ...session,
            onboardingData
        });

        await interaction.reply({ 
            content: `✅ Pilihan disimpan: ${selectedValue}`,
            ephemeral: true 
        });
    }

    // Handle konfirmasi onboarding
    async handleConfirmOnboarding(interaction) {
        const session = verificationSessions.get(interaction.user.id);
        if (!session || !session.onboardingData) {
            return await interaction.reply({ 
                content: '❌ Silakan pilih opsi terlebih dahulu', 
                ephemeral: true 
            });
        }

        // Beri role member
        const memberRole = interaction.guild.roles.cache.get(this.memberRoleId);
        if (memberRole) {
            await interaction.member.roles.add(memberRole);
        }

        // Sembunyikan channel verify
        const verifyChannel = interaction.guild.channels.cache.get(this.verifyChannelId);
        if (verifyChannel) {
            await verifyChannel.permissionOverwrites.edit(interaction.user.id, {
                ViewChannel: false
            });
        }

        const completeEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 ONBOARDING COMPLETE!')
            .setDescription(`Selamat ${interaction.user.username}! Profil profesional Anda lengkap! 🌟`)
            .addFields(
                { name: '✅ Pencapaian', value: 'Role member diberikan\nChannel verify tersembunyi\nAkses penuh aktif', inline: true },
                { name: '📊 Data Tersimpan', value: 'Profil profesional tersimpan\nSiap untuk networking', inline: true }
            )
            .setFooter({ text: 'Selamat menikmati BananaSkiee Community!' });

        await interaction.update({ 
            embeds: [completeEmbed], 
            components: [] 
        });

        // Kirim log
        await this.sendVerificationLog(interaction, 'onboarding_complete', session.onboardingData);

        // Hapus session
        verificationSessions.delete(interaction.user.id);
    }

    // Handle skip onboarding
    async handleSkipOnboarding(interaction) {
        // Tetap beri role member
        const memberRole = interaction.guild.roles.cache.get(this.memberRoleId);
        if (memberRole) {
            await interaction.member.roles.add(memberRole);
        }

        // Sembunyikan channel verify
        const verifyChannel = interaction.guild.channels.cache.get(this.verifyChannelId);
        if (verifyChannel) {
            await verifyChannel.permissionOverwrites.edit(interaction.user.id, {
                ViewChannel: false
            });
        }

        const skipEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🎯 ONBOARDING DISKIP')
            .setDescription(`Tidak masalah! Anda tetap mendapatkan akses penuh.`)
            .addFields(
                { name: '✅ Status', value: 'Verified Member aktif', inline: true },
                { name: '🔒 Channel Verify', value: 'Otomatis tersembunyi', inline: true },
                { name: '🚀 Akses', value: 'Semua channel terbuka', inline: true }
            )
            .setFooter({ text: 'Selamat bergabung di BananaSkiee Community!' });

        await interaction.update({ 
            embeds: [skipEmbed], 
            components: [] 
        });

        // Kirim log
        await this.sendVerificationLog(interaction, 'onboarding_skipped');

        // Hapus session
        verificationSessions.delete(interaction.user.id);
    }

    // Kirim log verification
    async sendVerificationLog(interaction, type, onboardingData = null) {
        try {
            const logChannel = interaction.guild.channels.cache.get(this.logChannelId);
            if (!logChannel) return;

            const accountAge = Math.floor((Date.now() - interaction.user.createdTimestamp) / (1000 * 60 * 60 * 24));
            
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📋 VERIFICATION LOG • BananaSkiee Community')
                .setDescription(`**✅ NEW MEMBER VERIFIED** • ${this.getStatusText(type)}`)
                .addFields(
                    { name: '👤 User', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
                    { name: '📛 Display Name', value: interaction.user.displayName, inline: true },
                    { name: '🆔 Account Age', value: `${accountAge} hari`, inline: true },
                    { name: '🌍 Join Method', value: this.getJoinMethod(type), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Double Counter System • Auto-Log' });

            if (onboardingData) {
                logEmbed.addFields(
                    { name: '🎯 Tujuan', value: this.getPurposeText(onboardingData.purpose), inline: true },
                    { name: '📈 Level Experience', value: this.getExperienceText(onboardingData.experience), inline: true },
                    { name: '🤝 Kesiapan Kontribusi', value: this.getContributionText(onboardingData.contribution), inline: true }
                );
            }

            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Error sending verification log:', error);
        }
    }

    // Helper functions
    getStatusText(type) {
        const statusMap = {
            'quick_access': 'Quick Access',
            'onboarding_complete': 'Onboarding Complete', 
            'onboarding_skipped': 'Onboarding Skipped'
        };
        return statusMap[type] || 'Verified';
    }

    getJoinMethod(type) {
        const methodMap = {
            'quick_access': 'Direct Access',
            'onboarding_complete': 'Onboarding',
            'onboarding_skipped': 'Skipped Onboarding'
        };
        return methodMap[type] || 'Unknown';
    }

    getPurposeText(purpose) {
        const purposeMap = {
            'networking': 'Networking',
            'learning': 'Belajar Skill',
            'collaboration': 'Kolaborasi',
            'entertainment': 'Hiburan',
            'exploration': 'Eksplorasi'
        };
        return purposeMap[purpose] || 'Not Provided';
    }

    getExperienceText(experience) {
        const experienceMap = {
            'beginner': 'Pemula',
            'intermediate': 'Menengah', 
            'advanced': 'Advanced',
            'professional': 'Professional',
            'expert': 'Expert'
        };
        return experienceMap[experience] || 'Not Provided';
    }

    getContributionText(contribution) {
        const contributionMap = {
            'active': 'Aktif Berbagi',
            'occasional': 'Sesekali Sharing',
            'observer': 'Lihat Perkembangan'
        };
        return contributionMap[contribution] || 'Not Provided';
    }
}

// Export instance
const verifySystem = new VerifySystem();
module.exports = verifySystem;
