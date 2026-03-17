// modules/feedbackSystem.js
const { 
    ActionRowBuilder, 
    ModalBuilder,
    TextInputBuilder, 
    TextInputStyle,
    MessageFlags 
} = require('discord.js');

const FEEDBACK_CHANNEL_ID = '1352326384940220488';

// Emoji reaksi berdasarkan rating
const RATING_REACTIONS = {
    1: '😞', // Kecewa
    2: '😕', // Kurang puas
    3: '😐', // Biasa saja
    4: '🙂', // Puas
    5: '🤩'  // Sangat puas
};

const RATING_MESSAGES = {
    1: 'Kami mohon maaf atas pengalaman kurang memuaskan. Kami akan berusaha lebih baik!',
    2: 'Terima kasih atas masukan Anda. Kami akan terus meningkatkan kualitas server.',
    3: 'Terima kasih atas penilaian Anda. Ada yang bisa kami bantu lebih baik?',
    4: 'Senang mendengar Anda puas! Terima kasih atas dukungannya.',
    5: 'Luar biasa! Terima kasih banyak atas apresiasi Anda! 🎉'
};

module.exports = {
    name: 'feedbackSystem',
    
    async sendFeedbackPrompt(client) {
        try {
            const channel = await client.channels.fetch(FEEDBACK_CHANNEL_ID);
            if (!channel) {
                console.error('❌ Feedback channel not found!');
                return;
            }

            const messages = await channel.messages.fetch({ limit: 10 });
            const existingPrompt = messages.find(m => 
                m.author.id === client.user.id && 
                m.components?.length > 0 &&
                m.components[0]?.components?.some(c => 
                    c.components?.some(btn => btn.custom_id === 'feedback_open_modal')
                )
            );

            if (existingPrompt) {
                console.log('✅ Feedback prompt already exists, skipping...');
                return;
            }

            const timestamp = Math.floor(Date.now() / 1000);
            const botName = client.user.globalName || client.user.username;
            
            const feedbackPromptPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# New Feedback\n> **\"None\"**\n\n **__Informasi__**\n> **Rating:** None\n> **Pengusul:** ${botName}\n> **User ID:** ${client.user.id}\n> **Tanggal:** <t:${timestamp}:F>`
                            }],
                            accessory: {
                                type: 11,
                                media: { url: client.user.displayAvatarURL({ dynamic: true, size: 128 }) }
                            }
                        },
                        { type: 14 },
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `**__Terimakasih Banyak__**\n\n> Saran Anda membantu kami meningkatkan kualitas server kami.`
                            }],
                            accessory: {
                                type: 2,
                                style: 5,
                                url: `https://discord.com/users/${client.user.id}`,
                                label: "Profile"
                            }
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                {
                                    style: 2,
                                    type: 2,
                                    label: "Kirim Saran",
                                    custom_id: "feedback_open_modal"
                                }
                            ]
                        }
                    ]
                }]
            };

            await channel.send(feedbackPromptPayload);
            console.log('✅ Sent new feedback prompt');

        } catch (error) {
            console.error('❌ Error sending feedback prompt:', error);
        }
    },
    
    async handleFeedbackButtons(interaction) {
        if (!interaction.isButton()) return false;
        
        const { customId } = interaction;
        if (!customId.startsWith('feedback_')) return false;
        
        try {
            const action = customId.replace('feedback_', '');
            
            if (action === 'open_modal') {
                const modal = new ModalBuilder()
                    .setCustomId('feedback_modal_submit')
                    .setTitle('📝 Server Feedback');

                const ratingInput = new TextInputBuilder()
                    .setCustomId('feedback_rating')
                    .setLabel('Rating (1-5 stars)')
                    .setPlaceholder('Enter a number from 1 to 5')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(1)
                    .setRequired(true);

                const feedbackInput = new TextInputBuilder()
                    .setCustomId('feedback_text')
                    .setLabel('Your Feedback')
                    .setPlaceholder('Tell us what you think about the server...')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMinLength(10)
                    .setMaxLength(1000)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(ratingInput),
                    new ActionRowBuilder().addComponents(feedbackInput)
                );

                return await interaction.showModal(modal);
            }

        } catch (error) {
            console.error('❌ Error handling feedback button:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ An error occurred!', 
                    flags: MessageFlags.Ephemeral 
                }).catch(() => {});
            }
        }
        
        return true;
    },

    async handleFeedbackModal(interaction) {
        if (!interaction.isModalSubmit()) return false;
        if (interaction.customId !== 'feedback_modal_submit') return false;
        
        try {
            const rating = interaction.fields.getTextInputValue('feedback_rating').trim();
            const feedbackText = interaction.fields.getTextInputValue('feedback_text').trim();
            
            const ratingNum = parseInt(rating);
            if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
                const errorPayload = {
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                    components: [{
                        type: 17,
                        components: [
                            {
                                type: 10,
                                content: "❌ Rating tidak valid! Silakan masukkan angka 1 - 5."
                            }
                        ]
                    }]
                };
                return await interaction.reply(errorPayload);
            }
            
            const stars = '⭐'.repeat(ratingNum);
            const emptyStars = '☆'.repeat(5 - ratingNum);
            const starDisplay = stars + emptyStars;
            
            const channel = await interaction.client.channels.fetch(FEEDBACK_CHANNEL_ID);
            if (!channel) {
                return await interaction.reply({
                    content: '❌ Could not find feedback channel!',
                    flags: MessageFlags.Ephemeral
                });
            }
            
            const timestamp = Math.floor(Date.now() / 1000);
            const username = interaction.user.globalName || interaction.user.username;
            
            // Ambil emoji dan pesan berdasarkan rating
            const reactionEmoji = RATING_REACTIONS[ratingNum];
            const ratingMessage = RATING_MESSAGES[ratingNum];
            
            const feedbackPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# New Feedback ${reactionEmoji}\n> **"${feedbackText}"**\n\n **__Informasi__**\n> **Rating:** ${starDisplay} (${ratingNum}/5)\n> **Pengusul:** ${username}\n> **User ID:** ${interaction.user.id}\n> **Tanggal:** <t:${timestamp}:F>`
                            }],
                            accessory: {
                                type: 11,
                                media: { url: interaction.user.displayAvatarURL({ dynamic: true, size: 128 }) }
                            }
                        },
                        { type: 14 },
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `**__${ratingMessage}__**`
                            }],
                            accessory: {
                                type: 2,
                                style: 5,
                                url: `https://discord.com/users/${interaction.user.id}`,
                                label: "Profile"
                            }
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                {
                                    style: 2,
                                    type: 2,
                                    label: "Kirim Saran",
                                    custom_id: "feedback_open_modal"
                                }
                            ]
                        }
                    ]
                }]
            };

            const sentMessage = await channel.send(feedbackPayload);
            
            // ✅ TAMBAH REACTION EMOJI KHUSUS
            try {
                await sentMessage.react(reactionEmoji);
            } catch (reactError) {
                console.error('❌ Failed to add reaction:', reactError);
            }

            await interaction.deferUpdate().catch(() => {});
            
        } catch (error) {
            console.error('❌ Error handling feedback modal:', error);
            await interaction.deferUpdate().catch(() => {});
        }
        
        return true;
    }
};
