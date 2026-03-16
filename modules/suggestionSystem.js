// modules/suggestionSystem.js
const { MessageFlags } = require('discord.js');

const SUGGESTION_CHANNEL_ID = '1430584708974252102';
const suggestionVotes = new Map();

module.exports = {
    name: 'suggestionSystem',
    
    async handleSuggestionMessage(message) {
        if (message.channel.id !== SUGGESTION_CHANNEL_ID) return;
        if (message.author.bot) return;
        
        const hasAttachment = message.attachments.size > 0;
        const attachmentUrl = hasAttachment ? message.attachments.first().url : null;
        
        try {
            await message.delete().catch(() => {});
            
            const timestamp = Math.floor(Date.now() / 1000);
            const username = message.author.globalName || message.author.username;
            
            const suggestionPayload = {
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# New Suggestion\n> **"${message.content}"**\n\n**__Information__**\n> **Proposer:** ${username}\n> **Date:** <t:${timestamp}:F>\n> **User ID:** ${message.author.id}`
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
                                content: `**__Note__**\n\n> Please discuss this suggestion in the thread below!${hasAttachment ? '\n\n📎 **Attachment included**' : ''}`
                            }],
                            accessory: hasAttachment ? {
                                type: 11,
                                media: { url: attachmentUrl }
                            } : undefined
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    style: 3,
                                    label: "Yes (0)",
                                    emoji: { name: "👍" },
                                    custom_id: `suggest_yes_${message.author.id}_${timestamp}`
                                },
                                {
                                    type: 2,
                                    style: 4,
                                    label: "No (0)",
                                    emoji: { name: "👎" },
                                    custom_id: `suggest_no_${message.author.id}_${timestamp}`
                                },
                                {
                                    type: 2,
                                    style: 2,
                                    label: "Info Description",
                                    custom_id: `suggest_info_${message.author.id}_${timestamp}`
                                },
                                {
                                    type: 2,
                                    style: 5,
                                    label: "Profile",
                                    url: `https://discord.com/users/${message.author.id}`
                                }
                            ]
                        }
                    ]
                }]
            };

            const sentMessage = await message.channel.send({
                ...suggestionPayload,
                flags: MessageFlags.IsComponentsV2
            });

            const thread = await sentMessage.startThread({
                name: `💡 Suggestion by ${username}`,
                autoArchiveDuration: 1440,
                reason: 'Suggestion discussion thread'
            });

            await thread.send({
                content: `👋 Hey <@${message.author.id}>! This is the discussion thread for your suggestion.\n\nFeel free to explain more details here!`
            });

            suggestionVotes.set(sentMessage.id, { yes: 0, no: 0, voters: new Set() });

        } catch (error) {
            console.error('❌ Error handling suggestion:', error);
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
            const [prefix, action, authorId, timestamp] = customId.split('_');
            
            if (action === 'yes' || action === 'no') {
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

                votes.voters.add(interaction.user.id);
                if (action === 'yes') votes.yes++;
                else votes.no++;

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
