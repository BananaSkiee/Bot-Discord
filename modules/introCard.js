const { 
    ActionRowBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    Events,
    ComponentType 
} = require('discord.js');

module.exports = {
    // Fungsi untuk mengirim pesan Intro Card pertama kali (Sekali saja)
    async sendInitialCard(client, channelId) {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return console.error("Channel tidak ditemukan!");

        const timestampNow = Math.floor(Date.now() / 1000);
        const dateString = new Date().toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
        }).toUpperCase();

        const payload = {
            flags: 32768, // Ephemeral jika diinginkan, tapi di sini untuk publik
            components: [
                {
                    type: 17, // Section
                    components: [
                        {
                            type: 12, // Media Slot
                            items: [{
                                media: { url: "https://i.supaimg.com/9c29b956-2f35-4ae8-9b21-23d9f0eae59a.png" },
                                description: "Introduction Card",
                                spoiler: false
                            }]
                        },
                        { type: 14, spacing: 1 }, // Divider
                        {
                            type: 9, // Container
                            components: [{
                                type: 10, // Text
                                content: ">>> ```ansi\n\u001b[0m\u001b[1;3;34;40m NAME   \u001b[0m: \u001b[1;34mBelum Diisi\n\u001b[0m\u001b[1;3;32;40m AGE    \u001b[0m: \u001b[1;32mBelum Diisi\n\u001b[0m\u001b[1;3;31;40m GENDER \u001b[0m: \u001b[1;31mBelum Diisi\n\u001b[0m\u001b[1;3;33;40m REGION \u001b[0m: \u001b[1;33mBelum Diisi\n\u001b[0m\u001b[1;3;35;40m HOBBY  \u001b[0m: \u001b[1;35mBelum Diisi\n```"
                            }],
                            accessory: {
                                type: 11, // Image
                                media: { url: client.user.displayAvatarURL() }
                            }
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    style: 2, type: 2, label: "Introduction Card",
                                    custom_id: "open_intro_modal"
                                },
                                {
                                    style: 2, type: 2, label: "Info Deskripsi",
                                    custom_id: "open_user_info"
                                },
                                {
                                    type: 2, style: 5, label: "Profile",
                                    url: `https://discord.com/users/${client.user.id}`
                                }
                            ]
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 10,
                            content: `© BS Community ${dateString} <t:${timestampNow}:R>`
                        }
                    ]
                }
            ]
        };

        await channel.send(payload);
    },

    // Handler untuk Interaksi
    async handleInteraction(interaction) {
        // 1. Handling Tombol "Introduction Card" (Modal/Form)
        if (interaction.customId === 'open_intro_modal') {
            const modal = new ModalBuilder()
                .setCustomId('intro_modal_form')
                .setTitle('Fill Your Introduction');

            const fields = [
                { id: 'name', label: 'NAME', style: TextInputStyle.Short },
                { id: 'age', label: 'AGE', style: TextInputStyle.Short },
                { id: 'gender', label: 'GENDER', style: TextInputStyle.Short },
                { id: 'region', label: 'REGION', style: TextInputStyle.Short },
                { id: 'hobby', label: 'HOBBY', style: TextInputStyle.Paragraph }
            ].map(f => new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(f.style).setRequired(true)
            ));

            modal.addComponents(...fields);
            await interaction.showModal(modal);
        }

        // 2. Handling Tombol "Info Deskripsi"
        if (interaction.customId === 'open_user_info') {
            const { user, member, guild } = interaction;
            const joinDate = Math.floor(member.joinedTimestamp / 1000);
            const createDate = Math.floor(user.createdTimestamp / 1000);
            const roles = member.roles.cache.map(r => r.toString()).join(', ');
            
            // Logika Status & Client (Perlu Intent Presences)
            const status = member.presence?.status || 'offline';
            const devices = member.presence?.clientStatus ? Object.keys(member.presence.clientStatus).join(', ') : 'Unknown';

            const embed = {
                title: `User Information - ${user.username}`,
                thumbnail: { url: user.displayAvatarURL() },
                image: { url: user.bannerURL({ size: 1024 }) || '' },
                fields: [
                    { name: 'Display Name', value: user.displayName, inline: true },
                    { name: 'User ID', value: user.id, inline: true },
                    { name: 'Status', value: status.toUpperCase(), inline: true },
                    { name: 'Client', value: devices || 'N/A', inline: true },
                    { name: 'Created At', value: `<t:${createDate}:D> (<t:${createDate}:R>)`, inline: false },
                    { name: 'Joined Server', value: `<t:${joinDate}:D> (<t:${joinDate}:R>)`, inline: false },
                    { name: 'Roles', value: roles || 'No Roles', inline: false }
                ],
                color: user.accentColor || 0x5865F2,
                footer: { text: `Requested by ${user.tag}` }
            };

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // 3. Handling Submit Modal
        if (interaction.isModalSubmit() && interaction.customId === 'intro_modal_form') {
            const name = interaction.fields.getTextInputValue('name');
            const age = interaction.fields.getTextInputValue('age');
            const gender = interaction.fields.getTextInputValue('gender');
            const region = interaction.fields.getTextInputValue('region');
            const hobby = interaction.fields.getTextInputValue('hobby');

            const timestampNow = Math.floor(Date.now() / 1000);
            const dateString = new Date().toLocaleDateString('en-US', { 
                month: 'long', day: 'numeric', year: 'numeric' 
            }).toUpperCase();

            // Update Card dengan data baru
            const updatedPayload = {
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 12,
                            items: [{ media: { url: "https://i.supaimg.com/9c29b956-2f35-4ae8-9b21-23d9f0eae59a.png" }, description: "Introduction Card" }]
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `>>> \`\`\`ansi\n\u001b[0m\u001b[1;3;34;40m NAME   \u001b[0m: \u001b[1;34m${name}\n\u001b[0m\u001b[1;3;32;40m AGE    \u001b[0m: \u001b[1;32m${age}\n\u001b[0m\u001b[1;3;31;40m GENDER \u001b[0m: \u001b[1;31m${gender}\n\u001b[0m\u001b[1;3;33;40m REGION \u001b[0m: \u001b[1;33m${region}\n\u001b[0m\u001b[1;3;35;40m HOBBY  \u001b[0m: \u001b[1;35m${hobby}\u001b\n\`\`\``
                            }],
                            accessory: { type: 11, media: { url: interaction.user.displayAvatarURL() } }
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 1,
                            components: [
                                { style: 2, type: 2, label: "Introduction Card", custom_id: "open_intro_modal" },
                                { style: 2, type: 2, label: "Info Deskripsi", custom_id: "open_user_info" },
                                { type: 2, style: 5, label: "Profile", url: `https://discord.com/users/${interaction.user.id}` }
                            ]
                        },
                        { type: 14, spacing: 1 },
                        { type: 10, content: `© BS Community ${dateString} <t:${timestampNow}:R>` }
                    ]
                }]
            };

            await interaction.reply(updatedPayload);
        }
    }
};
