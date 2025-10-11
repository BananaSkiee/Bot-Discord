const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class VerifyHandlers {
    constructor(verifySystem) {
        this.system = verifySystem;
        this.templates = verifySystem.templates;
    }

    // ========== VERIFICATION HANDLERS ==========
    async handleAlreadyVerified(interaction) {
        const embed = this.templates.getAlreadyVerifiedEmbed(interaction);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async showVerificationSuccess(interaction) {
        const { embed, components } = this.templates.getVerificationSuccessEmbed(interaction);
        await interaction.editReply({ embeds: [embed], components: [components] });
        
        this.system.createUserSession(interaction.user.id);
    }

    // ========== MAIN ACTION HANDLERS ==========
    async handleStartCommunity(interaction) {
        try {
            await interaction.deferUpdate();
            
            // Grant member access
            await this.system.grantMemberAccess(interaction);
            
            // Show welcome message
            const embed = this.templates.getWelcomeEmbed(interaction);
            await interaction.editReply({ embeds: [embed], components: [] });
            
            // Log the action
            await this.system.logVerification(interaction, 'QUICK_ACCESS');
            
            // Cleanup session
            this.system.userSessions.delete(interaction.user.id);

        } catch (error) {
            console.error('Start community error:', error);
            await interaction.editReply({
                content: '❌ Failed to process request. Please contact admin.',
                components: []
            });
        }
    }

    async handleStartOnboarding(interaction) {
        try {
            await interaction.deferUpdate();
            
            const { embed, components } = this.templates.getOnboardingEmbed();
            await interaction.editReply({ embeds: [embed], components: components });
            
            this.system.updateUserSession(interaction.user.id, { step: 'onboarding' });

        } catch (error) {
            console.error('Onboarding start error:', error);
            await interaction.editReply({
                content: '❌ Failed to start onboarding.',
                components: []
            });
        }
    }

    async handleSelectMenu(interaction) {
        try {
            const session = this.system.getUserSession(interaction.user.id);
            if (!session) {
                return await interaction.reply({
                    content: '❌ Session expired. Please restart verification.',
                    ephemeral: true
                });
            }

            const fieldMap = {
                'select_purpose': 'purpose',
                'select_experience': 'experience', 
                'select_contribution': 'contribution'
            };

            const field = fieldMap[interaction.customId];
            if (field) {
                session.data[field] = interaction.values[0];
                this.system.updateUserSession(interaction.user.id, session);
            }

            await interaction.reply({
                content: `✅ Selection saved: ${interaction.values[0]}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Select menu error:', error);
            await interaction.reply({
                content: '❌ Failed to save selection.',
                ephemeral: true
            });
        }
    }

    async handleConfirmOnboarding(interaction) {
        try {
            await interaction.deferUpdate();
            
            const session = this.system.getUserSession(interaction.user.id);
            if (!session || !session.data.purpose) {
                return await interaction.editReply({
                    content: '❌ Please complete all required fields.',
                    components: []
                });
            }

            // Grant access
            await this.system.grantMemberAccess(interaction);
            
            // Show rating step
            const { embed, components } = this.templates.getRatingEmbed();
            await interaction.editReply({ embeds: [embed], components: [components] });
            
            this.system.updateUserSession(interaction.user.id, { 
                step: 'rating',
                onboardingCompleted: true 
            });

        } catch (error) {
            console.error('Confirm onboarding error:', error);
            await interaction.editReply({
                content: '❌ Failed to process onboarding.',
                components: []
            });
        }
    }

    async handleSkipOnboarding(interaction) {
        try {
            await interaction.deferUpdate();
            
            // Grant access immediately
            await this.system.grantMemberAccess(interaction);
            
            const embed = this.templates.getSkipOnboardingEmbed(interaction);
            await interaction.editReply({ embeds: [embed], components: [] });
            
            await this.system.logVerification(interaction, 'ONBOARDING_SKIPPED');
            this.system.userSessions.delete(interaction.user.id);

        } catch (error) {
            console.error('Skip onboarding error:', error);
            await interaction.editReply({
                content: '❌ Failed to process request.',
                components: []
            });
        }
    }

    // ========== CUSTOM FORM HANDLERS ==========
    async handleCustomForm(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('custom_profile_modal')
                .setTitle('📝 Custom Professional Profile');

            const fields = [
                {
                    id: 'purpose_input',
                    label: 'Primary Goals & Objectives',
                    placeholder: 'Describe your main reasons for joining and what you hope to achieve...'
                },
                {
                    id: 'experience_input', 
                    label: 'Professional Background',
                    placeholder: 'Share your experience, skills, and professional journey...'
                },
                {
                    id: 'contribution_input',
                    label: 'Community Contribution Plans',
                    placeholder: 'How do you plan to contribute to and engage with our community?...'
                },
                {
                    id: 'interests_input',
                    label: 'Specific Interests & Expertise',
                    placeholder: 'List your areas of interest, expertise, or topics you\'re passionate about...'
                },
                {
                    id: 'expectations_input',
                    label: 'Community Expectations',
                    placeholder: 'What are you looking for in a community? Any specific expectations?...'
                }
            ];

            fields.forEach(field => {
                const input = new TextInputBuilder()
                    .setCustomId(field.id)
                    .setLabel(field.label)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(field.id !== 'expectations_input')
                    .setMaxLength(1000)
                    .setPlaceholder(field.placeholder);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
            });

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Custom form error:', error);
            await interaction.reply({
                content: '❌ Failed to open custom form.',
                ephemeral: true
            });
        }
    }

    async handleModalSubmit(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const session = this.system.getUserSession(interaction.user.id);
            if (!session) {
                return await interaction.editReply({
                    content: '❌ Session expired. Please restart verification.'
                });
            }

            // Extract all field values
            const customData = {};
            const fields = ['purpose_input', 'experience_input', 'contribution_input', 'interests_input', 'expectations_input'];
            
            fields.forEach(field => {
                try {
                    customData[field.replace('_input', '')] = interaction.fields.getTextInputValue(field);
                } catch (error) {
                    customData[field.replace('_input', '')] = '';
                }
            });

            // Update session with custom data
            session.data.custom = customData;
            session.data.profileType = 'CUSTOM';
            this.system.updateUserSession(interaction.user.id, session);

            // Grant member access
            await this.system.grantMemberAccess(interaction);

            // Show rating step
            const { embed, components } = this.templates.getRatingEmbed();
            await interaction.editReply({ 
                embeds: [embed], 
                components: [components] 
            });

            this.system.updateUserSession(interaction.user.id, { 
                step: 'rating',
                onboardingCompleted: true 
            });

        } catch (error) {
            console.error('Modal submit error:', error);
            await interaction.editReply({
                content: '❌ Failed to process your profile.'
            });
        }
    }

    // ========== RATING & FEEDBACK HANDLERS ==========
    async handleRatingInput(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('rating_modal')
                .setTitle('⭐ Community Experience Rating');

            const ratingInput = new TextInputBuilder()
                .setCustomId('rating_value')
                .setLabel('Rate your experience (1-100)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(3)
                .setPlaceholder('Enter a number between 1 and 100');

            modal.addComponents(new ActionRowBuilder().addComponents(ratingInput));
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Rating input error:', error);
            await interaction.reply({
                content: '❌ Failed to open rating input.',
                ephemeral: true
            });
        }
    }

    async handleRatingSubmit(interaction) {
        try {
            await interaction.deferUpdate();
            
            const ratingValue = parseInt(interaction.fields.getTextInputValue('rating_value'));
            const session = this.system.getUserSession(interaction.user.id);
            
            if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 100) {
                return await interaction.editReply({
                    content: '❌ Please enter a valid number between 1-100.',
                    components: []
                });
            }

            session.data.rating = ratingValue;
            this.system.updateUserSession(interaction.user.id, session);

            // Show feedback step
            const { embed, components } = this.templates.getFeedbackEmbed();
            await interaction.editReply({ embeds: [embed], components: [components] });

        } catch (error) {
            console.error('Rating submit error:', error);
            await interaction.editReply({
                content: '❌ Failed to process rating.',
                components: []
            });
        }
    }

    async handleFeedbackSubmit(interaction) {
        try {
            await interaction.deferUpdate();
            await this.completeOnboarding(interaction, true);

        } catch (error) {
            console.error('Feedback submit error:', error);
            await interaction.editReply({
                content: '❌ Failed to process feedback.',
                components: []
            });
        }
    }

    async handleFeedbackSkip(interaction) {
        try {
            await interaction.deferUpdate();
            await this.completeOnboarding(interaction, false);

        } catch (error) {
            console.error('Feedback skip error:', error);
            await interaction.editReply({
                content: '❌ Failed to complete process.',
                components: []
            });
        }
    }

    // ========== COMPLETION HANDLER ==========
    async completeOnboarding(interaction, hasFeedback) {
        const session = this.system.getUserSession(interaction.user.id);
        
        if (!session) {
            return await interaction.editReply({
                content: '❌ Session expired. Process completed.',
                components: []
            });
        }

        // Show completion message
        const embed = this.templates.getCompletionEmbed(interaction, session.data, hasFeedback);
        await interaction.editReply({ embeds: [embed], components: [] });

        // Log the complete onboarding
        await this.system.logVerification(interaction, 'ONBOARDING_COMPLETE', {
            ...session.data,
            hasFeedback: hasFeedback,
            profileType: session.data.profileType || 'DROPDOWN'
        });

        // Cleanup session
        this.system.userSessions.delete(interaction.user.id);
    }
}

module.exports = VerifyHandlers;
