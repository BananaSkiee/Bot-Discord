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
    // FUNGSI PENGIRIM PESAN AWAL (TRIGGER)
    async sendInitialCard(client, channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) return console.error("❌ Channel tidak ditemukan!");

            // Gunakan Embed Standar untuk Trigger agar pasti masuk (Anti-Error)
            const embed = {
                title: "📝 Introduction Card System",
                description: "Klik tombol di bawah untuk mengisi biodata dan perkenalkan diri Anda di komunitas!",
                color: 0x5865F2,
                image: { url: "https://i.supaimg.com/9c29b956-2f35-4ae8-9b21-23d9f0eae59a.png" },
                footer: { text: "BananaSkiee Community Intro System" }
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_intro_modal').setLabel('Introduction Card').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('open_user_info_v2').setLabel('Info Deskripsi').setStyle(ButtonStyle.Secondary)
            );

            await channel.send({ embeds: [embed], components: [row] });
            console.log("✅ Pesan Trigger Intro Card berhasil dikirim ke channel.");
        } catch (e) { 
            console.error("❌ Gagal kirim initial card:", e.message); 
        }
    },

    // HANDLER INTERAKSI (MODAL & TOMBOL)
    async handleIntroInteractions(interaction) {
        const { customId, user, member, client } = interaction;

        // --- 1. MEMBUKA FORM (MODAL) ---
        if (customId === 'open_intro_modal') {
            const modal = new ModalBuilder().setCustomId('intro_modal_form').setTitle('Form Perkenalan');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('NAMA').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('UMUR').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('gender').setLabel('GENDER').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('region').setLabel('KOTA/ASAL').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('hobby').setLabel('HOBBY').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // --- 2. HASIL SUBMIT FORM (ANSI CARD V2) ---
        if (interaction.isModalSubmit() && customId === 'intro_modal_form') {
            const [n, a, g, r, h] = ['name','age','gender','region','hobby'].map(id => interaction.fields.getTextInputValue(id));
            
            const result = new ContainerBuilder()
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
                        new ButtonBuilder().setCustomId('open_user_info_v2').setLabel('Cek Profil Detail').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Buka Profile').setURL(`https://discord.com/users/${user.id}`)
                    )
                )
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`© BS Community • <t:${Math.floor(Date.now()/1000)}:R>`));

            return await interaction.reply({ components: [result], flags: MessageFlags.IsComponentsV2 });
        }

        // --- 3. INFO DESKRIPSI (DETAIL USER V2) ---
        if (customId === 'open_user_info_v2' || customId === 'info_deskripsi_v2') {
            await interaction.deferReply({ ephemeral: true });
            const fullUser = await client.users.fetch(user.id, { force: true });
            
            const info = new ContainerBuilder()
                .setAccentColor(fullUser.accentColor || 0x5865F2)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`**User:** ${user.tag}\n**ID:** ${user.id}\n**Join:** <t:${Math.floor(member.joinedTimestamp/1000)}:R>`)
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: user.displayAvatarURL() } }))
                );

            if (fullUser.bannerURL()) {
                info.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(fullUser.bannerURL({ size: 1024 }))));
            }

            return await interaction.editReply({ components: [info], flags: MessageFlags.IsComponentsV2 });
        }
    }
};
