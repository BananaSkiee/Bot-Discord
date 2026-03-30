/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║           AKIRA BOT - BIO MONITOR SYSTEM v1.0                  ║
 * ║         Auto-detect Bio | Invite Validation | Violation Handler  ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * FLOW:
 * Detect Bio (interval/command) → Validasi Link → Grant/Revoke V2
 * Violation: Cabut V2 → Kasih NV2 (V1 & V3 tetap aman)
 */

const { EmbedBuilder } = require('discord.js');

class BioMonitorSystem {
    constructor() {
        // ROLE IDs
        this.V1 = '1352286235233620108';   // Verify 1 (Aman, jangan dihapus)
        this.V2 = '1444248605761470595';   // Verify 2 (Target utama)
        this.V3 = '1444248590305202247';   // Verify 3 (Aman, jangan dihapus)
        this.NV2 = '1444248606579097640';  // Non-Verify 2 (Fallback)

        // CONFIG
        this.INVITE_CODE = process.env.INVITE_CODE || 'bananaskiee'; // Link server lu
        this.CHECK_INTERVAL = 5 * 60 * 1000; // Cek tiap 5 menit
        this.CHANNEL_VERIFY = '1487876267339681813';
        this.LOG_CHANNEL = '1352800131933802547';

        this.client = null;
        this.monitoring = false;
    }

    async init(client) {
        this.client = client;
        
        // Slash command handler
        client.on('interactionCreate', async (i) => {
            if (!i.isCommand()) return;
            if (i.commandName === 'verifybio') await this.cmdVerify(i);
        });

        // Button handler
        client.on('interactionCreate', async (i) => {
            if (!i.isButton()) return;
            if (i.customId === 'check_bio') await this.btnCheck(i);
        });

        // Start background monitor
        this.startMonitor();
        
        console.log('✅ BioMonitorSystem: Invite validation active');
        console.log(`🎯 Target invite: ${this.INVITE_CODE}`);
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * COMMAND: /verifybio (Manual check)
     * ═══════════════════════════════════════════════════════════
     */
    async cmdVerify(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const member = interaction.member;
        const bio = await this.fetchBio(member.id);
        
        // Cek apakah punya V1 (prasyarat)
        if (!member.roles.cache.has(this.V1)) {
            return interaction.editReply('❌ Kamu harus verifikasi tahap 1 dulu!');
        }

        const hasInvite = this.validateBio(bio);

        // CASE: Bio valid, belum punya V2 → Grant V2
        if (hasInvite && !member.roles.cache.has(this.V2)) {
            await this.grantV2(member, bio);
            return interaction.editReply({
                content: `✅ **Verifikasi Bio Berhasil!**\nBio: \`${bio}\`\nV2 diberikan, NV2 dihapus.`
            });
        }

        // CASE: Bio valid, sudah punya V2 → Sudah verified
        if (hasInvite && member.roles.cache.has(this.V2)) {
            return interaction.editReply('✅ Kamu sudah terverifikasi bio!');
        }

        // CASE: Bio tidak valid, punya V2 → Revoke (Violation!)
        if (!hasInvite && member.roles.cache.has(this.V2)) {
            await this.revokeV2(member, 'Link invite dicabut dari bio');
            return interaction.editReply({
                content: `⚠️ **Violation Detected!**\nBio tidak mengandung link invite.\nV2 dicabut, NV2 diberikan.`
            });
        }

        // CASE: Bio tidak valid, belum punya V2 → Gagal
        return interaction.editReply({
            content: `❌ **Verifikasi Gagal!**\nBio: \`${bio || '(kosong)'}\`\nHarus mengandung: \`${this.INVITE_CODE}\``
        });
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * BACKGROUND MONITOR (Auto-check periodic)
     * ═══════════════════════════════════════════════════════════
     */
    startMonitor() {
        setInterval(async () => {
            const guild = this.client.guilds.cache.get(process.env.GUILD_ID);
            if (!guild) return;

            // Cek semua member yang punya V2 (detect violation)
            const membersWithV2 = guild.members.cache.filter(m => 
                m.roles.cache.has(this.V2)
            );

            for (const [, member] of membersWithV2) {
                const bio = await this.fetchBio(member.id);
                const hasInvite = this.validateBio(bio);

                // Violation: Punya V2 tapi bio tidak valid
                if (!hasInvite) {
                    console.log(`🚨 Violation: ${member.user.tag} removed invite from bio`);
                    await this.revokeV2(member, 'Auto-detect: Link invite hilang dari bio');
                }
            }

            // Cek semua member yang punya NV2 (auto-grant jika bio valid)
            const membersWithNV2 = guild.members.cache.filter(m => 
                m.roles.cache.has(this.NV2) && 
                m.roles.cache.has(this.V1) && // Harus punya V1
                !m.roles.cache.has(this.V2)   // Belum punya V2
            );

            for (const [, member] of membersWithNV2) {
                const bio = await this.fetchBio(member.id);
                const hasInvite = this.validateBio(bio);

                if (hasInvite) {
                    console.log(`✅ Auto-grant: ${member.user.tag} bio valid`);
                    await this.grantV2(member, bio);
                }
            }

        }, this.CHECK_INTERVAL);
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * CORE FUNCTIONS
     * ═══════════════════════════════════════════════════════════
     */

    async fetchBio(userId) {
        try {
            // Method 1: Discord.js user fetch
            const user = await this.client.users.fetch(userId, { force: true });
            return user.bio || null;
        } catch (e) {
            // Method 2: OAuth2 API (fallback)
            return null;
        }
    }

    validateBio(bio) {
        if (!bio) return false;
        const lowerBio = bio.toLowerCase();
        const inviteVariations = [
            this.INVITE_CODE.toLowerCase(),
            `discord.gg/${this.INVITE_CODE.toLowerCase()}`,
            `discord.com/invite/${this.INVITE_CODE.toLowerCase()}`
        ];
        return inviteVariations.some(v => lowerBio.includes(v));
    }

    async grantV2(member, bio) {
        try {
            // Hapus NV2
            if (member.roles.cache.has(this.NV2)) {
                await member.roles.remove(this.NV2);
            }

            // Kasih V2
            await member.roles.add(this.V2);

            // Log
            await this.log(`✅ **V2 Granted**: ${member.user.tag}\nBio: \`${bio}\``);
            
            // DM
            await member.send({
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Verifikasi Bio Berhasil!')
                    .setDescription('Kamu sekarang punya akses **Hosting**!')
                ]
            }).catch(() => {});

        } catch (e) {
            console.error('Grant V2 error:', e);
        }
    }

    async revokeV2(member, reason) {
        try {
            // ⚠️ PENTING: Cek dulu apakah punya V3
            // Jika punya V3, tetap hapus V2 (sesuai request), tapi log khusus
            const hasV3 = member.roles.cache.has(this.V3);
            const hasV1 = member.roles.cache.has(this.V1);

            // Cabut V2
            if (member.roles.cache.has(this.V2)) {
                await member.roles.remove(this.V2);
            }

            // Kasih NV2
            if (!member.roles.cache.has(this.NV2)) {
                await member.roles.add(this.NV2);
            }

            // Log
            const v3Warning = hasV3 ? '\n⚠️ **Note**: User punya V3, V2 tetap dicabut!' : '';
            await this.log(`🚨 **V2 Revoked**: ${member.user.tag}\nReason: ${reason}${v3Warning}`);

            // DM
            let dmText = `⚠️ **Verifikasi Bio Dicabut!**\nReason: ${reason}\n\nKamu kehilangan akses **Hosting**.\nPasang kembali link invite di bio untuk restore.`;
            if (hasV3) dmText += '\n\n✅ **V3 kamu tetap aman**, hanya V2 yang dicabut.';

            await member.send({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⚠️ Verifikasi Bio Dicabut')
                    .setDescription(dmText)
                ]
            }).catch(() => {});

        } catch (e) {
            console.error('Revoke V2 error:', e);
        }
    }

    async log(message) {
        const ch = this.client.channels.cache.get(this.LOG_CHANNEL);
        if (ch) await ch.send(message).catch(() => {});
    }

    /**
     * Setup pesan di channel verify (dengan tombol)
     */
    async setupMessage(channel) {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🔐 Verifikasi Bio (Tahap 2)')
            .setDescription(
                `**Syarat**: Pasang \`discord.gg/${this.INVITE_CODE}\` di bio Discord kamu.\n\n` +
                `**Cara**:\n1. Settings → Profile → About Me\n2. Tambah link invite\n3. Klik **Cek Verifikasi** di bawah\n\n` +
                `⚠️ Bot cek otomatis tiap 5 menit. Jika link dicabut, V2 akan dicabut!`
            );

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('check_bio')
                .setLabel('🔍 Cek Verifikasi')
                .setStyle(ButtonStyle.Success)
        );

        await channel.send({ embeds: [embed], components: [row] });
    }

    async btnCheck(interaction) {
        await this.cmdVerify(interaction);
    }
}

module.exports = new BioMonitorSystem();
