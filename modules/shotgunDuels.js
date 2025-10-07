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
            const gameId = `${player1.id}-${player2.id}-${Date.now()}`;
            const chambers = this.generateChambers();
            const loadedCount = chambers.filter(c => c === '💥').length;
            const emptyCount = chambers.filter(c => c === '⚪').length;
            
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
                effects: { 
                    [players[0].id]: { kater: false, borgol: false },
                    [players[1].id]: { kater: false, borgol: false }
                },
                channel: channel,
                messageId: null,
                actionMessageId: null,
                initialChamberState: `💥 ${loadedCount} • ⚪ ${emptyCount}`,
                showChamberBriefly: true
            };

            this.games.set(gameId, game);
            console.log(`🎮 Game started: ${players[0].username} vs ${players[1].username}`);
            return gameId;
        } catch (error) {
            console.error('❌ Error in startGame:', error);
            return null;
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

            // Buat embed menu utama dengan spacing yang baik
            const embed = new EmbedBuilder()
                .setTitle('🔫 SHOTGUN DUELS')
                .setColor(0x1a1a1a)
                .setDescription(`### ⚔️ ${player.username} **VS** ${opponent.username}\n‎`)
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
                        name: `\n🎒 **${player.username}'s ITEMS**`,
                        value: game.items[player.id].map(item => `• ${item} **${this.ITEMS[item].name}**`).join('\n') || '• No items',
                        inline: true
                    },
                    {
                        name: `\n🛡️ **${opponent.username}'s ITEMS**`,
                        value: game.items[opponent.id].map(item => `• ${item} **${this.ITEMS[item].name}**`).join('\n') || '• No items',
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Game ID: ${game.id.slice(-6)} • Use items wisely!` 
                })
                .setTimestamp();

            // Tombol Item - FIX: Pastikan tombol sesuai dengan items yang ada
            const itemButtons = [];
            const currentItems = game.items[player.id];
            
            currentItems.forEach((item, index) => {
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
                // FIX: Rokok - jika HP penuh, tetap hapus itemnya
                if (game.health[playerId] < 5) {
                    game.health[playerId] = Math.min(5, game.health[playerId] + 1);
                    message = `**${player.username}** used 🚬 **Rokok** → +1 HP (❤️ ${game.health[playerId]}/5)`;
                    shouldRemoveItem = false; // Rokok reusable
                } else {
                    message = `**${player.username}** used 🚬 **Rokok** → HP sudah penuh!`;
                    shouldRemoveItem = true; // Hapus rokok meski HP penuh
                }
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
                shouldRemoveItem = false; // Minum reusable
                break;
                
            case '🔪':
                // FIX: Cek apakah kater sudah aktif
                if (playerEffects.kater) {
                    await interaction.followUp({ 
                        content: '❌ Kater sudah aktif!', 
                        ephemeral: true 
                    });
                    return false;
                }
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
                // FIX: Cek apakah borgol sudah aktif
                if (playerEffects.borgol) {
                    await interaction.followUp({ 
                        content: '❌ Borgol sudah aktif!', 
                        ephemeral: true 
                    });
                    return false;
                }
                playerEffects.borgol = true;
                message = `**${player.username}** used 🔗 **Borgol** → Dapat 2x tembak!`;
                break;
        }

        // FIX: Hapus item setelah digunakan
        if (shouldRemoveItem) {
            items.splice(itemIndex, 1);
        }

        // Update action message
        await this.sendActionMessage(game, interaction, message);

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
                playerEffects.kater = false; // Reset kater setelah digunakan
            }
        }

        let resultMessage = '';

        if (isLoaded) {
            game.health[targetPlayer.id] = Math.max(0, game.health[targetPlayer.id] - damage);
            
            if (damage > 1) {
                resultMessage = `**${shooter.username}** 🔫 shot **${targetPlayer.username}**\n💥 **HIT!** Took ${damage} damage (2x KATER!)\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`;
            } else {
                resultMessage = `**${shooter.username}** 🔫 shot **${targetPlayer.username}**\n💥 **HIT!** Took ${damage} damage\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`;
            }

        } else {
            resultMessage = `**${shooter.username}** 🔫 shot **${targetPlayer.username}**\n⚪ **MISS!** Selamat!`;

            if (target === 'self') {
                extraTurn = true;
                resultMessage += `\n🎉 **BONUS TURN!**`;
            }
        }

        // Kirim action message
        await this.sendActionMessage(game, interaction, resultMessage);

        game.currentChamber++;

        // Check chamber reset
        if (game.currentChamber >= 8 || this.checkChamberReset(game)) {
            await this.resetChambers(game);
            const resetMessage = `🔄 **CHAMBER RESET!** Chamber dan item direset ulang!`;
            await this.sendActionMessage(game, interaction, `${resultMessage}\n\n${resetMessage}`);
        }

        // Check game over
        if (game.health[targetPlayer.id] <= 0) {
            await this.endGame(game, shooter, interaction);
            return true;
        }

        // FIX: Borgol logic - hanya bisa digunakan sekali per turn
        let borgolActive = false;
        if (playerEffects.borgol) {
            playerEffects.borgol = false; // Reset borgol
            borgolActive = true;
            const borgolMessage = `🔗 **BORGOL ACTIVE!** ${shooter.username} dapat tembak lagi!`;
            await this.sendActionMessage(game, interaction, `${resultMessage}\n\n${borgolMessage}`);
        } else if (!extraTurn && !borgolActive) {
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
        await this.endGame(game, winner, interaction, true);
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
        game.effects[game.players[0].id] = { kater: false, borgol: false };
        game.effects[game.players[1].id] = { kater: false, borgol: false };
        game.items[game.players[0].id] = this.generateItems();
        game.items[game.players[1].id] = this.generateItems();
        
        this.games.set(game.id, game);
    }

    async endGame(game, winner, interaction, isSurrender = false) {
        const loser = game.players.find(p => p.id !== winner.id);
        
        const victoryGifs = [
            'https://media.giphy.com/media/xULW8N9O5QLy9CaUu4/giphy.gif',
            'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
            'https://media.giphy.com/media/3o7aD2s1V3x4NwWUZa/giphy.gif'
        ];
        
        const randomGif = victoryGifs[Math.floor(Math.random() * victoryGifs.length)];

        const embed = new EmbedBuilder()
            .setTitle('🏆 **VICTORY ROYALE** 🏆')
            .setColor(0xFFD700)
            .setDescription(`### ${winner.username} WINS THE DUEL! 🎉\n\n**${loser.username}** has been defeated! ⚔️`)
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

        await interaction.followUp({ embeds: [embed] });
        
        // Hapus game message
        if (game.messageId) {
            try {
                const message = await interaction.channel.messages.fetch(game.messageId);
                await message.edit({ components: [] });
            } catch (error) {
                console.error('Error removing game message:', error);
            }
        }
        
        // Hapus action message
        if (game.actionMessageId) {
            try {
                const message = await interaction.channel.messages.fetch(game.actionMessageId);
                await message.delete();
            } catch (error) {
                console.error('Error removing action message:', error);
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
