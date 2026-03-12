const { SlashCommandBuilder } = require('discord.js');
const shotgunModule = require('../modules/shotgunDuels'); // Path sesuaikan folder lu

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shotgun')
        .setDescription('Duel shotgun maut dengan Component v2!')
        .addUserOption(opt => opt.setName('lawan').setDescription('Pilih lawanmu').setRequired(true)),

    async execute(interaction) {
        const opponent = interaction.options.getUser('lawan');
        
        if (opponent.bot) return interaction.reply({ content: "❌ Tidak bisa melawan bot!", ephemeral: true });
        if (opponent.id === interaction.user.id) return interaction.reply({ content: "❌ Jangan bunuh diri dulu, mending cari lawan!", ephemeral: true });
        
        // Cek apakah pemain sedang dalam game
        const isP1Busy = [...shotgunModule.games.values()].some(g => g.players.some(p => p.id === interaction.user.id));
        const isP2Busy = [...shotgunModule.games.values()].some(g => g.players.some(p => p.id === opponent.id));

        if (isP1Busy || isP2Busy) {
            return interaction.reply({ content: "❌ Salah satu pemain masih dalam game!", ephemeral: true });
        }

        await interaction.reply({ content: "🔫 Menyiapkan arena duel...", ephemeral: true });
        // Panggil fungsi start langsung dari module
        await shotgunModule.startGame(interaction.user, opponent, interaction.channel);
    }
};
