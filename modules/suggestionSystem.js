// modules/suggestionSystem.js
const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const SUGGESTION_CHANNEL_ID = '1430584708974252102';

// Store votes in memory (gunakan database untuk production)
const suggestionVotes = new Map();

module.exports = {
    name: 'suggestionSystem',
    
    // Handler untuk message create di channel suggestion
    async handleSuggestionMessage(message) {
        // Cek apakah di channel suggestion dan bukan bot
        if (message.channel.id !== SUGGESTION_CHANNEL_ID) return;
        if (message.author.bot) return;
        
        // Cek apakah pesan mengandung attachment (gambar/file)
        const hasAttachment = message.attachments.size > 0;
        const attachmentUrl = hasAttachment ? message.attachments.first().url : null;
        
        try {
            // Hapus pesan asli user
            await message.delete().catch(() => {});
            
            // Buat timestamp
            const timestamp = Math.floor(Date.now() / 1000);
            const username = message.author.globalName || message.author.username;
            
            // Buat payload Components V2
            const suggestionPayload = {
                components: [{
                    type: 17, // Container
                    components: [
                        {
                            type: 9, // Section
                            components: [{
                                type: 10, // Text Display
                                content: `# New Suggestion\n> **"${message.content}"**\n\n**__Information__**\n> **Proposer:** ${username}\n> **Date:** <t:${timestamp}:F>\n> **User ID:** ${message.author.id}`
                            }],
                            accessory: {
                                type: 11, // Thumbnail
                                media: { url: message.author.displayAvatarURL({ dynamic: true, size: 128 }) }
                            }
                        },
                        { type: 14 }, // Separator
                        {
                            type: 9, // Section
                            components: [{
                                type: 10,
                                content: `**__Note__**\n\n> Please discuss this suggestion in the thread below!${hasAttachment ? '\n\n📎 **Attachment included**' : ''}`
                            }],
                            accessory: hasAttachment ? {
                                type: 11,
                                media: { url: attachmentUrl }
                            } : undefined
                        },
                        { type: 14 }, // Separator
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    type: 2, // Button
                                    style: 3, // Success (Green)
                                    label: "Yes (0)",
                                    emoji: { name: "👍" },
                                    custom_id: `suggest_yes_${message.author.id}_${timestamp}`
                                },
                                {
                                    type: 2,
                                    style: 4, // Danger (Red)
                                    label: "No (0)",
                                    emoji: { name: "👎" },
                                    custom_id: `suggest_no_${message.author.id}_${timestamp}`
                                },
                                {
                                    type: 2,
                                    style: 2, // Secondary (Grey)
                                    label: "Info Description",
                                    custom_id: `suggest_info_${message.author.id}_${timestamp}`
                                },
                                {
                                    type: 2,
                                    style: 5, // Link
                                    label: "Profile",
                                    url: `https://discord.com/users/${message.author.id}`
                                }
                            ]
                        }
                    ]
                }]
            };

            // Kirim suggestion dengan Components V2
            const sentMessage = await message.channel.send({
                ...suggestionPayload,
                flags: MessageFlags.IsComponentsV2
            });

            // Buat thread untuk diskusi
            const thread = await sentMessage.startThread({
                name: `💡 Suggestion by ${username}`,
                autoArchiveDuration: 1440, // 24 jam
                reason: 'Suggestion discussion thread'
            });

            // Kirim pesan pembuka di thread
            await thread.send({
                content: `👋 Hey <@${message.author.id}>! This is the discussion thread for your suggestion.\n\nFeel free to explain more details here!`
            });

            // Inisialisasi vote count
            suggestionVotes.set(sentMessage.id, { yes: 0, no: 0, voters: new Set() });

            console.log(`✅ Suggestion created by ${username} in thread ${thread.name}`);

        } catch (error) {
            console.error('❌ Error handling suggestion:', error);
            // Jika gagal, coba kirim pesan error ke user via DM
            try {
                await message.author.send('❌ Failed to post your suggestion. Please try again.').catch(() => {});
            } catch (e) {}
        }
    },

    // Handler untuk button interactions
    async handleSuggestionButtons(interaction) {
        if (!interaction.isButton()) return false;
        
        const { customId, message } = interaction;
        
        // Cek apakah ini suggestion button
        if (!customId.startsWith('suggest_')) return false;
        
        try {
            const [type, action, authorId, timestamp] = customId.split('_');
            
            if (action === 'yes' || action === 'no') {
                // Cek apakah user sudah vote
                const votes = suggestionVotes.get(message.id);
                if (!votes) {
                    return await interaction.reply({ 
                        content: '❌ Voting data not found!', 
                        flags: MessageFlags.Ephemeral 
                    });
                }

                if (votes.voters.has(interaction.user.id)) {
                    return await interaction.reply({ 
                        content: '❌ You have already voted!', 
                        flags: MessageFlags.Ephemeral 
                    });
                }

                // Update vote count
                votes.voters.add(interaction.user.id);
                if (action === 'yes') votes.yes++;
                else votes.no++;

                // Update button labels
                const updatedComponents = message.components.map(row => ({
                    type: 1,
                    components: row.components.map(btn => {
                        if (btn.customId === `suggest_yes_${authorId}_${timestamp}`) {
                            return { ...btn, label: `Yes (${votes.yes})` };
                        }
                        if (btn.customId === `suggest_no_${authorId}_${timestamp}`) {
                            return { ...btn, label: `No (${votes.no})` };
                        }
                        return btn;
                    })
                }));

                // Update message
                await message.edit({ components: updatedComponents });
                
                return await interaction.reply({ 
                    content: `✅ You voted **${action.toUpperCase()}**!`, 
                    flags: MessageFlags.Ephemeral 
                });
            }

            if (action === 'info') {
                return await interaction.reply({
                    content: '**📋 Suggestion Info**\n\nClick **Yes** if you agree with this suggestion\nClick **No** if you disagree\n\nVotes are anonymous!',
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
