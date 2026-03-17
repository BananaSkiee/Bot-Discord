// modules/suggestionSystem.js
const { MessageFlags } = require('discord.js');

const SUGGESTION_CHANNEL_ID = '1430584708974252102';
const suggestionVotes = new Map();

module.exports = {
    name: 'suggestionSystem',
    
    async handleSuggestionMessage(message) {
        if (message.channel.id !== SUGGESTION_CHANNEL_ID) return;
        if (message.author.bot) return;
        
        try {
            await message.delete().catch(() => {});
            
            const timestamp = Math.floor(Date.now() / 1000);
            const username = message.author.globalName || message.author.username;
            
            const suggestionPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# New Suggestion\n> **"${message.content}"**\n\n**__Informasi__**\n> **Pengusul:** ${username}\n> **User ID:** ${message.author.id}\n> **Tanggal:** <t:${timestamp}:F>`
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
                                content: `**__Catatan__**\n\n> Silakan berdiskusi tentang saran ini di thread di bawah ini!`
                            }],
                            accessory: {
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
                                    style: 3,
                                    type: 2,
                                    label: "Yes (0)",
                                    emoji: { name: "👍" },
                                    custom_id: `suggest_yes_${message.author.id}_${timestamp}`
                                },
                                {
                                    style: 4,
                                    type: 2,
                                    label: "No (0)",
                                    emoji: { name: "👎" },
                                    custom_id: `suggest_no_${message.author.id}_${timestamp}`
                                }
                            ]
                        }
                    ]
                }]
            };

            const sentMessage = await message.channel.send(suggestionPayload);

            const thread = await sentMessage.startThread({
                name: `Suggestion Discussion`,
                autoArchiveDuration: 1440,
                reason: 'Suggestion discussion thread'
            });

            const threadPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 10,
                            content: "Anda dapat berdiskusi di sini tentang saran tersebut."
                        }
                    ]
                }]
            };

            await thread.send(threadPayload);

            suggestionVotes.set(sentMessage.id, { yes: 0, no: 0, voters: new Set() });

            console.log(`✅ Suggestion created with thread "Suggestion Discussion"`);

        } catch (error) {
            console.error('❌ Error handling suggestion:', error);
        }
    },

    async handleSuggestionButtons(interaction) {
        if (!interaction.isButton()) return false;
        
        const { customId, message } = interaction;
        if (!customId.startsWith('suggest_')) return false;
        
        try {
            const parts = customId.split('_');
            const action = parts[1];
            const authorId = parts[2];
            const timestamp = parts[3];
            
            if (action === 'yes' || action === 'no') {
                let votes = suggestionVotes.get(message.id);
                if (!votes) {
                    votes = { yes: 0, no: 0, voters: new Set() };
                    suggestionVotes.set(message.id, votes);
                }

                if (votes.voters.has(interaction.user.id)) {
                    await interaction.deferUpdate().catch(() => {});
                    return true;
                }

                votes.voters.add(interaction.user.id);
                if (action === 'yes') votes.yes++;
                else votes.no++;

                // Build new components array dari awal
                const newComponents = [{
                    type: 17,
                    components: [
                        // Section 1 - Header (tetap sama)
                        message.components[0].components[0],
                        // Separator
                        message.components[0].components[1],
                        // Section 2 - Catatan (tetap sama)
                        message.components[0].components[2],
                        // Separator
                        message.components[0].components[3],
                        // Action Row - Buttons (diupdate)
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    style: 3,
                                    label: `Yes (${votes.yes})`,
                                    emoji: { name: "👍" },
                                    custom_id: `suggest_yes_${authorId}_${timestamp}`
                                },
                                {
                                    type: 2,
                                    style: 4,
                                    label: `No (${votes.no})`,
                                    emoji: { name: "👎" },
                                    custom_id: `suggest_no_${authorId}_${timestamp}`
                                }
                            ]
                        }
                    ]
                }];

                await message.edit({ 
                    components: newComponents,
                    flags: MessageFlags.IsComponentsV2
                });
                
                await interaction.deferUpdate().catch(() => {});
                return true;
            }

        } catch (error) {
            console.error('❌ Error handling suggestion button:', error);
            await interaction.deferUpdate().catch(() => {});
        }
        
        return true;
    }
};
