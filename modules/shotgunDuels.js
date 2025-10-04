const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ROUND_START_ITEMS = [1, 2, 3, 4]; // Random 1-4 items
        this.ITEMS = {
            '🚬': { name: 'Rokok', effect: 'Heal +1 HP (max 5)' },
            '🍺': { name: 'Minum', effect: 'Buang peluru terdepan' },
            '🔪': { name: 'Kater', effect: 'Next hit damage 2x' },
            '🔎': { name: 'Lup', effect: 'Lihat chamber berikutnya' },
            '🔗': { name: 'Borgol', effect: 'Dapat 2x tembak dalam 1 giliran' }
        };
    }

    // 🎲 Generate random chambers (8 slot)
    generateChambers() {
        let chambers;
        do {
            const empty = Math.floor(Math.random() * 7) + 1; // 1-7 empty
            const loaded = 8 - empty;
            chambers = [
                ...Array(loaded).fill('💥'), // Loaded
                ...Array(empty).fill('⚪')   // Empty
            ].sort(() => Math.random() - 0.5);
        } while (
            chambers.filter(c => c === '💥').length === 7 || 
            chambers.filter(c => c === '💥').length === 1
        );
        return chambers;
    }

    // 🎁 Generate random items
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

    // 🎮 Start new game
    startGame(player1, player2, channel) {
        const gameId = `${player1.id}-${player2.id}-${Date.now()}`;
        
        const chambers = this.generateChambers();
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
            health: {
                [player1.id]: 5,
                [player2.id]: 5
            },
            effects: {
                [player1.id]: { kater: false, borgol: false, extraTurn: false },
                [player2.id]: { kater: false, borgol: false, extraTurn: false }
            },
            channel: channel,
            revealedChamber: null
        };

        this.games.set(gameId, game);
        this.sendGameState(game);
        return gameId;
    }

    // 🎴 Send game state to channel
    async sendGameState(game) {
        const player = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];
        
        const loadedCount = game.chambers.filter(c => c === '💥').length;
        const emptyCount = game.chambers.filter(c => c === '⚪').length;

        const embed = new EmbedBuilder()
            .setTitle('🔫 **SHOTGUN DUELS** 🔫')
            .setColor(0x00AE86)
            .setDescription(`**${player.username}** vs **${opponent.username}**`)
            .addFields(
                {
                    name: '❤️ **DARAH**',
                    value: `${game.players[0].username}: ${'❤️'.repeat(game.health[game.players[0].id])}${'♡'.repeat(5 - game.health[game.players[0].id])} (${game.health[game.players[0].id]}/5)\n${game.players[1].username}: ${'❤️'.repeat(game.health[game.players[1].id])}${'♡'.repeat(5 - game.health[game.players[1].id])} (${game.health[game.players[1].id]}/5)}`,
                    inline: false
                },
                {
                    name: '🔫 **PELURU**',
                    value: `💥 Loaded: ${loadedCount} | ⚪ Empty: ${emptyCount}\nChamber saat ini: ${game.currentChamber + 1}/8`,
                    inline: false
                },
                {
                    name: '🎒 **ITEM KAMU**',
                    value: game.items[player.id].length > 0 
                        ? game.items[player.id].map(item => `${item} **${this.ITEMS[item].name}** - ${this.ITEMS[item].effect}`).join('\n')
                        : '❌ Tidak ada item',
                    inline: false
                }
            )
            .setFooter({ text: `Giliran: ${player.username} • Gunakan button di bawah untuk bermain` });

        const buttons = [];
        
        // Item buttons
        if (game.items[player.id].length > 0) {
            game.items[player.id].forEach((item, index) => {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`use_item_${game.id}_${index}`)
                        .setLabel(this.ITEMS[item].name)
                        .setEmoji(item)
                        .setStyle(ButtonStyle.Primary)
                );
            });
        }

        // Action buttons
        const actionButtons = [
            new ButtonBuilder()
                .setCustomId(`shoot_self_${game.id}`)
                .setLabel('Tembak Diri Sendiri')
                .setEmoji('🎯')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`shoot_opponent_${game.id}`)
                .setLabel('Tembak Lawan')
                .setEmoji('🔫')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`view_chamber_${game.id}`)
                .setLabel('Lihat Chamber')
                .setEmoji('🔍')
                .setStyle(ButtonStyle.Secondary)
        ];

        const rows = [];
        if (buttons.length > 0) {
            const itemRow = new ActionRowBuilder().addComponents(buttons.slice(0, 3));
            rows.push(itemRow);
        }
        if (buttons.length > 3) {
            const itemRow2 = new ActionRowBuilder().addComponents(buttons.slice(3, 6));
            rows.push(itemRow2);
        }
        
        const actionRow = new ActionRowBuilder().addComponents(actionButtons);
        rows.push(actionRow);

        try {
            await game.channel.send({ embeds: [embed], components: rows });
        } catch (error) {
            console.error('Error sending game state:', error);
        }
    }

    // 🎯 Use item
    async useItem(gameId, playerId, itemIndex) {
        const game = this.games.get(gameId);
        if (!game || game.players[game.currentPlayer].id !== playerId) return false;

        const items = game.items[playerId];
        if (itemIndex >= items.length) return false;

        const item = items[itemIndex];
        const playerEffects = game.effects[playerId];

        let message = '';
        
        switch (item) {
            case '🚬': // Rokok - Heal +1
                if (game.health[playerId] < 5) {
                    game.health[playerId] = Math.min(5, game.health[playerId] + 1);
                    message = `**${game.players[game.currentPlayer].username}** menggunakan 🚬 **Rokok**! +1 HP → ❤️ ${game.health[playerId]}/5`;
                } else {
                    message = `**${game.players[game.currentPlayer].username}** menggunakan 🚬 **Rokok**! HP sudah penuh (5/5)`;
                }
                break;
                
            case '🍺': // Minum - Remove first chamber
                const removed = game.chambers.shift();
                game.currentChamber = Math.max(0, game.currentChamber - 1);
                message = `**${game.players[game.currentPlayer].username}** menggunakan 🍺 **Minum**! Peluru terdepan dibuang (${removed === '💥' ? '💥 Loaded' : '⚪ Empty'})`;
                break;
                
            case '🔪': // Kater - Next hit 2x damage
                playerEffects.kater = true;
                message = `**${game.players[game.currentPlayer].username}** menggunakan 🔪 **Kater**! Hit berikutnya damage 2x!`;
                break;
                
            case '🔎': // Lup - Reveal next chamber
                if (game.currentChamber < game.chambers.length) {
                    game.revealedChamber = game.chambers[game.currentChamber];
                    message = `**${game.players[game.currentPlayer].username}** menggunakan 🔎 **Lup**! Chamber berikutnya: ${game.revealedChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`;
                }
                break;
                
            case '🔗': // Borgol - Get extra turn
                playerEffects.borgol = true;
                message = `**${game.players[game.currentPlayer].username}** menggunakan 🔗 **Borgol**! Dapat 2x tembak dalam 1 giliran!`;
                break;
        }

        // Remove used item
        items.splice(itemIndex, 1);

        // Send item use message
        if (message) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setDescription(`🎁 **ITEM DIGUNAKAN**\n${message}`);
            await game.channel.send({ embeds: [embed] });
        }

        this.games.set(gameId, game);
        
        // Update game state after item use
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.sendGameState(game);
        
        return true;
    }

    // 🔫 Shoot action
    async shoot(gameId, playerId, target) {
        const game = this.games.get(gameId);
        if (!game || game.players[game.currentPlayer].id !== playerId) return false;

        const shooter = game.players[game.currentPlayer];
        const targetPlayer = target === 'self' ? shooter : game.players[1 - game.currentPlayer];
        const chamber = game.chambers[game.currentChamber];
        const isLoaded = chamber === '💥';
        const playerEffects = game.effects[playerId];

        // Calculate damage
        let damage = 0;
        if (isLoaded) {
            damage = playerEffects.kater ? 2 : 1;
            playerEffects.kater = false; // Reset kater after use
        }

        // Animation embed
        const shootEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`🔫 **${shooter.username}** menembak **${target === 'self' ? 'diri sendiri' : targetPlayer.username}**...`);
        
        const message = await game.channel.send({ embeds: [shootEmbed] });

        // Drama delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Result
        let resultEmbed;
        let extraTurn = false;

        if (isLoaded) {
            // HIT!
            game.health[targetPlayer.id] = Math.max(0, game.health[targetPlayer.id] - damage);
            
            resultEmbed = new EmbedBuilder()
                .setColor(0xFF4444)
                .setDescription(`💥 **HIT!** ${target === 'self' ? '**Diri sendiri**' : `**${targetPlayer.username}**`} kena ${damage} damage! ${damage > 1 ? '**(2x KATER!)**' : ''}\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`);

        } else {
            // MISS
            resultEmbed = new EmbedBuilder()
                .setColor(0x44FF44)
                .setDescription(`⚪ **MISS!** ${target === 'self' ? '**Diri sendiri**' : `**${targetPlayer.username}**`} selamat!`);

            // Extra turn if shooting self and miss
            if (target === 'self') {
                extraTurn = true;
                playerEffects.extraTurn = true;
            }
        }

        // Update game state
        game.currentChamber++;
        if (game.currentChamber >= game.chambers.length) {
            game.currentChamber = 0;
        }

        // Check for reset conditions
        const loadedRemaining = game.chambers.filter(c => c === '💥').length;
        const emptyRemaining = game.chambers.filter(c => c === '⚪').length;

        if (loadedRemaining === 0 || emptyRemaining === 0) {
            await this.resetChambers(game);
        }

        // Send result
        await message.edit({ embeds: [resultEmbed] });

        // Check game over
        if (game.health[targetPlayer.id] <= 0) {
            await this.endGame(game, shooter);
            return true;
        }

        // Handle turn transition
        if (!extraTurn && !playerEffects.borgol) {
            game.currentPlayer = 1 - game.currentPlayer;
        } else if (playerEffects.borgol) {
            playerEffects.borgol = false; // Use borgol
            if (!extraTurn) {
                playerEffects.extraTurn = true; // Get extra turn from borgol
            }
        }

        this.games.set(gameId, game);
        
        // Send updated game state
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.sendGameState(game);

        return true;
    }

    // 🔄 Reset chambers and items
    async resetChambers(game) {
        game.chambers = this.generateChambers();
        game.currentChamber = 0;
        
        // Reset items for both players
        game.items[game.players[0].id] = this.generateItems();
        game.items[game.players[1].id] = this.generateItems();

        const resetEmbed = new EmbedBuilder()
            .setColor(0x8844FF)
            .setDescription('🔄 **CHAMBER RESET!**\nSemua peluru habis! Chamber dan item direset ulang!');
        
        await game.channel.send({ embeds: [resetEmbed] });
    }

    // 🏁 End game
    async endGame(game, winner) {
        const loser = game.players.find(p => p.id !== winner.id);
        
        const embed = new EmbedBuilder()
            .setTitle('🎉 **GAME OVER** 🎉')
            .setColor(0xFFD700)
            .setDescription(`**${winner.username}** MENANG! 🏆\n\n**${loser.username}** kalah dengan heroik!`)
            .addFields(
                {
                    name: '❤️ DARAH AKHIR',
                    value: `${winner.username}: ${game.health[winner.id]}/5\n${loser.username}: ${game.health[loser.id]}/5`,
                    inline: true
                },
                {
                    name: '🎯 STATISTIK',
                    value: `Total Tembakan: ${game.currentChamber}\nChamber Reset: ${game.chambers.filter(c => c === '💥').length === 0 || game.chambers.filter(c => c === '⚪').length === 0 ? 'Ya' : 'Tidak'}`,
                    inline: true
                }
            )
            .setThumbnail(winner.displayAvatarURL())
            .setTimestamp();

        await game.channel.send({ embeds: [embed] });
        this.games.delete(game.id);
    }

    // 🎪 Get game by ID
    getGame(gameId) {
        return this.games.get(gameId);
    }

    // ❌ End game by ID
    endGameById(gameId) {
        this.games.delete(gameId);
    }
}

module.exports = ShotgunDuels;
