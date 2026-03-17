// modules/suggestionSystem.js
const { MessageFlags } = require('discord.js');

const SUGGESTION_CHANNEL_ID = '1430584708974252102';
const suggestionVotes = new Map();

module.exports = {
    name: 'suggestionSystem',
    
    // Handler untuk message create di channel suggestion (CHAT LANGSUNG)
    async handleSuggestionMessage(message) {
        if (message.channel.id !== SUGGESTION_CHANNEL_ID) return;
        if (message.author.bot) return;
        
        const hasAttachment = message.attachments.size > 0;
        const attachmentUrl = hasAttachment ? message.attachments.first().url : null;
        
        try {
            // Hapus pesan asli user
            await message.delete().catch(() => {});
            
            const timestamp = Math.floor(Date.now() / 1000);
            const username = message.author.globalName || message.author.username;
            
            // Template persis seperti yang diminta - HANYA 2 TOMBOL (Yes/No)
            const suggestionPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# New Suggestion\n> **"${message.content}"**\n\n**__Informasi__**\n> **Pengusul:** ${username}\n> **Tanggal:** <t:${timestamp}:F>\n> **User ID:** ${message.author.id}`
                            }],
                            accessory: {
                                type: 11,
                                media: { url: message.author.displayAvatarURL({ dynamic: true, size: 128 }) }
                            }
                        },
                        { type: 14 },
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `**__Catatan__**\n\n> Silakan berdiskusi tentang saran ini di thread di bawah ini!${hasAttachment ? '\n\n📎 **Attachment included**' : ''}`
                            }],
                            accessory: hasAttachment ? {
                                type: 11,
                                media: { url: attachmentUrl }
                            } : {
                                type: 2,
                                style: 5,
                                label: "Profile",
                                url: `https://discord.com/users/${message.author.id}`
                            }
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                {
                                    style: 3, // Success (Green)
                                    type: 2,
                                    label: "👍 (0)",
                                    emoji: { name: "👍" },
                                    custom_id: `suggest_yes_${message.author.id}_${timestamp}`
                                },
                                {
                                    style: 4, // Danger (Red)
                                    type: 2,
                                    label: "👎 (0)",
                                    emoji: { name: "👎" },
                                    custom_id: `suggest_no_${message.author.id}_${timestamp}`
                                }
                            ]
                        }
                    ]
                }]
            };

            // Kirim suggestion
            const sentMessage = await message.channel.send(suggestionPayload);

            // AUTO BUAT THREAD (untuk suggestion)
            const thread = await sentMessage.startThread({
                name: `💡 Suggestion by ${username}`,
                autoArchiveDuration: 1440, // 24 jam
                reason: 'Suggestion discussion thread'
            });

            await thread.send({
                content: `👋 Hey <@${message.author.id}>! This is the discussion thread for your suggestion.\n\nFeel free to explain more details here!`
            });

            // Inisialisasi vote count
            suggestionVotes.set(sentMessage.id, { yes: 0, no: 0, voters: new Set() });

            console.log(`✅ Suggestion created by ${username} with thread`);

        } catch (error) {
            console.error('❌ Error handling suggestion:', error);
            // Jika gagal, coba kirim pesan error ke user via DM
            try {
                await message.author.send('❌ Failed to post your suggestion. Please try again.').catch(() => {});
            } catch (e) {}
        }
    },

    async handleSuggestionButtons(interaction) {
        if (!interaction.isButton()) return false;
        
        const { customId, message } = interaction;
        if (!customId.startsWith('suggest_')) return false;
        
        try {
            const parts = customId.split('_');
            const action = parts[1]; // yes atau no
            const authorId = parts[2];
            const timestamp = parts[3];
            
            if (action === 'yes' || action === 'no') {
                // Ambil atau buat vote data
                let votes = suggestionVotes.get(message.id);
                if (!votes) {
                    votes = { yes: 0, no: 0, voters: new Set() };
                    suggestionVotes.set(message.id, votes);
                }

                // Cek apakah user sudah vote
                if (votes.voters.has(interaction.user.id)) {
                    return await interaction.reply({ 
                        content: '❌ You have already voted!', 
                        flags: MessageFlags.Ephemeral 
                    });
                }

                // Tambah vote
                votes.voters.add(interaction.user.id);
                if (action === 'yes') votes.yes++;
                else votes.no++;

                // Update button labels - format: 👍 (1) atau 👎 (1)
                const updatedContainer = {
                    type: 17,
                    components: message.components[0].components.map(row => {
                        // Jika ini action row (type 1), update buttons
                        if (row.type === 1) {
                            return {
                                type: 1,
                                components: row.components.map(btn => {
                                    if (btn.custom_id === `suggest_yes_${authorId}_${timestamp}`) {
                                        return { 
                                            ...btn, 
                                            label: `👍 (${votes.yes})`,
                                            emoji: { name: "👍" }
                                        };
                                    }
                                    if (btn.custom_id === `suggest_no_${authorId}_${timestamp}`) {
                                        return { 
                                            ...btn, 
                                            label: `👎 (${votes.no})`,
                                            emoji: { name: "👎" }
                                        };
                                    }
                                    return btn;
                                })
                            };
                        }
                        return row;
                    })
                };

                // Update message dengan full payload
                await message.edit({ 
                    components: [updatedContainer],
                    flags: MessageFlags.IsComponentsV2
                });
                
                return await interaction.reply({ 
                    content: `✅ You voted **${action === 'yes' ? '👍 Yes' : '👎 No'}**!`, 
                    flags: MessageFlags.Ephemeral 
                });
            }

        } catch (error) {
            console.error('❌ Error handling suggestion button:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ An error occurred!', 
                    flags: MessageFlags.Ephemeral 
                }).catch(() => {});
            }
        }
        
        return true;
    }
};
