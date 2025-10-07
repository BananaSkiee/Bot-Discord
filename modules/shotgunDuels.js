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
                    const items = this.generateItems();
                    currentGame.items[player.id] = items;
                    currentGame.gachaStage++;
                    this.games.set(game.id, currentGame);

                    const autoGachaEmbed = new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
                        .setDescription(`## ⏰ GACHA OTOMATIS!\n\n**${player.username}** mendapatkan items:\n${items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`);

                    await interaction.editReply({ 
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
                    const items = this.generateItems();
                    currentGame.items[opponent.id] = items;
                    currentGame.gachaStage++;
                    this.games.set(game.id, currentGame);

                    const autoGachaEmbed = new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
                        .setDescription(`## ⏰ GACHA OTOMATIS!\n\n**${opponent.username}** mendapatkan items:\n${items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`);

                    await interaction.editReply({ 
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
        if (game.gachaStage === 0) content = `${player}`;
        else if (game.gachaStage === 1) content = `${opponent}`;
        else content = `**🎮 ${player.username} 🆚 ${opponent.username}**`;

        if (game.messageId && interaction) {
            try {
                const message = await interaction.channel.messages.fetch(game.messageId);
                await message.edit({ 
                    content: content,
                    embeds: [embed], 
                    components: components 
                });
            } catch (error) {
                const newMessage = await interaction.channel.send({ 
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
        if (!game) return;

        // Clear timeout jika user klik manual
        if (this.gachaTimeouts.has(gameId)) {
            clearTimeout(this.gachaTimeouts.get(gameId));
            this.gachaTimeouts.delete(gameId);
        }

        const player = game.players[playerIndex];
        const items = this.generateItems();
        game.items[player.id] = items;

        // 1. TAMPILKAN ANIMASI GACHA
        const gachaEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎰 SEDANG GACHA ITEM!\n\n**${player.username}** sedang gacha items...\n\n${'🎰 '.repeat(5)}`);

        await interaction.update({ 
            embeds: [gachaEmbed], 
            components: [] // Hilangkan tombol selama animasi
        });

        // 2. TUNGGU 2 DETIK UNTUK ANIMASI
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. TAMPILKAN HASIL GACHA
        const resultEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎁 ITEM DIDAPATKAN!\n\n**${player.username}** mendapatkan items:\n${items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`);

        await interaction.editReply({ 
            content: `${player}`,
            embeds: [resultEmbed] 
        });

        // 4. LANJUT KE PLAYER BERIKUTNYA ATAU REVEAL CHAMBER
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

        const revealEmbed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 CHAMBER REVEAL!\n\nMengungkap chamber...\n\n${'❓'.repeat(8)}`);

        await interaction.update({ 
            embeds: [revealEmbed], 
            components: [] 
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        const resultEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 CHAMBER TERUNGKAP!\n\n**💥 ${loadedCount} Loaded • ⚪ ${emptyCount} Empty**\n\n*Game akan dimulai dalam 3 detik!*`);

        await interaction.editReply({ 
            content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
            embeds: [resultEmbed] 
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
            
            if (game.messageId && interaction) {
                try {
                    const message = await interaction.channel.messages.fetch(game.messageId);
                    await message.edit({ 
                        content: content,
                        embeds: [embed], 
                        components: components 
                    });
                } catch (error) {
                    const newMessage = await interaction.channel.send({ 
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

    setAfkTimeout(gameId, duration) {
        if (this.afkTimeouts.has(gameId)) {
            clearTimeout(this.afkTimeouts.get(gameId));
        }

        const timeout = setTimeout(async () => {
            const game = this.games.get(gameId);
            if (!game) return;

            const afkPlayer = game.players[game.currentPlayer];
            const winner = game.players[1 - game.currentPlayer];

            const afkEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setDescription(`**${afkPlayer.username}** AFK terlalu lama!\n**${winner.username}** menang otomatis! 🏆`);

            try {
                const message = await game.channel.messages.fetch(game.messageId);
                await message.reply({ embeds: [afkEmbed] });
            } catch (error) {
                await game.channel.send({ embeds: [afkEmbed] });
            }

            await this.endGame(gameId, winner, null, true);
        }, duration);

        this.afkTimeouts.set(gameId, timeout);
    }

    // ... (sisanya sama seperti sebelumnya, tapi pastikan endGame menerima gameId)
    
    async endGame(gameId, winner, interaction, isAfk = false) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Cleanup timeouts
        if (this.afkTimeouts.has(gameId)) {
            clearTimeout(this.afkTimeouts.get(gameId));
            this.afkTimeouts.delete(gameId);
        }
        if (this.gachaTimeouts.has(gameId)) {
            clearTimeout(this.gachaTimeouts.get(gameId));
            this.gachaTimeouts.delete(gameId);
        }

        const loser = game.players.find(p => p.id !== winner.id);
        
        const victoryGifs = [
            'https://media.giphy.com/media/xULW8N9O5QLy9CaUu4/giphy.gif',
            'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
            'https://media.giphy.com/media/3o7aD2s1V3x4NwWUZa/giphy.gif'
        ];
        
        const randomGif = victoryGifs[Math.floor(Math.random() * victoryGifs.length)];

        let description = '';
        if (isAfk) {
            description = `### ${winner.username} WINS! 🎉\n\n**${loser.username}** AFK terlalu lama! ⏰`;
        } else {
            description = `### ${winner.username} WINS THE DUEL! 🎉\n\n**${loser.username}** has been defeated! ⚔️`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 **VICTORY ROYALE** 🏆')
            .setColor(0xFFD700)
            .setDescription(description)
            .addFields(
                {
                    name: '📊 FINAL BATTLE STATS',
                    value: `**${winner.username}:** ❤️ ${game.health[winner.id]}/5\n**${loser.username}:** ❤️ ${game.health[loser.id]}/5`,
                    inline: true
                }
            )
            .setThumbnail(winner.displayAvatarURL())
            .setImage(randomGif)
            .setFooter({ text: 'Game Over - Thanks for playing!' })
            .setTimestamp();

        if (interaction) {
            await interaction.followUp({ embeds: [embed] });
        } else {
            await game.channel.send({ embeds: [embed] });
        }
        
        // Cleanup messages
        if (game.messageId) {
            try {
                const message = await game.channel.messages.fetch(game.messageId);
                await message.edit({ components: [] });
            } catch (error) {}
        }
        
        if (game.actionMessageId) {
            try {
                const message = await game.channel.messages.fetch(game.actionMessageId);
                await message.delete();
            } catch (error) {}
        }
        
        this.games.delete(gameId);
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
