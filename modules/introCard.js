// modules/introCard.js
const { 
    ActionRowBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    MessageFlags 
} = require('discord.js');

module.exports = {
    async sendInitialCard(client, channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) return;

            const now = new Date();
            const dateString = `${now.toLocaleString('en-US', { month: 'long' }).toUpperCase()} - ${String(now.getDate()).padStart(2, '0')} - ${now.getFullYear()}`;
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
                                content: ">>> ```ansi\n\u001b[1;34mNAME   \u001b[0m: \u001b[0;37mBelum Diisi\n\u001b[1;32mAGE    \u001b[0m: \u001b[0;37mBelum Diisi\n\u001b[1;31mGENDER \u001b[0m: \u001b[0;37mBelum Diisi\n\u001b[1;33mREGION \u001b[0m: \u001b[0;37mBelum Diisi\n\u001b[1;35mHOBBY  \u001b[0m: \u001b[0;37mBelum Diisi\u001b\n```"
                            }],
                            accessory: { type: 11, media: { url: client.user.displayAvatarURL() } }
                        },
                        { type: 14, spacing: 1 }, 
                        {
                            type: 1, 
                            components: [
                                { type: 2, style: 2, label: "Introduction Card", custom_id: "open_intro_modal" },
                                { type: 2, style: 2, label: "Info Deskripsi", custom_id: "open_user_info_v2", disabled: true }, // Disable di awal karena data user belum ada
                                { type: 2, style: 5, label: "Profile", url: `https://discord.com/users/${client.user.id}` }
                            ]
                        },
                        { type: 14, spacing: 1 }, 
                        { type: 10, content: `-# © BS Community ${dateString} <t:${ts}:R>` }
                    ]
                }]
            };

            await channel.send({ ...payload, flags: MessageFlags.IsComponentsV2 });
        } catch (e) { console.error("Error Initial Card:", e); }
    },

    async handleIntroInteractions(interaction) {
        // Mencegah error Unknown Interaction dengan memastikan interaksi masih valid
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        const { customId, user, member, guild, client } = interaction;

        try {
            // --- A. MODAL FORM ---
            if (customId === 'open_intro_modal') {
                const modal = new ModalBuilder().setCustomId('intro_modal_form').setTitle('Introduction Card Form');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f1').setLabel('NAME').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f2').setLabel('AGE').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(2)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f3').setLabel('GENDER').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f4').setLabel('REGION').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f5').setLabel('HOBBY').setStyle(TextInputStyle.Paragraph).setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            // --- B. SUBMIT FORM ---
            if (interaction.isModalSubmit() && customId === 'intro_modal_form') {
                // Gunakan deferReply agar tidak timeout jika proses agak lama
                await interaction.deferReply();

                const [n, a, g, r, h] = ['f1','f2','f3','f4','f5'].map(id => interaction.fields.getTextInputValue(id));
                const now = new Date();
                const dateStr = `${now.toLocaleString('en-US', { month: 'long' }).toUpperCase()} - ${String(now.getDate()).padStart(2, '0')} - ${now.getFullYear()}`;
                const ts = Math.floor(Date.now() / 1000);

                // Fungsi perapi teks agar simetris
                const pad = (str, len) => str.padEnd(len, ' ');

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
                                    content: `>>> \`\`\`ansi\n\u001b[1;34m${pad('NAME', 7)}\u001b[0m: \u001b[0;34m${n}\n\u001b[1;32m${pad('AGE', 7)}\u001b[0m: \u001b[0;32m${a}\n\u001b[1;31m${pad('GENDER', 7)}\u001b[0m: \u001b[0;31m${g}\n\u001b[1;33m${pad('REGION', 7)}\u001b[0m: \u001b[0;33m${r}\n\u001b[1;35m${pad('HOBBY', 7)}\u001b[0m: \u001b[0;35m${h}\u001b\n\`\`\``
                                }],
                                accessory: { type: 11, media: { url: user.displayAvatarURL() } }
                            },
                            { type: 14, spacing: 1 },
                            {
                                type: 1,
                                components: [
                                    { type: 2, style: 2, label: "Introduction Card", custom_id: "open_intro_modal" },
                                    { type: 2, style: 2, label: "Info Deskripsi", custom_id: `info_user_${user.id}` }, // Simpan ID user di customId
                                    { type: 2, style: 5, label: "Profile", url: `https://discord.com/users/${user.id}` }
                                ]
                            },
                            { type: 14, spacing: 1 },
                            { type: 10, content: `-# © BS Community ${dateStr} <t:${ts}:R>` }
                        ]
                    }]
                };
                return await interaction.editReply({ ...resultPayload, flags: MessageFlags.IsComponentsV2 });
            }

            // --- C. INFO DESKRIPSI (DINAMIS) ---
            if (customId.startsWith('info_user_')) {
                await interaction.deferReply({ ephemeral: true });
                
                const targetId = customId.split('_')[2];
                const targetUser = await client.users.fetch(targetId, { force: true });
                const targetMember = await guild.members.fetch(targetId).catch(() => null);

                if (!targetMember) return await interaction.editReply("Data member tidak ditemukan.");

                const members = await guild.members.fetch();
                const sortedMembers = [...members.values()].sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
                const joinPos = sortedMembers.findIndex(m => m.id === targetId) + 1;
                
                const roles = targetMember.roles.cache
                    .filter(r => r.name !== '@everyone')
                    .sort((a, b) => b.position - a.position)
                    .map(r => r.toString())
                    .join(' ');

                const formatDate = (date) => {
                    const d = new Date(date);
                    return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getDate()}, ${d.getFullYear()}`;
                };

                const daysAgo = (ts) => Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));

                const infoPayload = {
                    components: [{
                        type: 17,
                        components: [
                            targetUser.bannerURL() ? { type: 12, items: [{ media: { url: targetUser.bannerURL({ size: 1024 }) } }] } : { type: 14, spacing: 0 },
                            {
                                type: 9,
                                components: [{
                                    type: 10,
                                    content: `\`\`\`ansi\n\u001b[1;37mDisplay Name :\u001b[0m \u001b[0;36m${targetUser.displayName}\n\u001b[1;37mUsername     :\u001b[0m \u001b[0;36m@${targetUser.username}\n\u001b[1;37mUser ID      :\u001b[0m \u001b[0;33m${targetUser.id}\n\u001b[1;37mNitro        :\u001b[0m ${targetUser.premiumSince ? '\u001b[0;32mYes ✅' : '\u001b[0;31mNo ❌'}\n\u001b[1;37mAccent Color :\u001b[0m \u001b[0;35m${targetUser.hexAccentColor || 'Default'}\u001b[0m\n\`\`\``
                                }],
                                accessory: { type: 11, media: { url: targetUser.displayAvatarURL() } }
                            },
                            { type: 14, spacing: 2 },
                            {
                                type: 10,
                                content: `**Dibuat:** ${formatDate(targetUser.createdTimestamp)} (${daysAgo(targetUser.createdTimestamp)} Hari)\n**Join Server:** ${formatDate(targetMember.joinedTimestamp)} (${daysAgo(targetMember.joinedTimestamp)} Hari)\n**Member Ke:** #${joinPos} Dari ${guild.memberCount} Member`
                            },
                            { type: 14, spacing: 2 },
                            {
                                type: 10,
                                content: `**Status:** ${targetMember.presence?.status?.toUpperCase() || 'OFFLINE'}\n**Badges:** ${targetUser.flags.toArray().join(', ') || 'None'}`
                            },
                            { type: 14, spacing: 2 },
                            {
                                type: 10,
                                content: `**Roles:** ${roles}`
                            },
                            { type: 14, spacing: 1 },
                            { type: 10, content: `-# © BS Community ${new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase()} - ${String(new Date().getDate()).padStart(2, '0')} - ${new Date().getFullYear()} <t:${Math.floor(Date.now()/1000)}:R>` }
                        ]
                    }]
                };

                return await interaction.editReply({ ...infoPayload, flags: MessageFlags.IsComponentsV2 });
            }
        } catch (error) {
            console.error("❌ Intro Interaction Error:", error);
            // Cek jika interaksi belum dijawab, kirim pesan error
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({ content: "Terjadi kesalahan saat memproses data.", ephemeral: true }).catch(() => {});
            }
        }
    }
};
