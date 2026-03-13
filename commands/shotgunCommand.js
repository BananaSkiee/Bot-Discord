const { SlashCommandBuilder } = require('discord.js');
const ShotgunLogic = require('../modules/shotgunDuels');

// Inisialisasi manager supaya datanya bisa diakses secara global oleh bot
const manager = new ShotgunLogic();

module.exports = {
    // Export manager supaya interactionCreate.js bisa manggil gameManager.acceptDuel dll.
    gameManager: manager,

    // Data command (Otomatis Public karena tidak ada setDefaultMemberPermissions)
    data: new SlashCommandBuilder()
        .setName('shotgun')
        .setDescription('Tantang siapa saja untuk duel Shotgun maut!')
        .addUserOption(opt => 
            opt.setName('lawan')
                .setDescription('Pilih user yang ingin lu tantang')
                .setRequired(true)
        ),

    async execute(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('lawan');

        // Validasi dasar
        if (opponent.bot) return interaction.reply({ content: "❌ Lu mau duel lawan AI? Gak seru, pilih manusia!", ephemeral: true });
        if (opponent.id === challenger.id) return interaction.reply({ content: "❌ Jangan bunuh diri, hidup ini indah!", ephemeral: true });

        // Buat ID game unik pake timestamp + string random dikit
        const gameId = `sg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Payload menggunakan Component V2 (Container/Type 17)
        // Pastikan discord.js lu versi terbaru buat support ini
        const payload = {
            content: `<@${opponent.id}>`, // Mention biar lawan tau dia ditantang
            components: [{
                type: 17, // Container
                components: [
                    { type: 12, items: [] }, // Profile style visual
                    { type: 10, content: "## 🔫 SHOTGUN DUELS" },
                    { type: 14, divider: true, spacing: 1 },
                    { 
                        type: 10, 
                        content: `**${challenger.username}** telah menantang lu untuk duel maut!\n\n> Pilih **Accept** untuk mulai atau **Reject** untuk kabur.` 
                    },
                    { type: 14, spacing: 1 },
                    {
                        type: 1, // Action Row
                        components: [
                            { 
                                type: 2, 
                                style: 3, // Green
                                label: "Accept Duel", 
                                custom_id: `sg_accept_${gameId}_${challenger.id}_${opponent.id}` 
                            },
                            { 
                                type: 2, 
                                style: 4, // Red
                                label: "Reject", 
                                custom_id: `sg_reject_${gameId}` 
                            }
                        ]
                    },
                    { type: 14, divider: true },
                    { type: 10, content: `-# © BananaSkiee | Game ID: ${gameId}` }
                ]
            }]
        };

        try {
            await interaction.reply(payload);
        } catch (error) {
            console.error("❌ Gagal mengirim tantangan Shotgun:", error);
            // Fallback kalau Component V2 (Type 17) ditolak oleh server Discord lu
            await interaction.reply({ 
                content: `⚠️ **${challenger.username}** nantang **${opponent.username}** duel!\n(Bot lu butuh update discord.js buat liat tampilan kerennya).`,
                components: [
                    {
                        type: 1,
                        components: [
                            { type: 2, style: 3, label: "Accept", custom_id: `sg_accept_${gameId}_${challenger.id}_${opponent.id}` },
                            { type: 2, style: 4, label: "Reject", custom_id: `sg_reject_${gameId}` }
                        ]
                    }
                ]
            });
        }
    }
};
