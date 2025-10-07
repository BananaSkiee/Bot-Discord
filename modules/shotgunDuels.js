const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ROUND_START_ITEMS = [1, 2, 3, 4];
        this.ITEMS = {
            '🚬': { name: 'Rokok', effect: 'Heal +1 HP (max 5)', reusable: false },
            '🍺': { name: 'Minum', effect: 'Buang peluru terdepan', reusable: false },
            '🔪': { name: 'Kater', effect: 'Next hit damage 2x', reusable: false },
            '🔎': { name: 'Lup', effect: 'Lihat chamber berikutnya', reusable: false },
            '🔗': { name: 'Borgol', effect: 'Dapat 2x tembak dalam 1 giliran', reusable: false }
        };
        this.afkTimeouts = new Map();
        this.gachaTimeouts = new Map();
    }

    generateChambers() {
        let chambers;
        do {
            const empty = Math.floor(Math.random() * 5) + 2;
            const loaded = 8 - empty;
            chambers = [
                ...Array(loaded).fill('💥'),
                ...Array(empty).fill('⚪')
            ].sort(() => Math.random() - 0.5);
        } while (
            chambers.filter(c => c === '💥').length >= 7 || 
            chambers.filter(c => c === '💥').length <= 1
        );
        return chambers;
    }

    generateItems() {
        const itemCount = this.ROUND_START_ITEMS[Math.floor(Math.random() * this.ROUND_START_ITEMS.length)];
        const availableItems = Object.keys(this.ITEMS);
        const items = [];
        
        for (let i = 0; i < itemCount; i++) {
            const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
            items.push(randomItem);
        }
        return items;
    }

    async startGame(player1, player2, channel, interaction) {
        try {
            const gameId = `${player1.id}-${player2.id}-${Date.now()}`;
            
            // Acak siapa yang mulai pertama
            const randomStarter = Math.random() < 0.5 ? 0 : 1;
            const players = randomStarter === 0 ? [player1, player2] : [player2, player1];
            
            const game = {
                id: gameId,
                players: players,
                currentPlayer: 0,
                chambers: [],
                currentChamber: 0,
                items: { 
                    [players[0].id]: [],
                    [players[1].id]: []
                },
                health: { [players[0].id]: 5, [players[1].id]: 5 },
                effects: { 
                    [players[0].id]: { kater: false, borgol: false, borgolShots: 0 },
                    [players[1].id]: { kater: false, borgol: false, borgolShots: 0 }
                },
                channel: channel,
                messageId: null,
                actionMessageId: null,
                actionLog: [],
                stage: 'gacha',
                gachaStage: 0
            };

            this.games.set(gameId, game);
            
            await this.sendGachaStage(game, interaction);
            return gameId;
        } catch (error) {
            console.error('❌ Error in startGame:', error);
            return null;
        }
    }

    addActionLog(game, message) {
        game.actionLog.push(message);
        if (game.actionLog.length > 5) {
            game.actionLog.shift();
        }
    }

    async sendActionMessage(game, interaction, content) {
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setDescription(content)
            .setFooter({ text: `Game ID: ${game.id.slice(-6)}` });

        if (game.actionMessageId && interaction) {
            try {
                const message = await interaction.channel.messages.fetch(game.actionMessageId);
                await message.edit({ embeds: [embed] });
            } catch (error) {
                const newMessage = await interaction.channel.send({ embeds: [embed] });
                game.actionMessageId = newMessage.id;
            }
        } else {
            const message = await game.channel.send({ embeds: [embed] });
            game.actionMessageId = message.id;
        }

        this.games.set(game.id, game);
    }

    async sendGachaStage(game, interaction) {
        // Clear existing timeout
        if (this.gachaTimeouts.has(game.id)) {
            clearTimeout(this.gachaTimeouts.get(game.id));
        }

        const player = game.players[0];
        const opponent = game.players[1];
        
        let description = '';
        let components = [];

        if (game.gachaStage === 0) {
            description = `## 🎁 WAKTU GACHA ITEM!\n\n**${player.username}** tekan tombol di bawah untuk gacha itemmu!\n\n*⏰ Otomatis gacha dalam 15 detik*`;
            components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`gacha_items_${game.id}_0`)
                        .setLabel('Gacha Items')
                        .setEmoji('🎁')
                        .setStyle(ButtonStyle.Success)
                )
            ];

            // Auto-gacha untuk player 1
            const timeout = setTimeout(async () => {
                const currentGame = this.games.get(game.id);
                if (currentGame && currentGame.gachaStage === 0) {
                    console.log(`⏰ Auto-gacha untuk ${player.username}`);
                    const items = this.generateItems();
                    currentGame.items[player.id] = items;
                    currentGame.gachaStage++;
                    this.games.set(game.id, currentGame);

                    // Kirim hasil gacha sebagai message baru (LOG)
                    const autoGachaEmbed = new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('🎯 SHOTGUN DUELS - GACHA RESULT')
                        .setDescription(`## ⏰ GACHA OTOMATIS!\n\n**${player.username}** mendapatkan items:\n${items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`)
                        .setFooter({ text: 'Menunggu player 2...' });

                    await game.channel.send({ 
                        content: `${player}`,
                        embeds: [autoGachaEmbed] 
                    });

                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await this.sendGachaStage(currentGame, interaction);
                }
            }, 15000);

            this.gachaTimeouts.set(game.id, timeout);

        } else if (game.gachaStage === 1) {
            description = `## 🎁 WAKTU GACHA ITEM!\n\n**${opponent.username}** tekan tombol di bawah untuk gacha itemmu!\n\n*⏰ Otomatis gacha dalam 15 detik*`;
            components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`gacha_items_${game.id}_1`)
                        .setLabel('Gacha Items')
                        .setEmoji('🎁')
                        .setStyle(ButtonStyle.Success)
                )
            ];

            // Auto-gacha untuk player 2
            const timeout = setTimeout(async () => {
                const currentGame = this.games.get(game.id);
                if (currentGame && currentGame.gachaStage === 1) {
                    console.log(`⏰ Auto-gacha untuk ${opponent.username}`);
                    const items = this.generateItems();
                    currentGame.items[opponent.id] = items;
                    currentGame.gachaStage++;
                    this.games.set(game.id, currentGame);

                    // Kirim hasil gacha sebagai message baru (LOG)
                    const autoGachaEmbed = new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('🎯 SHOTGUN DUELS - GACHA RESULT')
                        .setDescription(`## ⏰ GACHA OTOMATIS!\n\n**${opponent.username}** mendapatkan items:\n${items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`)
                        .setFooter({ text: 'Beralih ke reveal chamber...' });

                    await game.channel.send({ 
                        content: `${opponent}`,
                        embeds: [autoGachaEmbed] 
                    });

                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await this.sendGachaStage(currentGame, interaction);
                }
            }, 15000);

            this.gachaTimeouts.set(game.id, timeout);

        } else if (game.gachaStage === 2) {
            description = `## 🔫 REVEAL CHAMBER!\n\nTekan tombol untuk melihat chamber!\n\n*⏰ Otomatis reveal dalam 15 detik*`;
            components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`reveal_chamber_${game.id}`)
                        .setLabel('Reveal Chamber')
                        .setEmoji('🔫')
                        .setStyle(ButtonStyle.Primary)
                )
            ];

            // Auto-reveal chamber
            const timeout = setTimeout(async () => {
                const currentGame = this.games.get(game.id);
                if (currentGame && currentGame.gachaStage === 2) {
                    console.log(`⏰ Auto-reveal chamber`);
                    await this.revealChamber(game.id, interaction);
                }
            }, 15000);

            this.gachaTimeouts.set(game.id, timeout);
        }

        const embed = new EmbedBuilder()
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setColor(0x5865F2)
            .setDescription(description);

        let content = '';
        if (game.gachaStage === 0) content = `**🎮 ${player.username} 🆚 ${opponent.username}**\n${player}`;
        else if (game.gachaStage === 1) content = `**🎮 ${player.username} 🆚 ${opponent.username}**\n${opponent}`;
        else content = `**🎮 ${player.username} 🆚 ${opponent.username}**`;

        if (game.messageId) {
            try {
                const message = await game.channel.messages.fetch(game.messageId);
                await message.edit({ 
                    content: content,
                    embeds: [embed], 
                    components: components 
                });
            } catch (error) {
                console.error('❌ Error editing message:', error);
                const newMessage = await game.channel.send({ 
                    content: content,
                    embeds: [embed], 
                    components: components 
                });
                game.messageId = newMessage.id;
            }
        } else {
            const message = await game.channel.send({ 
                content: content,
                embeds: [embed], 
                components: components 
            });
            game.messageId = message.id;
        }

        this.games.set(game.id, game);
    }

    async processGacha(gameId, playerIndex, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            await interaction.reply({ content: '❌ Game tidak ditemukan!', ephemeral: true });
            return;
        }

        // Clear timeout jika user klik manual
        if (this.gachaTimeouts.has(gameId)) {
            clearTimeout(this.gachaTimeouts.get(gameId));
            this.gachaTimeouts.delete(gameId);
        }

        const player = game.players[playerIndex];
        const items = this.generateItems();
        game.items[player.id] = items;

        // 1. TAMPILKAN ANIMASI GACHA DI MESSAGE UTAMA
        const gachaEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎰 SEDANG GACHA ITEM!\n\n**${player.username}** sedang gacha items...\n\n${'🎰 '.repeat(5)}`);

        try {
            await interaction.update({ 
                embeds: [gachaEmbed], 
                components: [] // Hilangkan tombol selama animasi
            });
        } catch (error) {
            console.error('❌ Error updating interaction:', error);
            return;
        }

        // 2. TUNGGU 2 DETIK UNTUK ANIMASI
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. TAMPILKAN HASIL GACHA DI MESSAGE UTAMA
        const resultEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎁 ITEM DIDAPATKAN!\n\n**${player.username}** mendapatkan items:\n${items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`);

        await interaction.editReply({ 
            embeds: [resultEmbed] 
        });

        // 4. KIRIM HASIL GACHA SEBAGAI MESSAGE BARU (LOG)
        const logEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - GACHA RESULT')
            .setDescription(`## 🎁 HASIL GACHA!\n\n**${player.username}** mendapatkan items:\n${items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`)
            .setFooter({ text: 'Gacha manual - lebih banyak item!' });

        await game.channel.send({ 
            content: `${player}`,
            embeds: [logEmbed] 
        });

        // 5. LANJUT KE PLAYER BERIKUTNYA ATAU REVEAL CHAMBER
        game.gachaStage++;
        this.games.set(game.id, game);

        // Tunggu 3 detik sebelum lanjut
        await new Promise(resolve => setTimeout(resolve, 3000));

        await this.sendGachaStage(game, interaction);
    }

    async revealChamber(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Clear timeout
        if (this.gachaTimeouts.has(gameId)) {
            clearTimeout(this.gachaTimeouts.get(gameId));
            this.gachaTimeouts.delete(gameId);
        }

        game.chambers = this.generateChambers();
        const loadedCount = game.chambers.filter(c => c === '💥').length;
        const emptyCount = game.chambers.filter(c => c === '⚪').length;

        // 1. ANIMASI REVEAL DI MESSAGE UTAMA
        const revealEmbed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 CHAMBER REVEAL!\n\nMengungkap chamber...\n\n${'❓'.repeat(8)}`);

        try {
            await interaction.update({ 
                embeds: [revealEmbed], 
                components: [] 
            });
        } catch (error) {
            console.error('❌ Error updating interaction:', error);
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. TAMPILKAN HASIL REVEAL DI MESSAGE UTAMA
        const resultEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 CHAMBER TERUNGKAP!\n\n**💥 ${loadedCount} Loaded • ⚪ ${emptyCount} Empty**\n\n*Game akan dimulai dalam 3 detik!*`);

        await interaction.editReply({ 
            embeds: [resultEmbed] 
        });

        // 3. KIRIM HASIL REVEAL SEBAGAI MESSAGE BARU (LOG)
        const logEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('🎯 SHOTGUN DUELS - CHAMBER INFO')
            .setDescription(`## 🔫 CHAMBER TERUNGKAP!\n\n**💥 ${loadedCount} Loaded • ⚪ ${emptyCount} Empty**\n\nChamber siap untuk duel!`)
            .setFooter({ text: 'Game dimulai!' });

        await game.channel.send({ 
            content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
            embeds: [logEmbed] 
        });

        game.stage = 'gameplay';
        this.games.set(game.id, game);

        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.startGameplay(game, interaction);
    }

    async startGameplay(game, interaction) {
        game.stage = 'gameplay';
        game.chambers = this.generateChambers();
        this.games.set(game.id, game);
        await this.sendGameState(game, interaction);
    }

    // ... (method sendGameState dan lainnya tetap sama)

    async sendGameState(game, interaction = null) {
        try {
            const player = game.players[game.currentPlayer];
            const opponent = game.players[1 - game.currentPlayer];
            
            if (game.currentChamber >= 8) {
                await this.resetChambers(game, interaction);
                return await this.sendGameState(game, interaction);
            }
            
            const chamberInfo = `**${game.currentChamber + 1}/8**\n🎯 ???? • ????`;

            const embed = new EmbedBuilder()
                .setTitle('🎯 SHOTGUN DUELS')
                .setColor(0x2F3136)
                .setDescription(`### ${player.username} 🆚 ${opponent.username}`)
                .addFields(
                    {
                        name: '❤️ HEALTH',
                        value: `🟥 ${player.username}: ${'❤️'.repeat(game.health[player.id])}${'♡'.repeat(5 - game.health[player.id])}\n🟦 ${opponent.username}: ${'❤️'.repeat(game.health[opponent.id])}${'♡'.repeat(5 - game.health[opponent.id])}`,
                        inline: true
                    },
                    {
                        name: '🔫 CHAMBER',
                        value: chamberInfo,
                        inline: true
                    },
                    {
                        name: '🎒 ITEMS',
                        value: `**${player.username}:**\n${game.items[player.id].map(item => `${item} ${this.ITEMS[item].name}`).join('\n') || 'No items'}\n\n**${opponent.username}:**\n${game.items[opponent.id].map(item => `${item} ${this.ITEMS[item].name}`).join('\n') || 'No items'}`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `🎯 Turn: ${player.username} • AFK dalam 5 menit akan kalah!` 
                })
                .setTimestamp();

            const itemButtons = [];
            game.items[player.id].forEach((item, index) => {
                itemButtons.push(
                    new ButtonBuilder()
                        .setCustomId(`item_${game.id}_${index}`)
                        .setLabel(this.ITEMS[item].name)
                        .setEmoji(item)
                        .setStyle(ButtonStyle.Primary)
                );
            });

            const itemRow = itemButtons.length > 0 ? 
                new ActionRowBuilder().addComponents(...itemButtons.slice(0, 5)) : null;

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`shoot_self_${game.id}`)
                    .setLabel('Shoot Self')
                    .setEmoji('🎯')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`shoot_opponent_${game.id}`)
                    .setLabel(`Shoot ${opponent.username}`)
                    .setEmoji('🔫')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`surrender_${game.id}`)
                    .setLabel('Surrender')
                    .setEmoji('🏳️')
                    .setStyle(ButtonStyle.Secondary)
            );

            const components = [];
            if (itemRow) components.push(itemRow);
            components.push(actionRow);

            const content = `**🎯 GILIRAN: ${player}**`;
            
            if (game.messageId) {
                try {
                    const message = await game.channel.messages.fetch(game.messageId);
                    await message.edit({ 
                        content: content,
                        embeds: [embed], 
                        components: components 
                    });
                } catch (error) {
                    const newMessage = await game.channel.send({ 
                        content: content,
                        embeds: [embed], 
                        components: components 
                    });
                    game.messageId = newMessage.id;
                }
            } else {
                const message = await game.channel.send({ 
                    content: content,
                    embeds: [embed], 
                    components: components 
                });
                game.messageId = message.id;
            }

            this.setAfkTimeout(game.id, 300000);
            this.games.set(game.id, game);

        } catch (error) {
            console.error('❌ Error in sendGameState:', error);
        }
    }

    // ... (method lainnya tetap sama)

}

module.exports = ShotgunDuels;
