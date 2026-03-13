const { SlashCommandBuilder } = require('discord.js');
const ShotgunLogic = require('../modules/shotgunDuels');

module.exports = {
    gameManager: ShotgunLogic, // Export logic-nya supaya bisa diakses interactionCreate
    data: new SlashCommandBuilder()
        .setName('shotgun')
        .setDescription('Duel shotgun maut dengan Component v2!')
        .addUserOption(opt => opt.setName('lawan').setDescription('Pilih lawanmu').setRequired(true)),

    async execute(interaction) {
        const opponent = interaction.options.getUser('lawan');
        const challenger = interaction.user;
        
        if (opponent.bot) return interaction.reply({ content: "❌ Tidak bisa melawan bot!", ephemeral: true });
        if (opponent.id === challenger.id) return interaction.reply({ content: "❌ Jangan bunuh diri dulu!", ephemeral: true });
        
        // Buat ID game unik
        const gameId = `sg-${Date.now()}`;
        
        // Template Awal (Menantang)
        const payload = {
            components: [{
                type: 17,
                components: [
                    { type: 12, items: [] },
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: `\n**Hey <@${opponent.id}>, ${challenger.username} menantang\nKamu bermain game Shotgun Duels**\n\n>>> **Accept**, *untuk menerimanya*\n**Reject**, *untuk menolaknya*` },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: 3, type: 2, label: "Accept", custom_id: `sg_accept_${gameId}_${challenger.id}_${opponent.id}` },
                            { style: 2, type: 2, label: "◼️", custom_id: `sg_decor_1`, disabled: true },
                            { style: 4, type: 2, label: "Reject", custom_id: `sg_reject_${gameId}_${challenger.id}` }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        };

        await interaction.reply(payload);
    }
};
