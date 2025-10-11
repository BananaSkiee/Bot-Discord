const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const VerifyHandlers = require('./verifyHandlers');
const VerifyTemplates = require('./verifyTemplates');
const VerifyDatabase = require('./verifyDatabase');

class VerifySystem {
    constructor() {
        this.config = {
            verifyChannelId: '1352823970054803509',
            logChannelId: '1426537842875826278',
            memberRoleId: '1352286235233620108',
            generalChannelId: '1352404526870560788'
        };
        
        this.handlers = new VerifyHandlers(this);
        this.templates = new VerifyTemplates(this);
        this.database = new VerifyDatabase();
        
        this.userSessions = new Map();
        this.verificationQueue = new Map();
    }

    // ========== INITIALIZATION ==========
    async initialize(client) {
        try {
            console.log('🚀 Initializing Premium Verify System...');
            
            const channel = await client.channels.fetch(this.config.verifyChannelId);
            if (!channel) throw new Error('Verify channel not found');

            await this.cleanChannel(channel);
            await this.sendVerifyMessage(channel);
            
            console.log('✅ Premium Verify System initialized successfully');
        } catch (error) {
            console.error('❌ Verify system initialization failed:', error);
        }
    }

    async cleanChannel(channel) {
        try {
            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessages = messages.filter(msg => msg.author.bot);
            
            for (const message of botMessages.values()) {
                await message.delete();
                await this.delay(100);
            }
        } catch (error) {
            console.log('⚠️ Channel cleanup warning:', error.message);
        }
    }

    async sendVerifyMessage(channel) {
        const { embed, components } = this.templates.getVerifyGateway();
        await channel.send({ embeds: [embed], components: [components] });
    }

    // ========== MAIN VERIFICATION FLOW ==========
    async handleVerify(interaction) {
        try {
            // Anti-spam protection
            if (this.verificationQueue.has(interaction.user.id)) {
                return await interaction.reply({
                    content: '⏳ Verification already in progress. Please wait...',
                    ephemeral: true
                });
            }

            this.verificationQueue.set(interaction.user.id, true);

            if (interaction.member.roles.cache.has(this.config.memberRoleId)) {
                this.verificationQueue.delete(interaction.user.id);
                return await this.handlers.handleAlreadyVerified(interaction);
            }

            // Start verification progress
            await this.executeVerificationProgress(interaction);

        } catch (error) {
            console.error('Verify handling error:', error);
            this.verificationQueue.delete(interaction.user.id);
            
            await interaction.reply({
                content: '❌ System error. Please try again later.',
                ephemeral: true
            });
        }
    }

    async executeVerificationProgress(interaction) {
        const steps = [
            { percent: 5, delay: 2000, phase: 'BOOT_UP' },
            { percent: 25, delay: 2500, phase: 'CREDENTIAL_ANALYSIS' },
            { percent: 50, delay: 3000, phase: 'SECURITY_SCAN' },
            { percent: 75, delay: 2000, phase: 'IDENTITY_VERIFICATION' },
            { percent: 95, delay: 1500, phase: 'FINALIZING' },
            { percent: 100, delay: 1000, phase: 'COMPLETE' }
        ];

        let currentReply = await interaction.reply({ 
            embeds: [this.templates.getProgressEmbed(5, 'BOOT_UP')], 
            ephemeral: true 
        });

        for (const step of steps) {
            await this.delay(step.delay);
            
            const embed = this.templates.getProgressEmbed(step.percent, step.phase);
            await interaction.editReply({ embeds: [embed] });
        }

        // Final success message
        await this.delay(1000);
        await this.handlers.showVerificationSuccess(interaction);
        
        this.verificationQueue.delete(interaction.user.id);
    }

    // ========== SESSION MANAGEMENT ==========
    createUserSession(userId, data = {}) {
        const session = {
            id: userId,
            createdAt: Date.now(),
            step: 'verified',
            data: { ...data },
            message: null,
            lastActivity: Date.now()
        };
        
        this.userSessions.set(userId, session);
        this.cleanupExpiredSessions();
        return session;
    }

    getUserSession(userId) {
        this.cleanupExpiredSessions();
        return this.userSessions.get(userId);
    }

    updateUserSession(userId, updates) {
        const session = this.getUserSession(userId);
        if (session) {
            Object.assign(session, updates, { lastActivity: Date.now() });
            this.userSessions.set(userId, session);
        }
        return session;
    }

    cleanupExpiredSessions() {
        const now = Date.now();
        const expired = [];
        
        for (const [userId, session] of this.userSessions) {
            if (now - session.lastActivity > 30 * 60 * 1000) { // 30 minutes
                expired.push(userId);
            }
        }
        
        expired.forEach(userId => this.userSessions.delete(userId));
    }

    // ========== ROLE & ACCESS MANAGEMENT ==========
    async grantMemberAccess(interaction) {
        try {
            const memberRole = interaction.guild.roles.cache.get(this.config.memberRoleId);
            if (!memberRole) throw new Error('Member role not found');

            await interaction.member.roles.add(memberRole);
            
            // Send welcome DM
            await this.sendWelcomeDM(interaction);
            
            return true;
        } catch (error) {
            console.error('Role assignment error:', error);
            throw error;
        }
    }

    async sendWelcomeDM(interaction) {
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 Welcome to BananaSkiee Community!')
                .setDescription(`Hello ${interaction.user.username}! Welcome to our premium community.`)
                .addFields(
                    {
                        name: '🚀 Getting Started',
                        value: '• Introduce yourself in #introductions\n• Check out #community-guide\n• Explore channels based on your interests'
                    },
                    {
                        name: '🎯 Next Steps',
                        value: '• Join ongoing conversations\n• Check event calendar\n• Connect with other members'
                    }
                )
                .setFooter({ text: 'We\'re excited to have you here! 🎊' });

            await interaction.user.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.log('⚠️ Could not send welcome DM');
        }
    }

    // ========== LOGGING SYSTEM ==========
    async logVerification(interaction, type, data = {}) {
        try {
            const logChannel = interaction.guild.channels.cache.get(this.config.logChannelId);
            if (!logChannel) return;

            const embed = this.templates.getLogEmbed(interaction, type, data);
            await logChannel.send({ embeds: [embed] });

            // Database logging
            await this.database.logVerification({
                userId: interaction.user.id,
                username: interaction.user.tag,
                type: type,
                timestamp: new Date(),
                data: data
            });

        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    // ========== UTILITY METHODS ==========
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    generateSessionId() {
        return `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = VerifySystem;
