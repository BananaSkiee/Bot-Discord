const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ShotgunDuels = require('../modules/shotgunDuels');

const gameManager = new ShotgunDuels();
const pendingDuels = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shotgun')
        .setDescription('Main game Shotgun Duels dengan pemain lain!')
        .addUserOption(option =>
            option.setName('lawan')
                .setDescription('Pilih lawan untuk duel')
                .setRequired(true)),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: false });
            
            const opponent = interaction.options.getUser('lawan');
            
            if (opponent.bot) {
                return await interaction.editReply({ 
                    content: '❌ Tidak bisa main dengan bot!' 
                });
            }
            
            if (opponent.id === interaction.user.id) {
                return await interaction.editReply({ 
                    content: '❌ Tidak bisa main dengan diri sendiri!' 
                });
            }

            // Check if either player is already in a game - FIXED
            if (gameManager.isPlayerInGame(interaction.user.id)) {
                return await interaction.editReply({ 
                    content: '❌ Kamu sedang dalam game!' 
                });
            }

            if (gameManager.isPlayerInGame(opponent.id)) {
                return await interaction.editReply({ 
                    content: '❌ Lawan sedang dalam game!' 
                });
            }

            // Check if there's already a pending duel
            for (const [key, duel] of pendingDuels.entries()) {
                if (duel.challenger.id === interaction.user.id || duel.challenger.id === opponent.id ||
                    duel.opponent.id === interaction.user.id || duel.opponent.id === opponent.id) {
                    return await interaction.editReply({ 
                        content: '❌ Salah satu pemain sudah ada duel yang pending!' 
                    });
                }
            }

            // Create duel request
            const duelId = `${interaction.user.id}-${opponent.id}-${Date.now()}`;
            const duel = {
                id: duelId,
                challenger: interaction.user,
                opponent: opponent,
                channel: interaction.channel,
                timestamp: Date.now()
            };

            pendingDuels.set(duelId, duel);

            // Create accept/reject buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept_duel_${duelId}`)
                        .setLabel('Terima Duel')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`reject_duel_${duelId}`)
                        .setLabel('Tolak Duel')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger)
                );

            const embed = new EmbedBuilder()
                .setTitle('🎯 SHOTGUN DUEL REQUEST')
                .setDescription(`**${interaction.user.username}** menantang **${opponent.username}** untuk Shotgun Duel!`)
                .addFields(
                    { name: '🎯 Challenger', value: `${interaction.user}`, inline: true },
                    { name: '🛡️ Opponent', value: `${opponent}`, inline: true }
                )
                .setColor(0x00AE86)
                .setFooter({ text: 'Duel akan expired dalam 1 menit' });

            await interaction.editReply({ 
                content: `${opponent}`, // Mention the opponent
                embeds: [embed], 
                components: [row] 
            });

            // Auto-reject after 1 minute
            setTimeout(() => {
                if (pendingDuels.has(duelId)) {
                    pendingDuels.delete(duelId);
                    interaction.followUp({
                        content: `⏰ Duel request dari ${interaction.user} ke ${opponent} expired!`,
                        ephemeral: false
                    }).catch(console.error);
                }
            }, 60000);

        } catch (error) {
            console.error('❌ Error in shotgun command:', error);
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '❌ Terjadi error saat memulai duel!'
                });
            } else {
                await interaction.reply({
                    content: '❌ Terjadi error saat memulai duel!',
                    ephemeral: true
                });
            }
        }
    },

    // Method to handle duel acceptance
    async acceptDuel(duelId, interaction) {
        const duel = pendingDuels.get(duelId);
        if (!duel) {
            await interaction.reply({
                content: '❌ Duel request tidak ditemukan atau sudah expired!',
                ephemeral: true
            });
            return;
        }

        if (interaction.user.id !== duel.opponent.id) {
            await interaction.reply({
                content: '❌ Hanya yang ditantang yang bisa menerima duel!',
                ephemeral: true
            });
            return;
        }

        // Remove from pending
        pendingDuels.delete(duelId);

        // Start the game
        await interaction.reply({
            content: `🎮 **${duel.opponent.username} MENERIMA DUEL!**\n${duel.challenger} vs ${duel.opponent}\nMemulai game...`
        });

        const gameId = gameManager.startGame(duel.challenger, duel.opponent, duel.channel);
        
        if (gameId) {
            const game = gameManager.getGame(gameId);
            await gameManager.sendGameState(game, interaction);
        } else {
            await interaction.followUp({
                content: '❌ Gagal memulai game!'
            });
        }
    },

    // Method to handle duel rejection
    async rejectDuel(duelId, interaction) {
        const duel = pendingDuels.get(duelId);
        if (!duel) {
            await interaction.reply({
                content: '❌ Duel request tidak ditemukan atau sudah expired!',
                ephemeral: true
            });
            return;
        }

        if (interaction.user.id !== duel.opponent.id) {
            await interaction.reply({
                content: '❌ Hanya yang ditantang yang bisa menolak duel!',
                ephemeral: true
            });
            return;
        }

        // Remove from pending
        pendingDuels.delete(duelId);

        await interaction.reply({
            content: `❌ **${duel.opponent.username} MENOLAK DUEL!**\n${duel.challenger} - duel dibatalkan.`
        });
    },
    
    // Export game manager untuk interaction handling
    gameManager: gameManager,
    pendingDuels: pendingDuels
};
