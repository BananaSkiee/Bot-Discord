const { 
    ActionRowBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    MessageFlags 
} = require('discord.js');

module.exports = {
    // 1. Fungsi Kirim Pesan Awal (Hanya Sekali)
    async sendInitialCard(client, channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) return;

            // Format Tanggal: JANUARY - 27 - 2025
            const now = new Date();
            const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
            const day = String(now.getDate()).padStart(2, '0');
            const year = now.getFullYear();
            const dateString = `${month} - ${day} - ${year}`;

            // Timestamp saat ini (agar muncul "just now" dan bertambah "1 second ago", dst)
            const ts = Math.floor(Date.now() / 1000);

            const payload = {
                components: [{
                    type: 17, 
                    components: [
                        { type: 12, items: [{ media: { url: "https://i.supaimg.com/9c29b956-2f35-4ae8-9b21-23d9f0eae59a.png" }, description: "Introduction Card" }] },
                        { type: 14, spacing: 1 }, 
                        {
                            type: 9, 
                            components: [{
                                type: 10, 
                                content: ">>> ```ansi\n\u001b[0m\u001b[1;3;34;40m NAME   \u001b[0m: \u001b[1;34mBelum Diisi\n\u001b[0m\u001b[1;3;32;40m AGE    \u001b[0m: \u001b[1;32mBelum Diisi\n\u001b[0m\u001b[1;3;31;40m GENDER \u001b[0m: \u001b[1;31mBelum Diisi\n\u001b[0m\u001b[1;3;33;40m REGION \u001b[0m: \u001b[1;33mBelum Diisi\n\u001b[0m\u001b[1;3;35;40m HOBBY  \u001b[0m: \u001b[1;35mBelum Diisi\u001b\n```"
                            }],
                            accessory: { type: 11, media: { url: client.user.displayAvatarURL() } }
                        },
                        { type: 14, spacing: 1 }, 
                        {
                            type: 1, 
                            components: [
                                { type: 2, style: 2, label: "Introduction Card", custom_id: "open_intro_modal" },
                                { type: 2, style: 2, label: "Info Deskripsi", custom_id: "open_user_info_v2" },
                                { type: 2, style: 5, label: "Profile", url: `https://discord.com/users/${client.user.id}` }
                            ]
                        },
                        { type: 14, spacing: 1 }, 
                        { type: 10, content: `© BS Community ${dateString} <t:${ts}:R>` }
                    ]
                }]
            };

            await channel.send({ ...payload, flags: MessageFlags.IsComponentsV2 });
            console.log("✅ Intro Card Initial Sent.");
        } catch (e) { console.error("Error Initial Card:", e); }
    },

    async handleIntroInteractions(interaction) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;
        const { customId, user, member, guild, client } = interaction;

        // --- A. MODAL FORM ---
        if (customId === 'open_intro_modal') {
            const modal = new ModalBuilder().setCustomId('intro_modal_form').setTitle('Introduction Card Form');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f1').setLabel('NAME').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f2').setLabel('AGE').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f3').setLabel('GENDER').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f4').setLabel('REGION').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f5').setLabel('HOBBY').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // --- B. SUBMIT FORM ---
        if (interaction.isModalSubmit() && customId === 'intro_modal_form') {
            const [n, a, g, r, h] = ['f1','f2','f3','f4','f5'].map(id => interaction.fields.getTextInputValue(id));
            
            // Format Tanggal Update
            const now = new Date();
            const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
            const dateStr = `${month} - ${String(now.getDate()).padStart(2, '0')} - ${now.getFullYear()}`;
            const ts = Math.floor(Date.now() / 1000);

            const resultPayload = {
                components: [{
                    type: 17,
                    components: [
                        { type: 12, items: [{ media: { url: "https://i.supaimg.com/9c29b956-2f35-4ae8-9b21-23d9f0eae59a.png" } }] },
                        { type: 14, spacing: 1 },
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `>>> \`\`\`ansi\n\u001b[0m\u001b[1;3;34;40m NAME   \u001b[0m: \u001b[1;34m${n}\n\u001b[0m\u001b[1;3;32;40m AGE    \u001b[0m: \u001b[1;32m${a}\n\u001b[0m\u001b[1;3;31;40m GENDER \u001b[0m: \u001b[1;31m${g}\n\u001b[0m\u001b[1;3;33;40m REGION \u001b[0m: \u001b[1;33m${r}\n\u001b[0m\u001b[1;3;35;40m HOBBY  \u001b[0m: \u001b[1;35m${h}\u001b\n\`\`\``
                            }],
                            accessory: { type: 11, media: { url: user.displayAvatarURL() } }
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 1,
                            components: [
                                { type: 2, style: 2, label: "Introduction Card", custom_id: "open_intro_modal" },
                                { type: 2, style: 2, label: "Info Deskripsi", custom_id: "open_user_info_v2" },
                                { type: 2, style: 5, label: "Profile", url: `https://discord.com/users/${user.id}` }
                            ]
                        },
                        { type: 14, spacing: 1 },
                        { type: 10, content: `© BS Community ${dateStr} <t:${ts}:R>` }
                    ]
                }]
            };
            return await interaction.reply({ ...resultPayload, flags: MessageFlags.IsComponentsV2 });
        }

        // --- C. INFO DESKRIPSI ---
        if (customId === 'open_user_info_v2') {
            await interaction.deferReply({ ephemeral: true });
            const fullUser = await client.users.fetch(user.id, { force: true });
            
            const members = await guild.members.fetch();
            const joinPos = members.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp).map(m => m.id).indexOf(user.id) + 1;
            const roles = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.toString()).join(' ') || 'No Roles';

            const infoPayload = {
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `**Display Name:** ${user.displayName}\n**Username:** ${user.username}\n**User ID:** ${user.id}\n**Status:** ${(member.presence?.status || 'offline').toUpperCase()}\n**Nitro:** ${user.premiumSince ? 'Yes ✅' : 'No ❌'}`
                            }],
                            accessory: { type: 11, media: { url: user.displayAvatarURL() } }
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 10,
                            content: `**Dibuat:** <t:${Math.floor(user.createdTimestamp/1000)}:R>\n**Join Server:** <t:${Math.floor(member.joinedTimestamp/1000)}:R>\n**Member Ke:** #${joinPos}\n**Roles:** ${roles}`
                        },
                        { type: 14, spacing: 1 }
                    ]
                }]
            };

            if (fullUser.bannerURL()) {
                infoPayload.components[0].components.push({
                    type: 12, items: [{ media: { url: fullUser.bannerURL({ size: 1024 }) } }]
                });
            }

            return await interaction.editReply({ ...infoPayload, flags: MessageFlags.IsComponentsV2 });
        }
    }
};
                                
