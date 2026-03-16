// modules/introCard.js
const { 
    ActionRowBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    MessageFlags 
} = require('discord.js');

module.exports = {
    // 1. Kirim Pesan Awal
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
                        { type: 12, items: [{ media: { url: "https://i.supaimg.com/9c29b956-2f35-4ae8-9b21-23d9f0eae59a.png" } }] },
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
                                { type: 2, style: 2, label: "Info Deskripsi", custom_id: "ignore", disabled: true },
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
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;
        const { customId, user, guild, client } = interaction;

        try {
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

            if (interaction.isModalSubmit() && customId === 'intro_modal_form') {
                // PERBAIKAN: Gunakan deferReply dengan catch untuk menghindari race condition
                try {
                    await interaction.deferReply();
                } catch (deferError) {
                    console.log("Modal defer failed (mungkin sudah direspon):", deferError.message);
                    return;
                }
                
                const [n, a, g, r, h] = ['f1','f2','f3','f4','f5'].map(id => interaction.fields.getTextInputValue(id));
                const now = new Date();
                const dateStr = `${now.toLocaleString('en-US', { month: 'long' }).toUpperCase()} - ${String(now.getDate()).padStart(2, '0')} - ${now.getFullYear()}`;
                
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
                                    content: `>>> \`\`\`ansi\n\u001b[1;34mNAME   \u001b[0m: \u001b[0;34m${n}\n\u001b[1;32mAGE    \u001b[0m: \u001b[0;32m${a}\n\u001b[1;31mGENDER \u001b[0m: \u001b[0;31m${g}\n\u001b[1;33mREGION \u001b[0m: \u001b[0;33m${r}\n\u001b[1;35mHOBBY  \u001b[0m: \u001b[0;35m${h}\u001b\n\`\`\``
                                }],
                                accessory: { type: 11, media: { url: user.displayAvatarURL() } }
                            },
                            { type: 14, spacing: 1 },
                            {
                                type: 1,
                                components: [
                                    { type: 2, style: 2, label: "Introduction Card", custom_id: "open_intro_modal" },
                                    { type: 2, style: 2, label: "Info Deskripsi", custom_id: `info_user_${user.id}` },
                                    { type: 2, style: 5, label: "Profile", url: `https://discord.com/users/${user.id}` }
                                ]
                            },
                            { type: 14, spacing: 1 },
                            { type: 10, content: `-# © BS Community ${dateStr} <t:${Math.floor(Date.now()/1000)}:R>` }
                        ]
                    }]
                };
                
                // PERBAIKAN: Gunakan safe editReply dengan pengecekan
                try {
                    return await interaction.editReply({ ...resultPayload, flags: MessageFlags.IsComponentsV2 });
                } catch (editError) {
                    console.error("Modal editReply failed:", editError.message);
                    return;
                }
            }

            if (customId.startsWith('info_user_')) {
                // PERBAIKAN #1: Gunakan flags MessageFlags.Ephemeral, bukan ephemeral: true
                // PERBAIKAN #2: Bungkus deferReply dalam try-catch untuk menghindari "Unknown interaction"
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                } catch (deferError) {
                    console.log("Info user defer failed (mungkin sudah direspon atau timeout):", deferError.message);
                    return;
                }
                
                const targetId = customId.split('_')[2];
                
                // PERBAIKAN #3: Parallel fetching dengan Promise.all untuk kecepatan
                // PERBAIKAN #4: Hapus parameter withPresences yang tidak valid
                let targetUser;
                let targetMember;
                
                try {
                    [targetUser, targetMember] = await Promise.all([
                        client.users.fetch(targetId, { force: true }),
                        guild.members.fetch(targetId).catch(() => null)
                    ]);
                } catch (fetchError) {
                    console.error("Error fetching user/member:", fetchError);
                    try {
                        return await interaction.editReply({ 
                            content: "❌ Gagal mengambil data user.",
                            flags: MessageFlags.Ephemeral 
                        });
                    } catch (e) { return; }
                }

                if (!targetMember) {
                    try {
                        return await interaction.editReply({ 
                            content: "Member tidak ditemukan.",
                            flags: MessageFlags.Ephemeral 
                        });
                    } catch (e) { return; }
                }

                // Kalkulasi Join Position
                let joinPos = 1;
                try {
                    const members = await guild.members.fetch();
                    joinPos = [...members.values()].sort((a,b) => a.joinedTimestamp - b.joinedTimestamp).findIndex(m => m.id === targetId) + 1;
                } catch (e) {
                    console.error("Error calculating join position:", e);
                }

                // Status Platform
                const devices = targetMember.presence?.clientStatus || {};
                const platform = [];
                if (devices.desktop) platform.push("(PC)");
                if (devices.mobile) platform.push("(HP)");
                if (devices.web) platform.push("(Web)");
                const platformStr = platform.length > 0 ? platform.join(" ") : "(Offline)";

                // Activity & Custom Status
                const activities = targetMember.presence?.activities || [];
                const customStatus = activities.find(a => a.type === 4)?.state || "Tidak Ada";
                const mainActivity = activities.find(a => a.type !== 4)?.name || "Tidak Ada";

                // Badges
                const badges = targetUser.flags?.toArray().join(", ") || "None";
                
                // ANSI Alignment Helper
                const f = (label, value, color = "37") => `\u001b[1;37m${label.padEnd(15, ' ')} :\u001b[0m \u001b[0;${color}m${value}\u001b[0m\n`;

                const formatDate = (ts) => {
                    const d = new Date(ts);
                    return `${d.toLocaleString('en-US', { month: 'long' })} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
                };
                const daysAgo = (ts) => Math.floor((Date.now() - ts) / 86400000);

                const infoContent = "```ansi\n" +
                    f("Display Name", targetUser.displayName, "36") +
                    f("Username", "@" + targetUser.username, "36") +
                    f("User ID", targetUser.id, "33") +
                    f("Nitro", targetUser.premiumSince ? "Yes ✅" : "No ❌", targetUser.premiumSince ? "32" : "31") +
                    f("Accent Color", targetUser.hexAccentColor || "Default", "35") +
                    "\n" +
                    f("Dibuat", `${formatDate(targetUser.createdTimestamp)} (${daysAgo(targetUser.createdTimestamp)} Hari)`) +
                    f("Join Server", `${formatDate(targetMember.joinedTimestamp)} (${daysAgo(targetMember.joinedTimestamp)} Hari)`) +
                    f("Member Ke", `#${joinPos} Dari ${guild.memberCount} Member`) +
                    "\n" +
                    f("Status", `${targetMember.presence?.status?.toUpperCase() || 'OFFLINE'} ${platformStr}`) +
                    f("Custom Status", customStatus) +
                    f("Aktifitas", mainActivity) +
                    f("Badges", badges) +
                    "```";

                const infoPayload = {
                    components: [{
                        type: 17,
                        components: [
                            targetUser.bannerURL() ? { type: 12, items: [{ media: { url: targetUser.bannerURL({ size: 1024 }) } }] } : { type: 14, spacing: 0 },
                            { type: 9, components: [{ type: 10, content: infoContent }], accessory: { type: 11, media: { url: targetUser.displayAvatarURL() } } },
                            { type: 14, spacing: 1 },
                            { type: 10, content: `**Roles:** ${targetMember.roles.cache.filter(r => r.name !== '@everyone').map(r => r.toString()).join(' ')}` },
                            { type: 14, spacing: 1 },
                            { type: 10, content: `-# © BS Community ${new Date().getFullYear()} <t:${Math.floor(Date.now()/1000)}:R>` }
                        ]
                    }]
                };

                // PERBAIKAN #5: Gunakan safe editReply dengan pengecekan dan flags yang benar
                try {
                    return await interaction.editReply({ 
                        ...infoPayload, 
                        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
                    });
                } catch (editError) {
                    console.error("Info user editReply failed:", editError.message);
                    // PERBAIKAN #6: Jika editReply gagal, coba followUp sebagai fallback
                    try {
                        if (interaction.replied || interaction.deferred) {
                            return await interaction.followUp({ 
                                content: "❌ Gagal menampilkan data (format error).",
                                flags: MessageFlags.Ephemeral 
                            });
                        }
                    } catch (followUpError) {
                        console.error("FollowUp juga failed:", followUpError.message);
                    }
                    return;
                }
            }
        } catch (e) { 
            // PERBAIKAN #7: Error handling global yang lebih aman
            console.error("Global error in handleIntroInteractions:", e);
            
            // Coba kirim error message jika belum direspon
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({ 
                        content: '❌ Terjadi error internal.',
                        flags: MessageFlags.Ephemeral 
                    });
                } catch (replyError) {
                    console.error("Failed to send error reply:", replyError.message);
                }
            } else if (interaction.deferred && !interaction.replied) {
                try {
                    await interaction.editReply({ 
                        content: '❌ Terjadi error internal saat memproses.'
                    });
                } catch (editError) {
                    console.error("Failed to send error editReply:", editError.message);
                }
            }
        }
    }
};
