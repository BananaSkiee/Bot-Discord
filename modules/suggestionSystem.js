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
        
        try {
            // Hapus pesan asli user
            await message.delete().catch(() => {});
            
            const timestamp = Math.floor(Date.now() / 1000);
            const username = message.author.globalName || message.author.username;
            
            // Template suggestion
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

            // Kirim suggestion
            const sentMessage = await message.channel.send(suggestionPayload);

            // AUTO BUAT THREAD - hanya bot yang di-thread
            const thread = await sentMessage.startThread({
                name: `Suggestion Discussion`,
                autoArchiveDuration: 1440, // 24 jam
                reason: 'Suggestion discussion thread'
            });

            // Isi thread pakai Components V2
            const threadContent = {
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

            await thread.send(threadContent);

            // Inisialisasi vote count
            suggestionVotes.set(sentMessage.id, { yes: 0, no: 0, voters: new Set() });

            console.log(`✅ Suggestion created by ${username} with thread`);

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
                // Ambil atau buat vote data
                let votes = suggestionVotes.get(message.id);
                if (!votes) {
                    votes = { yes: 0, no: 0, voters: new Set() };
                    suggestionVotes.set(message.id, votes);
                }

                // Cek apakah user sudah vote
                if (votes.voters.has(interaction.user.id)) {
                    // Langsung update tanpa reply message
                    await interaction.deferUpdate().catch(() => {});
                    return true;
                }

                // Tambah vote
                votes.voters.add(interaction.user.id);
                if (action === 'yes') votes.yes++;
                else votes.no++;

                // Update button labels - format: Yes (1) atau No (1)
                const updatedContainer = {
                    type: 17,
                    components: message.components[0].components.map(row => {
                        if (row.type === 1) {
                            return {
                                type: 1,
                                components: row.components.map(btn => {
                                    if (btn.custom_id === `suggest_yes_${authorId}_${timestamp}`) {
                                        return { 
                                            type: 2,
                                            style: 3,
                                            label: `Yes (${votes.yes})`,
                                            emoji: { name: "👍" },
                                            custom_id: btn.custom_id
                                        };
                                    }
                                    if (btn.custom_id === `suggest_no_${authorId}_${timestamp}`) {
                                        return { 
                                            type: 2,
                                            style: 4,
                                            label: `No (${votes.no})`,
                                            emoji: { name: "👎" },
                                            custom_id: btn.custom_id
                                        };
                                    }
                                    return btn;
                                })
                            };
                        }
                        return row;
                    })
                };

                // Update message langsung tanpa reply
                await message.edit({ 
                    components: [updatedContainer],
                    flags: MessageFlags.IsComponentsV2
                });
                
                // Defer update (tidak ada reply message)
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
