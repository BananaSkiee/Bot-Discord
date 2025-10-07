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
            
            console.log(`🔫 Chambers: ${chambers.join(' ')}`);
            
            const game = {
                id: gameId,
                players: [player1, player2],
                currentPlayer: 0,
                chambers: chambers,
                currentChamber: 0,
                items: { 
                    [player1.id]: this.generateItems(),
                    [player2.id]: this.generateItems()
                },
                health: { [player1.id]: 5, [player2.id]: 5 },
                effects: { [player1.id]: {}, [player2.id]: {} },
                channel: channel,
                revealedChamber: null,
                messageId: null,
                actionLog: []
            };

            this.games.set(gameId, game);
            console.log(`✅ Game created: ${gameId}`);
            
            return gameId;
        } catch (error) {
            console.error('❌ Error in startGame:', error);
            return null;
        }
    }

    addActionLog(game, message) {
        game.actionLog.push(message);
        if (game.actionLog.length > 3) {
            game.actionLog.shift();
        }
    }

    getPlayerStatus(player, effects) {
        const statuses = [];
        if (effects.kater) statuses.push('🔪 2x Damage');
        if (effects.borgol) statuses.push('🔗 Double Shot');
        
        return statuses.length > 0 ? `[${statuses.join(' | ')}]` : '';
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
            
            const loadedCount = game.chambers.filter(c => c === '💥').length;
            const emptyCount = game.chambers.filter(c => c === '⚪').length;
            
            // Chamber info
            let chamberInfo = `**${game.currentChamber + 1}/8** • 💥 ${loadedCount} • ⚪ ${emptyCount}`;
            
            if (game.revealedChamber) {
                chamberInfo += `\n🔍 Next: ${game.revealedChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`;
            }

            // Buat action log text
            const actionLogText = game.actionLog.length > 0 
                ? `📜 **Aksi Terakhir:**\n${game.actionLog.join('\n')}`
                : '';

            // Dapatkan status efek untuk kedua pemain
            const playerStatus = this.getPlayerStatus(player, game.effects[player.id]);
            const opponentStatus = this.getPlayerStatus(opponent, game.effects[opponent.id]);

            // Format nama dengan status
            const playerName = playerStatus ? `**${player.username}** ${playerStatus}` : `**${player.username}**`;
            const opponentName = opponentStatus ? `**${opponent.username}** ${opponentStatus}` : `**${opponent.username}**`;

            // Buat embed
            const embed = new EmbedBuilder()
                .setTitle('🎯 SHOTGUN DUELS')
                .setColor(0x2F3136)
                .setDescription(`${playerName} 🆚 ${opponentName}\n${actionLogText}`)
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
                    text: `🎯 Turn: ${player.username} • Game ID: ${game.id.slice(-6)}` 
                })
                .setTimestamp();

            // Tombol Item HANYA untuk player saat ini
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

            // Edit atau buat message baru dengan TAG di luar embed
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
                    message = `🚬 **Rokok** → +1 HP (❤️ ${game.health[playerId]}/5)`;
                } else {
                    message = `🚬 **Rokok** → HP sudah penuh`;
                }
                shouldRemoveItem = false;
                break;
                
            case '🍺':
                if (game.chambers.length > 0) {
                    const removed = game.chambers.shift();
                    game.currentChamber = Math.max(0, game.currentChamber - 1);
                    message = `🍺 **Minum** → Buang peluru (${removed === '💥' ? '💥 Loaded' : '⚪ Empty'})`;
                    
                    if (this.checkChamberReset(game)) {
                        message += ' • 🔄 **CHAMBER RESET!**';
                    }
                }
                shouldRemoveItem = false;
                break;
                
            case '🔪':
                playerEffects.kater = true;
                message = `🔪 **Kater** → Next hit damage 2x!`;
                break;
                
            case '🔎':
                if (game.currentChamber < game.chambers.length) {
                    const nextChamber = game.chambers[game.currentChamber];
                    game.revealedChamber = nextChamber;
                    message = `🔎 **Lup** → Next: ${nextChamber === '💥' ? '💥 LOADED' : '⚪ EMPTY'}`;
                }
                break;
                
            case '🔗':
                playerEffects.borgol = true;
                message = `🔗 **Borgol** → Dapat 2x tembak!`;
                break;
        }

        // Hapus item setelah digunakan (kecuali item reusable)
        if (shouldRemoveItem) {
            items.splice(itemIndex, 1);
        }

        // Tambahkan ke action log
        this.addActionLog(game, `**${player.username}** ${message}`);

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
        let actionMessage = '';

        if (isLoaded) {
            damage = playerEffects.kater ? 2 : 1;
            if (playerEffects.kater) {
                actionMessage += '🔪 **KATER ACTIVE!** ';
                playerEffects.kater = false;
            }
        }

        // Tembak animation
        const shootEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`🔫 **${shooter.username}** menembak **${target === 'self' ? 'diri sendiri' : targetPlayer.username}**...`);
        
        const message = await interaction.followUp({ embeds: [shootEmbed], fetchReply: true });
        await new Promise(resolve => setTimeout(resolve, 1500));

        let resultMessage = '';

        if (isLoaded) {
            game.health[targetPlayer.id] = Math.max(0, game.health[targetPlayer.id] - damage);
            
            resultMessage = `${actionMessage}💥 **HIT!** ${targetPlayer.username} kena ${damage} damage! ❤️ ${game.health[targetPlayer.id]}/5`;

        } else {
            resultMessage = `⚪ **MISS!** ${targetPlayer.username} selamat!`;

            if (target === 'self') {
                extraTurn = true;
                resultMessage += ` • 🎉 **BONUS TURN!**`;
            }
        }

        game.currentChamber++;
        game.revealedChamber = null;

        // Check chamber reset
        if (game.currentChamber >= 8 || this.checkChamberReset(game)) {
            await this.resetChambers(game);
            resultMessage += ` • 🔄 **CHAMBER RESET!**`;
        }

        // Tambahkan ke action log
        this.addActionLog(game, `**${shooter.username}** ${resultMessage}`);

        // Check game over
        if (game.health[targetPlayer.id] <= 0) {
            await this.endGame(game, shooter, interaction);
            return true;
        }

        // Update turn logic
        if (playerEffects.borgol) {
            playerEffects.borgol = false;
            this.addActionLog(game, `🔗 **BORGOL ACTIVE!** ${shooter.username} dapat tembak lagi!`);
        } else if (!extraTurn) {
            game.currentPlayer = 1 - game.currentPlayer;
        }

        this.games.set(gameId, game);
        await new Promise(resolve => setTimeout(resolve, 2000));
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

        this.addActionLog(game, `🏳️ **SURRENDER!** ${surrenderingPlayer.username} menyerah!`);

        const embed = new EmbedBuilder()
            .setTitle('🏆 **VICTORY ROYALE** 🏆')
            .setColor(0xFFD700)
            .setDescription(`**${winner.username}** MENDOMINASI PERTEMPURAN! 💪\n\n**${surrenderingPlayer.username}** tidak sanggup melanjutkan duel! 🏳️`)
            .addFields(
                {
                    name: '⚔️ FINAL BATTLE STATS',
                    value: `🏅 **${winner.username}:** ❤️ ${game.health[winner.id]}/5\n💀 **${surrenderingPlayer.username}:** ❤️ ${game.health[surrenderingPlayer.id]}/5`,
                    inline: true
                }
            )
            .setThumbnail(winner.displayAvatarURL())
            .setImage('https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif')
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
        game.chambers = this.generateChambers();
        game.currentChamber = 0;
        // Reset effects setiap chamber reset
        game.effects[game.players[0].id] = {};
        game.effects[game.players[1].id] = {};
        
        this.games.set(game.id, game);
    }

    async endGame(game, winner, interaction) {
        const loser = game.players.find(p => p.id !== winner.id);
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 **VICTORY ROYALE** 🏆')
            .setColor(0xFFD700)
            .setDescription(`**${winner.username}** MENDOMINASI PERTEMPURAN! 💪\n\n**${loser.username}** tumbang dengan heroik! ⚔️`)
            .addFields(
                {
                    name: '⚔️ FINAL BATTLE STATS',
                    value: `🏅 **${winner.username}:** ❤️ ${game.health[winner.id]}/5\n💀 **${loser.username}:** ❤️ ${game.health[loser.id]}/5`,
                    inline: true
                }
            )
            .setThumbnail(winner.displayAvatarURL())
            .setImage('https://media.giphy.com/media/xULW8N9O5QLy9CaUu4/giphy.gif')
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
