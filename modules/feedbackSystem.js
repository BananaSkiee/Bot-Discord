// modules/feedbackSystem.js
const { 
    ActionRowBuilder, 
    ModalBuilder,
    TextInputBuilder, 
    TextInputStyle,
    MessageFlags 
} = require('discord.js');

const FEEDBACK_CHANNEL_ID = '1352326384940220488';

module.exports = {
    name: 'feedbackSystem',
    
    // Kirim template feedback prompt (hanya sekali saat ready)
    async sendFeedbackPrompt(client) {
        try {
            const channel = await client.channels.fetch(FEEDBACK_CHANNEL_ID);
            if (!channel) {
                console.error('❌ Feedback channel not found!');
                return;
            }

            // Cek apakah sudah ada pesan feedback prompt
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

            // Template persis seperti yang diminta (TANPA THREAD)
            const feedbackPromptPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# 📢 Server Feedback\n\nWe value your opinion! Share your experience with our server.\n\n**How it works:**\n> 1. Click **"Kirim Ulasan"** below\n> 2. Rate us 1-5 stars\n> 3. Write your feedback\n> 4. Submit!\n\n**__Benefits__**\n> • Help us improve\n> • Get recognized for great ideas\n> • Shape the future of our community`
                            }],
                            accessory: {
                                type: 11,
                                media: { url: client.user.displayAvatarURL({ dynamic: true, size: 128 }) }
                            }
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                {
                                    style: 1,
                                    type: 2,
                                    label: "Kirim Ulasan",
                                    custom_id: "feedback_open_modal",
                                    emoji: { name: "📝" }
                                },
                                {
                                    style: 2,
                                    type: 2,
                                    label: "Info Deskripsi",
                                    custom_id: "feedback_info"
                                },
                                {
                                    type: 2,
                                    style: 5,
                                    label: "Profile",
                                    url: `https://discord.com/users/${client.user.id}`
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

            if (action === 'info') {
                return await interaction.reply({
                    content: '**📋 Feedback Info**\n\nYour feedback helps us improve!\n\n• Be honest and constructive\n• All feedback is anonymous\n• We read every submission',
                    flags: MessageFlags.Ephemeral
                });
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
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            
            const rating = interaction.fields.getTextInputValue('feedback_rating').trim();
            const feedbackText = interaction.fields.getTextInputValue('feedback_text').trim();
            
            const ratingNum = parseInt(rating);
            if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
                return await interaction.editReply({
                    content: '❌ Invalid rating! Please enter a number between 1 and 5.'
                });
            }
            
            const stars = '⭐'.repeat(ratingNum);
            const emptyStars = '☆'.repeat(5 - ratingNum);
            const starDisplay = stars + emptyStars;
            
            const channel = await interaction.client.channels.fetch(FEEDBACK_CHANNEL_ID);
            if (!channel) {
                return await interaction.editReply({
                    content: '❌ Could not find feedback channel!'
                });
            }
            
            const timestamp = Math.floor(Date.now() / 1000);
            const username = interaction.user.globalName || interaction.user.username;
            
            // Template persis seperti yang diminta (TANPA THREAD)
            const feedbackPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# New Feedback\n> **"${feedbackText}"**\n\n **__Informasi__**\n> **Rating:** ${starDisplay} (${ratingNum}/5)\n> **Pengusul:** ${username}\n> **User ID:** ${interaction.user.id}\n> **Tanggal:** <t:${timestamp}:F>`
                            }],
                            accessory: {
                                type: 11,
                                media: { url: interaction.user.displayAvatarURL({ dynamic: true, size: 128 }) }
                            }
                        },
                        { type: 14 },
                        {
                            type: 10,
                            content: 'Terima kasih atas masukan Anda! Ulasan Anda membantu kami meningkatkan kualitas server kami.'
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                {
                                    style: 1,
                                    type: 2,
                                    label: "Kirim Ulasan",
                                    custom_id: "feedback_open_modal"
                                },
                                {
                                    style: 2,
                                    type: 2,
                                    label: "Info Deskripsi",
                                    custom_id: "feedback_info"
                                },
                                {
                                    type: 2,
                                    style: 5,
                                    label: "Profile",
                                    url: `https://discord.com/users/${interaction.user.id}`
                                }
                            ]
                        }
                    ]
                }]
            };

            // Kirim feedback TANPA thread
            await channel.send(feedbackPayload);

            return await interaction.editReply({
                content: `✅ **Thank you for your feedback!**\n\nYour ${ratingNum}-star review has been posted in <#${FEEDBACK_CHANNEL_ID}>.\n\n${starDisplay}\n\n> "${feedbackText}"`
            });

        } catch (error) {
            console.error('❌ Error handling feedback modal:', error);
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ An error occurred while submitting your feedback.'
                }).catch(() => {});
            }
        }
        
        return true;
    }
};
