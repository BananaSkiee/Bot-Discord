const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ROUND_START_ITEMS = [2, 3, 4]; // Minimal 2 item, maksimal 4
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
            
            // Langsung mulai gacha sequence tanpa tombol
            await this.startGachaSequence(game, interaction);
            return gameId;
        } catch (error) {
            console.error('❌ Error in startGame:', error);
            return null;
        }
    }

    async startGachaSequence(game, interaction) {
        const player1 = game.players[0];
        const player2 = game.players[1];

        // 1. GACHA PLAYER 1
        const player1Items = this.generateItems();
        game.items[player1.id] = player1Items;

        const player1Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎁 GACHA ITEM PLAYER 1!\n\n**${player1.username}** mendapatkan items:\n${player1Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`);

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player1}`,
            embeds: [player1Embed] 
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. GACHA PLAYER 2
        const player2Items = this.generateItems();
        game.items[player2.id] = player2Items;

        const player2Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎁 GACHA ITEM PLAYER 2!\n\n**${player2.username}** mendapatkan items:\n${player2Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`);

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player2}`,
            embeds: [player2Embed] 
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // 3. LANGSUNG KE REVEAL CHAMBER
        await this.revealChamber(game.id, interaction);
    }

    async revealChamber(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        game.chambers = this.generateChambers();
        const loadedCount = game.chambers.filter(c => c === '💥').length;
        const emptyCount = game.chambers.filter(c => c === '⚪').length;

        // ANIMASI REVEAL
        const revealEmbed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 CHAMBER REVEAL!\n\nMengungkap chamber...\n\n${'❓'.repeat(8)}`);

        await interaction.editReply({ 
            content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
            embeds: [revealEmbed] 
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // HASIL REVEAL
        const resultEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 CHAMBER TERUNGKAP!\n\n**💥 ${loadedCount} Loaded • ⚪ ${emptyCount} Empty**\n\n*Game akan dimulai dalam 3 detik!*`);

        await interaction.editReply({ 
            content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
            embeds: [resultEmbed] 
        });

        // LOG CHAMBER
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

    // ... (method sendGameState, useItem, shoot, dll tetap sama seperti sebelumnya)

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

    getGame(gameId) {
        return this.games.get(gameId);
    }

    isPlayerInGame(userId) {
        for (const game of this.games.values()) {
            if (game.players.some(player => player.id === userId)) {
                return true;
            }
        }
        return false;
    }

    endGameById(gameId) {
        if (this.afkTimeouts.has(gameId)) {
            clearTimeout(this.afkTimeouts.get(gameId));
            this.afkTimeouts.delete(gameId);
        }
        if (this.gachaTimeouts.has(gameId)) {
            clearTimeout(this.gachaTimeouts.get(gameId));
            this.gachaTimeouts.delete(gameId);
        }
        this.games.delete(gameId);
    }
}

module.exports = ShotgunDuels;
