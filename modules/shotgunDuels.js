const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ROUND_START_ITEMS = [1, 2, 3, 4];
        this.ITEMS = {
            '🚬': { name: 'Rokok', effect: 'Heal +1 HP (max 5)', reusable: true },
            '🍺': { name: 'Minum', effect: 'Buang peluru terdepan', reusable: true },
            '🔪': { name: 'Kater', effect: 'Next hit damage 2x', reusable: false },
            '🔎': { name: 'Lup', effect: 'Lihat chamber berikutnya', reusable: false },
            '🔗': { name: 'Borgol', effect: 'Dapat 2x tembak dalam 1 giliran', reusable: false }
        };
    }

    generateChambers() {
        let chambers;
        do {
            const empty = Math.floor(Math.random() * 5) + 2; // 2-6 empty
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

    startGame(player1, player2, channel) {
        try {
            console.log(`🎮 START GAME: ${player1.username} vs ${player2.username}`);
            const gameId = `${player1.id}-${player2.id}-${Date.now()}`;
            
            const chambers = this.generateChambers();
            const loadedCount = chambers.filter(c => c === '💥').length;
            const emptyCount = chambers.filter(c => c === '⚪').length;
            
            console.log(`🔫 Chambers: ${chambers.join(' ')}`);
            
            // Acak siapa yang mulai pertama
            const randomStarter = Math.random() < 0.5 ? 0 : 1;
            const players = randomStarter === 0 ? [player1, player2] : [player2, player1];
            
            const game = {
                id: gameId,
                players: players,
                currentPlayer: 0,
                chambers: chambers,
                currentChamber: 0,
                items: { 
                    [players[0].id]: this.generateItems(),
                    [players[1].id]: this.generateItems()
                },
                health: { [players[0].id]: 5, [players[1].id]: 5 },
                effects: { [players[0].id]: {}, [players[1].id]: {} },
                channel: channel,
                revealedChamber: null,
                messageId: null,
                actionMessageId: null, // ID untuk message action log
                actionLog: [],
                initialChamberState: `💥 ${loadedCount} • ⚪ ${emptyCount}`,
                showChamberBriefly: true
            };

            this.games.set(gameId, game);
            console.log(`✅ Game created: ${gameId}`);
            console.log(`🎲 Starter: ${players[0].username}`);
            
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

    async sendGameState(game, interaction = null) {
        try {
            const player = game.players[game.currentPlayer];
            const opponent = game.players[1 - game.currentPlayer];
            
            // Reset chamber jika sudah mencapai chamber 8
            if (game.currentChamber >= 8) {
                await this.resetChambers(game);
                return await this.sendGameState(game, interaction);
            }
            
            // Chamber info
            let chamberInfo;
            if (game.showChamberBriefly && game.currentChamber === 0) {
                chamberInfo = `**Chamber ${game.currentChamber + 1}/8**\n${game.initialChamberState}`;
                setTimeout(() => {
                    game.showChamberBriefly = false;
                    this.games.set(game.id, game);
                }, 3000);
            } else {
                chamberInfo = `**Chamber ${game.currentChamber + 1}/8**\n🎯 ???? • ????`;
            }

            // Buat embed menu utama (TANPA ACTION LOG)
            const embed = new EmbedBuilder()
                .setTitle('🔫 SHOTGUN DUELS')
                .setColor(0x1a1a1a)
                .setDescription(`### ⚔️ ${player.username} **VS** ${opponent.username}`)
                .addFields(
                    {
                        name: '❤️ **HEALTH**',
                        value: `**${player.username}:** ${'❤️'.repeat(game.health[player.id])}${'🤍'.repeat(5 - game.health[player.id])} **${game.health[player.id]}/5**\n**${opponent.username}:** ${'❤️'.repeat(game.health[opponent.id])}${'🤍'.repeat(5 - game.health[opponent.id])} **${game.health[opponent.id]}/5**`,
                        inline: true
                    },
                    {
                        name: '🔫 **CHAMBER**',
                        value: chamberInfo,
                        inline: true
                    },
                    {
                        name: '🔄 **TURN**',
                        value: `**Current:** ${player.username}\n**Position:** ${game.currentChamber + 1}/8`,
                        inline: true
                    },
                    {
                        name: `🎒 ${player.username}'s ITEMS`,
                        value: game.items[player.id].map(item => `${item} **${this.ITEMS[item].name}**`).join('\n') || 'No items',
                        inline: true
                    },
                    {
                        name: `🛡️ ${opponent.username}'s ITEMS`,
                        value: game.items[opponent.id].map(item => `${item} **${this.ITEMS[item].name}**`).join('\n') || 'No items',
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Game ID: ${game.id.slice(-6)} • Use items wisely!` 
                })
                .setTimestamp();

            // Tombol Item
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

            // Tombol Aksi utama
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

            // Edit atau buat message baru
            const content = `**🎯 TURN: ${player}**`;
            
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

        } catch (error) {
            console.error('❌ Error in sendGameState:', error);
        }
    }
    
    async useItem(gameId, playerId, itemIndex, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            await interaction.followUp({ 
                content: '❌ Game tidak ditemukan!', 
                ephemeral: true 
            });
            return false;
        }

        if (game.players[game.currentPlayer].id !== playerId) {
            await interaction.followUp({ 
                content: '❌ Bukan giliran kamu!', 
                ephemeral: true 
            });
            return false;
        }

        const items = game.items[playerId];
        if (itemIndex >= items.length || !items[itemIndex]) {
            await interaction.followUp({ 
                content: '❌ Item tidak valid!', 
                ephemeral: true 
            });
            return false;
        }

        const item = items[itemIndex];
        const playerEffects = game.effects[playerId];
        const player = game.players[game.currentPlayer];

        let message = '';
        let shouldRemoveItem = true;
        
        switch (item) {
            case '🚬':
                if (game.health[playerId] < 5) {
                    game.health[playerId] = Math.min(5, game.health[playerId] + 1);
                    message = `**${player.username}** used 🚬 **Rokok** → +1 HP (❤️ ${game.health[playerId]}/5)`;
                } else {
                    message = `**${player.username}** used 🚬 **Rokok** → HP sudah penuh`;
                }
                shouldRemoveItem = false;
                break;
                
            case '🍺':
                if (game.chambers.length > 0) {
                    const removed = game.chambers.shift();
                    game.currentChamber = Math.max(0, game.currentChamber - 1);
                    message = `**${player.username}** used 🍺 **Minum** → Buang peluru (${removed === '💥' ? '💥 Loaded' : '⚪ Empty'})`;
                    
                    if (this.checkChamberReset(game)) {
                        await this.resetChambers(game);
                        message += `\n🔄 **CHAMBER RESET!**`;
                    }
                }
                shouldRemoveItem = false;
                break;
                
            case '🔪':
                playerEffects.kater = true;
                message = `**${player.username}** used 🔪 **Kater** → Next hit damage 2x!`;
                break;
                
            case '🔎':
                if (game.currentChamber < game.chambers.length) {
                    const nextChamber = game.chambers[game.currentChamber];
                    message = `**${player.username}** used 🔎 **Lup** → Next chamber: ${nextChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`;
                }
                break;
                
            case '🔗':
                playerEffects.borgol = true;
                message = `**${player.username}** used 🔗 **Borgol** → Dapat 2x tembak!`;
                break;
        }

        // Hapus item setelah digunakan (kecuali item reusable)
        if (shouldRemoveItem) {
            items.splice(itemIndex, 1);
        }

        // Tambahkan ke action log
        this.addActionLog(game, message);

        // Update action message
        const actionLogText = game.actionLog.join('\n\n');
        await this.sendActionMessage(game, interaction, actionLogText);

        this.games.set(gameId, game);
        await this.sendGameState(game, interaction);
        return true;
    }

    async shoot(gameId, playerId, target, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            await interaction.followUp({ 
                content: '❌ Game tidak ditemukan!', 
                ephemeral: true 
            });
            return false;
        }

        if (game.players[game.currentPlayer].id !== playerId) {
            await interaction.followUp({ 
                content: '❌ Bukan giliran kamu!', 
                ephemeral: true 
            });
            return false;
        }

        const shooter = game.players[game.currentPlayer];
        const targetPlayer = target === 'self' ? shooter : game.players[1 - game.currentPlayer];
        const chamber = game.chambers[game.currentChamber];
        const isLoaded = chamber === '💥';
        const playerEffects = game.effects[playerId];

        let damage = 0;
        let extraTurn = false;

        if (isLoaded) {
            damage = playerEffects.kater ? 2 : 1;
            if (playerEffects.kater) {
                playerEffects.kater = false;
            }
        }

        // Kirim embed shooting (akan di-edit nanti)
        let resultMessage = '';
        let shootEmbed;

        if (isLoaded) {
            game.health[targetPlayer.id] = Math.max(0, game.health[targetPlayer.id] - damage);
            
            if (damage > 1) {
                resultMessage = `**${shooter.username}** 🔫 shot **${targetPlayer.username}**\n💥 **HIT!** Took ${damage} damage (2x KATER!)\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`;
            } else {
                resultMessage = `**${shooter.username}** 🔫 shot **${targetPlayer.username}**\n💥 **HIT!** Took ${damage} damage\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`;
            }

            shootEmbed = new EmbedBuilder()
                .setColor(0xff4444)
                .setDescription(resultMessage);

        } else {
            resultMessage = `**${shooter.username}** 🔫 shot **${targetPlayer.username}**\n⚪ **MISS!** Selamat!`;

            if (target === 'self') {
                extraTurn = true;
                resultMessage += `\n🎉 **BONUS TURN!**`;
            }

            shootEmbed = new EmbedBuilder()
                .setColor(0x44ff44)
                .setDescription(resultMessage);
        }

        // Kirim/Edit action message
        await this.sendActionMessage(game, interaction, resultMessage);

        game.currentChamber++;

        // Check chamber reset
        if (game.currentChamber >= 8 || this.checkChamberReset(game)) {
            await this.resetChambers(game);
            const resetMessage = `🔄 **CHAMBER RESET!** Chamber dan item direset ulang!`;
            this.addActionLog(game, resetMessage);
            await this.sendActionMessage(game, interaction, `${resultMessage}\n\n${resetMessage}`);
        } else {
            // Tambahkan ke action log untuk history
            this.addActionLog(game, resultMessage);
        }

        // Check game over
        if (game.health[targetPlayer.id] <= 0) {
            await this.endGame(game, shooter, interaction);
            return true;
        }

        // Update turn logic
        if (playerEffects.borgol) {
            playerEffects.borgol = false;
            const borgolMessage = `🔗 **BORGOL ACTIVE!** ${shooter.username} dapat tembak lagi!`;
            this.addActionLog(game, borgolMessage);
            await this.sendActionMessage(game, interaction, `${resultMessage}\n\n${borgolMessage}`);
        } else if (!extraTurn) {
            game.currentPlayer = 1 - game.currentPlayer;
        }

        this.games.set(gameId, game);
        await this.sendGameState(game, interaction);

        return true;
    }

    async surrender(gameId, playerId, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            await interaction.followUp({ 
                content: '❌ Game tidak ditemukan!', 
                ephemeral: true 
            });
            return false;
        }

        if (game.players[game.currentPlayer].id !== playerId) {
            await interaction.followUp({ 
                content: '❌ Bukan giliran kamu!', 
                ephemeral: true 
            });
            return false;
        }

        const surrenderingPlayer = game.players[game.currentPlayer];
        const winner = game.players[1 - game.currentPlayer];

        const surrenderMessage = `🏳️ **SURRENDER!**\n**${surrenderingPlayer.username}** menyerah!\n**${winner.username}** menang! 🏆`;
        
        await this.sendActionMessage(game, interaction, surrenderMessage);

        const embed = new EmbedBuilder()
            .setTitle('🏆 **VICTORY** 🏆')
            .setColor(0xFFD700)
            .setDescription(`### ${winner.username} WINS!\n\n**${surrenderingPlayer.username}** has surrendered!`)
            .addFields(
                {
                    name: '📊 FINAL STATS',
                    value: `**${winner.username}:** ❤️ ${game.health[winner.id]}/5\n**${surrenderingPlayer.username}:** ❤️ ${game.health[surrenderingPlayer.id]}/5`,
                    inline: true
                }
            )
            .setThumbnail(winner.displayAvatarURL())
            .setFooter({ text: 'Game Over' })
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
        
        if (game.messageId) {
            try {
                const message = await interaction.channel.messages.fetch(game.messageId);
                await message.edit({ components: [] });
            } catch (error) {
                console.error('Error removing game message:', error);
            }
        }
        
        this.games.delete(game.id);
        return true;
    }

    checkChamberReset(game) {
        const loadedRemaining = game.chambers.filter(c => c === '💥').length;
        const emptyRemaining = game.chambers.filter(c => c === '⚪').length;
        return loadedRemaining === 0 || emptyRemaining === 0;
    }

    async resetChambers(game) {
        const newChambers = this.generateChambers();
        const loadedCount = newChambers.filter(c => c === '💥').length;
        const emptyCount = newChambers.filter(c => c === '⚪').length;
        
        game.chambers = newChambers;
        game.currentChamber = 0;
        game.initialChamberState = `💥 ${loadedCount} • ⚪ ${emptyCount}`;
        game.showChamberBriefly = true;
        
        // Reset effects dan generate items baru
        game.effects[game.players[0].id] = {};
        game.effects[game.players[1].id] = {};
        game.items[game.players[0].id] = this.generateItems();
        game.items[game.players[1].id] = this.generateItems();
        
        this.games.set(game.id, game);
    }

    async endGame(game, winner, interaction) {
        const loser = game.players.find(p => p.id !== winner.id);
        
        const victoryMessage = `🏆 **VICTORY!**\n**${winner.username}** menang!\n**${loser.username}** kalah!`;
        await this.sendActionMessage(game, interaction, victoryMessage);

        const embed = new EmbedBuilder()
            .setTitle('🏆 **VICTORY** 🏆')
            .setColor(0xFFD700)
            .setDescription(`### ${winner.username} WINS!\n\n**${loser.username}** has been defeated!`)
            .addFields(
                {
                    name: '📊 FINAL STATS',
                    value: `**${winner.username}:** ❤️ ${game.health[winner.id]}/5\n**${loser.username}:** ❤️ ${game.health[loser.id]}/5`,
                    inline: true
                }
            )
            .setThumbnail(winner.displayAvatarURL())
            .setFooter({ text: 'Game Over' })
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
        
        if (game.messageId) {
            try {
                const message = await interaction.channel.messages.fetch(game.messageId);
                await message.edit({ components: [] });
            } catch (error) {
                console.error('Error removing game message:', error);
            }
        }
        
        this.games.delete(game.id);
    }

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
        this.games.delete(gameId);
    }
}

module.exports = ShotgunDuels;
