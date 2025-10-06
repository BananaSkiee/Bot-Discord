const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ROUND_START_ITEMS = [1, 2, 3, 4];
        this.ITEMS = {
            '🚬': { name: 'Rokok', effect: 'Heal +1 HP (max 5)' },
            '🍺': { name: 'Minum', effect: 'Buang peluru terdepan' },
            '🔪': { name: 'Kater', effect: 'Next hit damage 2x' },
            '🔎': { name: 'Lup', effect: 'Lihat chamber berikutnya' },
            '🔗': { name: 'Borgol', effect: 'Dapat 2x tembak dalam 1 giliran' }
        };
    }

    generateChambers() {
        let chambers;
        do {
            const empty = Math.floor(Math.random() * 7) + 1;
            const loaded = 8 - empty;
            chambers = [
                ...Array(loaded).fill('💥'),
                ...Array(empty).fill('⚪')
            ].sort(() => Math.random() - 0.5);
        } while (
            chambers.filter(c => c === '💥').length === 7 || 
            chambers.filter(c => c === '💥').length === 1
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

    // Di modules/shotgunDuels.js - GANTI startGame method
startGame(player1, player2, channel) {
    try {
        console.log(`🎮 START GAME: ${player1.username} vs ${player2.username}`);
        const gameId = `${player1.id}-${player2.id}-${Date.now()}`;
        
        // PELURU DIACAK - 4 isi, 4 kosong
        const loaded = 4;
        const empty = 4;
        const chambers = [
            ...Array(loaded).fill('💥'), 
            ...Array(empty).fill('⚪')
        ].sort(() => Math.random() - 0.5);
        
        console.log(`🔧 Chambers: ${chambers.join(' ')}`);
        
        const game = {
            id: gameId,
            players: [player1, player2],
            currentPlayer: 0,
            chambers: chambers,
            currentChamber: 0,
            items: { 
                [player1.id]: ['🚬', '🔪'], // Item test
                [player2.id]: ['🍺', '🔎'] 
            },
            health: { [player1.id]: 5, [player2.id]: 5 },
            effects: { [player1.id]: {}, [player2.id]: {} },
            channel: channel,
        };

        this.games.set(gameId, game);
        console.log(`✅ Game created: ${gameId}`);
        
        console.log(`📤 Calling sendGameState...`);
        this.sendGameState(game);
        
        return gameId;
    } catch (error) {
        console.error('❌ Error in startGame:', error);
    }
}

    async sendGameState(game) {
    try {
        console.log(`🎯 DEBUG: Sending game state for ${game.id}`);
        
        const player = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];
        
        const loadedCount = game.chambers.filter(c => c === '💥').length;
        const emptyCount = game.chambers.filter(c => c === '⚪').length;
        
        console.log(`🔫 Chamber info: ${loadedCount} loaded, ${emptyCount} empty`);

        const embed = new EmbedBuilder()
            .setTitle('🔫 SHOTGUN DUELS')
            .setDescription(`**${player.username}** 🆚 **${opponent.username}**`)
            .setColor(0xFF0000)
            .addFields(
                { 
                    name: '❤️ DARAH', 
                    value: `${player.username}: ${'❤️'.repeat(game.health[player.id])}${'♡'.repeat(5 - game.health[player.id])} (${game.health[player.id]}/5)\n${opponent.username}: ${'❤️'.repeat(game.health[opponent.id])}${'♡'.repeat(5 - game.health[opponent.id])} (${game.health[opponent.id]}/5)`, 
                    inline: false 
                },
                { 
                    name: '🔫 PELURU', 
                    value: `💥 Isi: ${loadedCount} | ⚪ Kosong: ${emptyCount}\nChamber: ${game.currentChamber + 1}/8`, 
                    inline: true 
                },
                { 
                    name: '🎒 ITEM', 
                    value: game.items[player.id].map(item => item).join(' ') || 'Tidak ada', 
                    inline: true 
                }
            )
            .setFooter({ text: `Giliran: ${player.username}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`shoot_self_${game.id}`)
                .setLabel('Tembak Diri')
                .setEmoji('🎯')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`shoot_opponent_${game.id}`)
                .setLabel(`Tembak ${opponent.username}`)
                .setEmoji('🔫')
                .setStyle(ButtonStyle.Danger)
        );

        console.log(`📤 Sending to channel...`);
        await game.channel.send({ 
            content: `🎮 **GAME DIMULAI!**`,
            embeds: [embed], 
            components: [row] 
        });
        
        console.log(`✅ Game state sent successfully!`);

    } catch (error) {
        console.error('❌ DEBUG: Error in sendGameState:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
    }
}
    
    async useItem(gameId, playerId, itemIndex) {
        const game = this.games.get(gameId);
        if (!game || game.players[game.currentPlayer].id !== playerId) return false;

        const items = game.items[playerId];
        if (itemIndex >= items.length) return false;

        const item = items[itemIndex];
        const playerEffects = game.effects[playerId];

        let message = '';
        
        switch (item) {
            case '🚬':
                if (game.health[playerId] < 5) {
                    game.health[playerId] = Math.min(5, game.health[playerId] + 1);
                    message = `**${game.players[game.currentPlayer].username}** menggunakan 🚬 **Rokok**! +1 HP → ❤️ ${game.health[playerId]}/5`;
                } else {
                    message = `**${game.players[game.currentPlayer].username}** menggunakan 🚬 **Rokok**! HP sudah penuh (5/5)`;
                }
                break;
                
            case '🍺':
                const removed = game.chambers.shift();
                game.currentChamber = Math.max(0, game.currentChamber - 1);
                message = `**${game.players[game.currentPlayer].username}** menggunakan 🍺 **Minum**! Peluru terdepan dibuang (${removed === '💥' ? '💥 Loaded' : '⚪ Empty'})`;
                break;
                
            case '🔪':
                playerEffects.kater = true;
                message = `**${game.players[game.currentPlayer].username}** menggunakan 🔪 **Kater**! Hit berikutnya damage 2x!`;
                break;
                
            case '🔎':
                if (game.currentChamber < game.chambers.length) {
                    game.revealedChamber = game.chambers[game.currentChamber];
                    message = `**${game.players[game.currentPlayer].username}** menggunakan 🔎 **Lup**! Chamber berikutnya: ${game.revealedChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`;
                }
                break;
                
            case '🔗':
                playerEffects.borgol = true;
                message = `**${game.players[game.currentPlayer].username}** menggunakan 🔗 **Borgol**! Dapat 2x tembak dalam 1 giliran!`;
                break;
        }

        items.splice(itemIndex, 1);

        if (message) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setDescription(`🎁 **ITEM DIGUNAKAN**\n${message}`);
            await game.channel.send({ embeds: [embed] });
        }

        this.games.set(gameId, game);
        await this.sendGameState(game);
        return true;
    }

    async shoot(gameId, playerId, target) {
        const game = this.games.get(gameId);
        if (!game || game.players[game.currentPlayer].id !== playerId) return false;

        const shooter = game.players[game.currentPlayer];
        const targetPlayer = target === 'self' ? shooter : game.players[1 - game.currentPlayer];
        const chamber = game.chambers[game.currentChamber];
        const isLoaded = chamber === '💥';
        const playerEffects = game.effects[playerId];

        let damage = 0;
        if (isLoaded) {
            damage = playerEffects.kater ? 2 : 1;
            playerEffects.kater = false;
        }

        const shootEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`🔫 **${shooter.username}** menembak **${target === 'self' ? 'diri sendiri' : targetPlayer.username}**...`);
        
        const message = await game.channel.send({ embeds: [shootEmbed] });
        await new Promise(resolve => setTimeout(resolve, 2000));

        let resultEmbed;
        let extraTurn = false;

        if (isLoaded) {
            game.health[targetPlayer.id] = Math.max(0, game.health[targetPlayer.id] - damage);
            
            resultEmbed = new EmbedBuilder()
                .setColor(0xFF4444)
                .setDescription(`💥 **HIT!** ${target === 'self' ? '**Diri sendiri**' : `**${targetPlayer.username}**`} kena ${damage} damage! ${damage > 1 ? '**(2x KATER!)**' : ''}\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`);

        } else {
            resultEmbed = new EmbedBuilder()
                .setColor(0x44FF44)
                .setDescription(`⚪ **MISS!** ${target === 'self' ? '**Diri sendiri**' : `**${targetPlayer.username}**`} selamat!`);

            if (target === 'self') {
                extraTurn = true;
                playerEffects.extraTurn = true;
            }
        }

        game.currentChamber++;
        if (game.currentChamber >= game.chambers.length) {
            game.currentChamber = 0;
        }

        const loadedRemaining = game.chambers.filter(c => c === '💥').length;
        const emptyRemaining = game.chambers.filter(c => c === '⚪').length;

        if (loadedRemaining === 0 || emptyRemaining === 0) {
            await this.resetChambers(game);
        }

        await message.edit({ embeds: [resultEmbed] });

        if (game.health[targetPlayer.id] <= 0) {
            await this.endGame(game, shooter);
            return true;
        }

        if (!extraTurn && !playerEffects.borgol) {
            game.currentPlayer = 1 - game.currentPlayer;
        } else if (playerEffects.borgol) {
            playerEffects.borgol = false;
            if (!extraTurn) {
                playerEffects.extraTurn = true;
            }
        }

        this.games.set(gameId, game);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.sendGameState(game);

        return true;
    }

    async resetChambers(game) {
        game.chambers = this.generateChambers();
        game.currentChamber = 0;
        game.items[game.players[0].id] = this.generateItems();
        game.items[game.players[1].id] = this.generateItems();

        const resetEmbed = new EmbedBuilder()
            .setColor(0x8844FF)
            .setDescription('🔄 **CHAMBER RESET!**\nSemua peluru habis! Chamber dan item direset ulang!');
        
        await game.channel.send({ embeds: [resetEmbed] });
    }

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
                }
            )
            .setThumbnail(winner.displayAvatarURL())
            .setTimestamp();

        await game.channel.send({ embeds: [embed] });
        this.games.delete(game.id);
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    endGameById(gameId) {
        this.games.delete(gameId);
    }
}

module.exports = ShotgunDuels;
