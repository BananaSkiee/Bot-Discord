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

            // Check if either player is already in a game
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
                        .setEmoji('⚔️')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`reject_duel_${duelId}`)
                        .setLabel('Tolak Duel')
                        .setEmoji('🚫')
                        .setStyle(ButtonStyle.Danger)
                );

            const embed = new EmbedBuilder()
                .setTitle('🎯 SHOTGUN DUEL REQUEST')
                .setColor(0x5865F2)
                .setDescription(`## ⚔️ TANTANGAN DUEL DITERBITKAN!\n\n**${interaction.user.username}** menantang **${opponent.username}** untuk Shotgun Duel!`)
                .addFields(
                    { 
                        name: '🎯 CHALLENGER', 
                        value: `${interaction.user}\n\`${interaction.user.username}\``, 
                        inline: true 
                    },
                    { 
                        name: '🛡️ OPPONENT', 
                        value: `${opponent}\n\`${opponent.username}\``, 
                        inline: true 
                    },
                    {
                        name: '📋 GAME INFO',
                        value: '• 5 HP per pemain\n• 8 Chamber peluru\n• Item dan efek spesial\n• Strategi dan keberuntungan!',
                        inline: false
                    }
                )
                .setThumbnail('https://cdn.discordapp.com/emojis/1093993933549457448.webp')
                .setFooter({ text: '⏰ Duel request akan expired dalam 1 menit' })
                .setTimestamp();

            await interaction.editReply({ 
                content: `${opponent}`, // Mention the opponent
                embeds: [embed], 
                components: [row] 
            });

            // Auto-reject after 1 minute
            setTimeout(() => {
                if (pendingDuels.has(duelId)) {
                    pendingDuels.delete(duelId);
                    
                    const expiredEmbed = new EmbedBuilder()
                        .setColor(0xFF6B6B)
                        .setTitle('⏰ DUEL EXPIRED')
                        .setDescription(`**Duel request telah expired!**\n\n${interaction.user} → ${opponent}\n\n*Tantangan tidak direspons dalam waktu 1 menit.*`)
                        .setFooter({ text: 'Gunakan /shotgun untuk membuat duel baru' });

                    interaction.editReply({ 
                        content: `${interaction.user} ${opponent}`,
                        embeds: [expiredEmbed], 
                        components: [] 
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

        // Edit the original message to show accepted status
        const acceptedEmbed = new EmbedBuilder()
            .setTitle('🎮 DUEL DITERIMA!')
            .setColor(0x00FF00)
            .setDescription(`## ⚔️ DUEL SEDANG DIMULAI!\n\n**${duel.opponent.username}** menerima tantangan dari **${duel.challenger.username}**!`)
            .addFields(
                { 
                    name: '🎯 PEMAIN', 
                    value: `${duel.challenger}\n**VS**\n${duel.opponent}`, 
                    inline: false 
                },
                {
                    name: '🚀 STATUS',
                    value: 'Mempersiapkan game...\n• Gacha items\n• Reveal chamber\n• Start gameplay',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/emojis/1093993933549457448.webp')
            .setFooter({ text: 'Bersiaplah untuk duel!' })
            .setTimestamp();

        await interaction.update({ 
            content: `${duel.challenger} ${duel.opponent}`,
            embeds: [acceptedEmbed], 
            components: [] 
        });

        // Start the game
        const gameId = await gameManager.startGame(duel.challenger, duel.opponent, duel.channel, interaction);
        
        if (!gameId) {
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

        const rejectedEmbed = new EmbedBuilder()
            .setTitle('🚫 DUEL DITOLAK')
            .setColor(0xFF6B6B)
            .setDescription(`## ❌ TANTANGAN DITOLAK!\n\n**${duel.opponent.username}** menolak tantangan dari **${duel.challenger.username}**!`)
            .addFields(
                { 
                    name: '🎯 PEMAIN', 
                    value: `${duel.challenger} → ${duel.opponent}`, 
                    inline: false 
                },
                {
                    name: '💡 SUGGESTION',
                    value: 'Coba tantang pemain lain atau tunggu waktu yang lebih tepat!',
                    inline: false
                }
            )
            .setFooter({ text: 'Gunakan /shotgun untuk membuat duel baru' })
            .setTimestamp();

        await interaction.update({ 
            content: `${duel.challenger} ${duel.opponent}`,
            embeds: [rejectedEmbed], 
            components: [] 
        });
    },
    
    // Export game manager untuk interaction handling
    gameManager: gameManager,
    pendingDuels: pendingDuels
};
