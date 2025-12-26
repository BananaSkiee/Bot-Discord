const { 
    ActionRowBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ContainerBuilder, 
    SectionBuilder, 
    TextDisplayBuilder, 
    MediaGalleryBuilder, 
    MediaGalleryItemBuilder, 
    ThumbnailBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags 
} = require('discord.js');

module.exports = {
    /**
     * Mengirim pesan pemicu pertama kali
     */
    async sendInitialCard(client, channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) return;

            const container = new ContainerBuilder()
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(
                        new MediaGalleryItemBuilder().setURL("https://i.supaimg.com/9c29b956-2f35-4ae8-9b21-23d9f0eae59a.png")
                    )
                )
                .addSectionComponents(
                    new SectionBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent("## 📝 Introduction Card System\nKlik tombol di bawah untuk mengisi biodata dan perkenalkan diri Anda!")
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('open_intro_modal').setLabel('Introduction Card').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('open_user_info_v2').setLabel('Info Deskripsi').setStyle(ButtonStyle.Secondary)
                    )
                );

            await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (e) { console.error("Gagal kirim initial card:", e); }
    },

    /**
     * Handler Interaksi (Tombol & Modal)
     */
    async handleIntroInteractions(interaction) {
        const { customId, user, member, client } = interaction;

        // 1. MODAL FORM
        if (customId === 'open_intro_modal') {
            const modal = new ModalBuilder().setCustomId('intro_modal_form').setTitle('Fill Your Introduction');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('NAME').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('AGE').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('gender').setLabel('GENDER').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('region').setLabel('REGION').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('hobby').setLabel('HOBBY').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // 2. INFO DESKRIPSI (COMPONENTS V2 EPHEMERAL)
        if (customId === 'open_user_info_v2' || customId === 'info_deskripsi_v2') {
            await interaction.deferReply({ ephemeral: true });
            
            const fullUser = await client.users.fetch(user.id, { force: true });
            const devices = Object.keys(member.presence?.clientStatus || { PC: 'Offline' }).join(', ') || 'Unknown';
            const roles = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.toString()).join(' ') || 'Tidak ada role';
            
            // Logika Member Ke-Berapa
            const allMembers = await interaction.guild.members.fetch();
            const joinPosition = allMembers.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp).map(m => m.id).indexOf(user.id) + 1;

            const infoContainer = new ContainerBuilder()
                .setAccentColor(fullUser.accentColor || 0x5865F2)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`**Display Name:** ${user.displayName}\n**Username:** ${user.tag}\n**User ID:** ${user.id}`),
                            new TextDisplayBuilder().setContent(`**Status:** ${member.presence?.status || 'offline'}\n**Device:** ${devices}\n**Nitro:** ${user.premiumSince ? 'Pake Nitro ✅' : 'Gak Pake Nitro ❌'}`)
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: user.displayAvatarURL() } }))
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Dibuat:** <t:${Math.floor(user.createdTimestamp/1000)}:R>\n**Join Server:** <t:${Math.floor(member.joinedTimestamp/1000)}:R>`),
                    new TextDisplayBuilder().setContent(`**Member Ke:** #${joinPosition}`),
                    new TextDisplayBuilder().setContent(`**Roles:**\n${roles}`)
                );

            if (fullUser.bannerURL()) {
                infoContainer.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(fullUser.bannerURL({ size: 1024 })))
                );
            }

            return await interaction.editReply({ components: [infoContainer], flags: MessageFlags.IsComponentsV2 });
        }

        // 3. SUBMIT MODAL (HASIL ANSI)
        if (interaction.isModalSubmit() && customId === 'intro_modal_form') {
            const n = interaction.fields.getTextInputValue('name');
            const a = interaction.fields.getTextInputValue('age');
            const g = interaction.fields.getTextInputValue('gender');
            const r = interaction.fields.getTextInputValue('region');
            const h = interaction.fields.getTextInputValue('hobby');
            const ts = Math.floor(Date.now() / 1000);

            const resultContainer = new ContainerBuilder()
                .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL("https://i.supaimg.com/9c29b956-2f35-4ae8-9b21-23d9f0eae59a.png")))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`>>> \`\`\`ansi\n\u001b[1;34;40m NAME   \u001b[0m: \u001b[1;34m${n}\n\u001b[1;32;40m AGE    \u001b[0m: \u001b[1;32m${a}\n\u001b[1;31;40m GENDER \u001b[0m: \u001b[1;31m${g}\n\u001b[1;33;40m REGION \u001b[0m: \u001b[1;33m${r}\n\u001b[1;35;40m HOBBY  \u001b[0m: \u001b[1;35m${h}\u001b[0m\n\`\`\``)
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: user.displayAvatarURL() } }))
                )
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('info_deskripsi_v2').setLabel('Info Deskripsi').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Profile').setURL(`https://discord.com/users/${user.id}`)
                    )
                )
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`© BS Community ${new Date().toLocaleDateString()} <t:${ts}:R>`));

            return await interaction.reply({ components: [resultContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
};
