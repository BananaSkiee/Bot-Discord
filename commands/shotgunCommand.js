const { SlashCommandBuilder } = require('discord.js');
const ShotgunDuels = require('../modules/shotgunDuels');

const gameManager = new ShotgunDuels();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shotgun')
        .setDescription('Main game Shotgun Duels dengan pemain lain!')
        .addUserOption(option =>
            option.setName('lawan')
                .setDescription('Pilih lawan untuk duel')
                .setRequired(true)),
    
    async execute(interaction) {
        const opponent = interaction.options.getUser('lawan');
        
        if (opponent.bot) {
            return await interaction.reply({ 
                content: '❌ Tidak bisa main dengan bot!', 
                ephemeral: true 
            });
        }
        
        if (opponent.id === interaction.user.id) {
            return await interaction.reply({ 
                content: '❌ Tidak bisa main dengan diri sendiri!', 
                ephemeral: true 
            });
        }

        // Check if either player is already in a game
        for (const game of gameManager.games.values()) {
            if (game.players.some(p => p.id === interaction.user.id || p.id === opponent.id)) {
                return await interaction.reply({ 
                    content: '❌ Salah satu pemain sedang dalam game!', 
                    ephemeral: true 
                });
            }
        }

        await interaction.reply({
            content: `🎮 **Shotgun Duels Dimulai!**\n${interaction.user} vs ${opponent}\nGame akan segera dimulai...`,
            ephemeral: false
        });

        // Start the game
        gameManager.startGame(interaction.user, opponent, interaction.channel);
    },
    
    // Export game manager for interaction handling
    gameManager
};
