// commands/shotgunCommand.js
const { SlashCommandBuilder } = require('discord.js');
const ShotgunLogic = require('../modules/shotgunDuels');

const gameManager = new ShotgunLogic();

module.exports = {
    gameManager: gameManager,
    data: new SlashCommandBuilder()
        .setName('shotgun')
        .setDescription('Duel shotgun maut!')
        .addUserOption(opt => opt.setName('lawan').setDescription('Pilih lawanmu (bisa bot)').setRequired(true)),

    async execute(interaction) {
        const opponent = interaction.options.getUser('lawan');
        const challenger = interaction.user;
        
        if (opponent.id === challenger.id) {
            return interaction.reply({ 
                content: "❌ Jangan bunuh diri dulu!", 
                flags: 64
            });
        }
        
        // Buat ID game unik
        const gameId = `sg-${Date.now()}`;
        
        let payload;
        
        if (opponent.bot) {
            // Lawan komputer - langsung mulai game dengan bot
            const botPlayer = {
                id: opponent.id,
                username: opponent.username,
                bot: true
            };
            
            // Langsung accept duel untuk bot
            await interaction.deferReply({ flags: 64 });
            
            // Buat game dengan bot
            await gameManager.acceptDuel(gameId, {
                ...interaction,
                user: { id: opponent.id } // Simulasi bot accept
            }, challenger.id, opponent.id);
            
        } else {
            // Lawan manusia - kirim tantangan
            payload = {
                flags: 32768,
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: "# Game Shotgun Duels" },
                        { type: 14 },
                        { 
                            type: 10, 
                            content: `\n**Hey <@${opponent.id}>, ${challenger.username} menantang\nKamu bermain game Shotgun Duels**\n\n>>> **Accept**, *untuk menerimanya*\n**Reject**, *untuk menolaknya*` 
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                { 
                                    style: 3, 
                                    type: 2, 
                                    label: "Accept", 
                                    custom_id: `sg_accept_${gameId}_${challenger.id}_${opponent.id}` 
                                },
                                { 
                                    style: 2, 
                                    type: 2, 
                                    label: "◼️", 
                                    custom_id: `sg_dec_${gameId}`, 
                                    disabled: true 
                                },
                                { 
                                    style: 4, 
                                    type: 2, 
                                    label: "Reject", 
                                    custom_id: `sg_reject_${gameId}_${challenger.id}` 
                                }
                            ]
                        },
                        { type: 14 },
                        { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                    ]
                }]
            };

            await interaction.reply(payload);
        }
    }
};
