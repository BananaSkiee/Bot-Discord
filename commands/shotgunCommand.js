// commands/shotgunCommand.js
const { SlashCommandBuilder } = require('discord.js');
const ShotgunDuels = require('../modules/shotgunDuels');

const gameManager = new ShotgunDuels();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shotgun')
        .setDescription('Duel shotgun maut dengan Component v2!')
        .addUserOption(opt => opt.setName('lawan').setDescription('Pilih lawanmu').setRequired(true)),

    async execute(interaction) {
        const opponent = interaction.options.getUser('lawan');
        
        if (opponent.bot) return interaction.reply({ content: "❌ Tidak bisa melawan bot!", ephemeral: true });
        if (opponent.id === interaction.user.id) return interaction.reply({ content: "❌ Jangan bunuh diri dulu, mending cari lawan!", ephemeral: true });
        
        if (gameManager.isPlayerInGame(interaction.user.id) || gameManager.isPlayerInGame(opponent.id)) {
            return interaction.reply({ content: "❌ Salah satu pemain masih dalam game!", ephemeral: true });
        }

        await interaction.reply({ content: "🔫 Menyiapkan arena duel...", ephemeral: true });
        await gameManager.startGame(interaction.user, opponent, interaction.channel);
    },

    // Panggil fungsi ini dari event interactionCreate
    async handleInteraction(interaction) {
        if (!interaction.isButton()) return;
        const [action, gameId] = interaction.customId.split('_');
        const game = gameManager.getGame(gameId);

        if (!game) return;
        if (!game.players.some(p => p.id === interaction.user.id)) {
            return interaction.reply({ content: "❌ Kamu bukan pemain di duel ini!", ephemeral: true });
        }

        await interaction.deferUpdate();
        await gameManager.handleAction(interaction.customId, gameId, interaction.user.id, interaction);
    }
};
