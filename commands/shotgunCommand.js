// commands/shotgunCommand.js
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
            await interaction.deferReply();
            
            const opponent = interaction.options.getUser('lawan');
            
            if (opponent.bot) return await interaction.editReply('❌ Tidak bisa main dengan bot!');
            if (opponent.id === interaction.user.id) return await interaction.editReply('❌ Tidak bisa main dengan diri sendiri!');
            if (gameManager.isPlayerInGame(interaction.user.id) || gameManager.isPlayerInGame(opponent.id)) {
                return await interaction.editReply('❌ Salah satu pemain sedang dalam game!');
            }

            const duelId = `${interaction.user.id}-${opponent.id}`;
            pendingDuels.set(duelId, { challenger: interaction.user, opponent: opponent });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`accept_duel_${duelId}`).setLabel('Terima').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`reject_duel_${duelId}`).setLabel('Tolak').setStyle(ButtonStyle.Danger)
            );

            const embed = new EmbedBuilder()
                .setTitle('⚔️ TANTANGAN DUEL')
                .setColor(0x5865F2)
                .setDescription(`**${interaction.user.username}** menantang **${opponent.username}** untuk duel shotgun!`);

            await interaction.editReply({ content: `${opponent}`, embeds: [embed], components: [row] });

            // Auto expire 1 menit
            setTimeout(() => {
                if (pendingDuels.has(duelId)) {
                    pendingDuels.delete(duelId);
                    interaction.editReply({ content: '⏰ Tantangan expired.', embeds: [], components: [] }).catch(() => {});
                }
            }, 60000);

        } catch (error) {
            console.error(error);
        }
    },

    async acceptDuel(duelId, interaction) {
        const duel = pendingDuels.get(duelId);
        if (!duel) return interaction.reply({ content: '❌ Tantangan sudah tidak ada.', ephemeral: true });
        if (interaction.user.id !== duel.opponent.id) return interaction.reply({ content: '❌ Bukan kamu yang ditantang!', ephemeral: true });

        pendingDuels.delete(duelId);
        await interaction.update({ content: '🎮 Duel Dimulai!', embeds: [], components: [] });
        await gameManager.startGame(duel.challenger, duel.opponent, interaction.channel, interaction);
    },

    async rejectDuel(duelId, interaction) {
        const duel = pendingDuels.get(duelId);
        if (!duel) return interaction.reply({ content: '❌ Tantangan sudah tidak ada.', ephemeral: true });
        if (interaction.user.id !== duel.opponent.id) return interaction.reply({ content: '❌ Bukan kamu yang ditantang!', ephemeral: true });

        pendingDuels.delete(duelId);
        await interaction.update({ content: '❌ Duel ditolak.', embeds: [], components: [] });
    },
    
    gameManager: gameManager
};
