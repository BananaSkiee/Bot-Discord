const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class BioMonitorSystem {
    constructor() {
        this.VERIFY_CHANNEL = '1487876267339681813';
        this.INVITE_CODE = process.env.REQUIRED_BIO_LINK || 'https://discord.gg/aTEGb6SaFQ';
        this.client = null;
    }

    async init(client) {
        this.client = client;
        
        // Button handler
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            
            if (interaction.customId === 'check_bio') {
                await this.handleVerifyButton(interaction);
            }
        });

        console.log('✅ BioMonitorSystem: Button handler active');
    }

    /**
     * Handle tombol verifikasi
     */
    async handleVerifyButton(interaction) {
        try {
            const member = interaction.member;
            const guild = interaction.guild;

            // Build verify URL
            const verifyUrl = `https://parallel-helaine-bananaskiee-701c062c.koyeb.app/verify?` +
                `userId=${member.id}&` +
                `guildId=${guild.id}`;

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🔐 Verifikasi Bio (Tahap 2)')
                .setDescription(
                    '**Langkah verifikasi:**\n\n' +
                    '1️⃣ Klik tombol **Login Discord** di bawah\n' +
                    '2️⃣ Login dengan akun Discord kamu\n' +
                    '3️⃣ Klik **Authorize** (aman, cuma baca profile)\n' +
                    '4️⃣ Sistem otomatis cek bio kamu\n\n' +
                    `⚠️ Pastikan bio kamu mengandung:\n\`${this.INVITE_CODE}\``
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('🔓 Login Discord')
                    .setURL(verifyUrl)
                    .setStyle(ButtonStyle.Link)
            );

            // Reply langsung (jangan defer)
            await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: 64 // Ephemeral
            });

        } catch (error) {
            console.error('❌ Button handler error:', error);
            try {
                await interaction.reply({
                    content: '❌ Terjadi kesalahan. Coba lagi.',
                    flags: 64
                });
            } catch (e) {
                // Already replied
            }
        }
    }

    /**
     * Setup pesan di channel (dipanggil setelah cleanup)
     */
    async setupMessage(channel) {
        // Safety: hapus pesan bot lama
        try {
            const messages = await channel.messages.fetch({ limit: 10 });
            const botMessages = messages.filter(m => m.author.id === this.client.user.id);
            
            for (const [, msg] of botMessages) {
                await msg.delete().catch(() => {});
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (e) {
            // Ignore
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🔐 Verifikasi Bio (Tahap 2)')
            .setDescription(
                '**Syarat**: Pasang link server di bio Discord kamu.\n\n' +
                `**Link yang harus dipasang:**\n\`\`\`\n${this.INVITE_CODE}\n\`\`\`\n\n` +
                '**Cara Verifikasi:**\n' +
                '1️⃣ Settings Discord → **Profile** → **About Me**\n' +
                '2️⃣ Tambahkan link di atas ke bio\n' +
                '3️⃣ Klik tombol **Verifikasi Bio** di bawah\n' +
                '4️⃣ Login Discord → **Authorize**\n' +
                '5️⃣ Selesai! Role otomatis diberikan\n\n' +
                '⚠️ **Catatan**: Bot hanya membaca bio, **tidak bisa** edit profile kamu.'
            )
            .setFooter({ text: 'Akira Bot • Auto-refresh saat restart' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('check_bio')
                .setLabel('🔍 Verifikasi Bio')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log('✅ Embed verifikasi bio dikirim');
    }
}

module.exports = new BioMonitorSystem();
