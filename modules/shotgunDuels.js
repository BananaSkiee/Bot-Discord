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
            const empty = Math.floor(Math.random() * 6) + 2; // 2-7 empty
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
                revealedChamber: null
            };

            this.games.set(gameId, game);
            console.log(`✅ Game created: ${gameId}`);
            
            this.sendGameState(game);
            
            return gameId;
        } catch (error) {
            console.error('❌ Error in startGame:', error);
            return null;
        }
    }

    async sendGameState(game) {
        try {
            const player = game.players[game.currentPlayer];
            const opponent = game.players[1 - game.currentPlayer];
            
            const loadedCount = game.chambers.filter(c => c === '💥').length;
            const emptyCount = game.chambers.filter(c => c === '⚪').length;
            
            // Chamber preview dengan revealed chamber
            let chamberInfo = `💥 Isi: ${loadedCount} | ⚪ Kosong: ${emptyCount}\n`;
            chamberInfo += `Chamber: ${game.currentChamber + 1}/8`;
            
            if (game.revealedChamber) {
                chamberInfo += ` | 🔍 Next: ${game.revealedChamber === '💥' ? '💥 LOADED' : '⚪ EMPTY'}`;
                game.revealedChamber = null; // Reset setelah ditampilkan
            }

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
                        value: chamberInfo, 
                        inline: true 
                    },
                    { 
                        name: `🎒 ITEM ${player.username}`, 
                        value: game.items[player.id].map((item, index) => `${item} ${this.ITEMS[item].name}`).join('\n') || 'Tidak ada item', 
                        inline: true 
                    }
                )
                .setFooter({ text: `Giliran: ${player.username}` });

            // Tombol Item
            const itemButtons = [];
            game.items[player.id].forEach((item, index) => {
                itemButtons.push(
                    new ButtonBuilder()
                        .setCustomId(`use_item_${game.id}_${index}`)
                        .setLabel(this.ITEMS[item].name)
                        .setEmoji(item)
                        .setStyle(ButtonStyle.Primary)
                );
            });

            const itemRow = itemButtons.length > 0 ? 
                new ActionRowBuilder().addComponents(...itemButtons) : null;

            // Tombol Aksi
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`shoot_self_${game.id}`)
                    .setLabel('Tembak Diri')
                    .setEmoji('🎯')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`shoot_opponent_${game.id}`)
                    .setLabel(`Tembak ${opponent.username}`)
                    .setEmoji('🔫')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`view_chamber_${game.id}`)
                    .setLabel('Lihat Chamber')
                    .setEmoji('🔍')
                    .setStyle(ButtonStyle.Success)
            );

            const components = [];
            if (itemRow) components.push(itemRow);
            components.push(actionRow);

            await game.channel.send({ 
                embeds: [embed], 
                components: components 
            });

        } catch (error) {
            console.error('❌ Error in sendGameState:', error);
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
                if (game.chambers.length > 0) {
                    const removed = game.chambers.shift();
                    game.currentChamber = Math.max(0, game.currentChamber - 1);
                    message = `**${game.players[game.currentPlayer].username}** menggunakan 🍺 **Minum**! Peluru terdepan dibuang (${removed === '💥' ? '💥 Loaded' : '⚪ Empty'})`;
                    
                    // Check if need reset
                    this.checkChamberReset(game);
                }
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
        let extraTurn = false;

        if (isLoaded) {
            damage = playerEffects.kater ? 2 : 1;
            playerEffects.kater = false;
        }

        // 🎯 ANIMASI TEMBAK
        const shootEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`🔫 **${shooter.username}** menembak **${target === 'self' ? 'diri sendiri' : targetPlayer.username}**...`);
        
        const message = await game.channel.send({ embeds: [shootEmbed] });
        await new Promise(resolve => setTimeout(resolve, 2000));

        let resultEmbed;

        if (isLoaded) {
            // 💥 HIT - Kena damage
            game.health[targetPlayer.id] = Math.max(0, game.health[targetPlayer.id] - damage);
            
            resultEmbed = new EmbedBuilder()
                .setColor(0xFF4444)
                .setDescription(`💥 **HIT!** ${target === 'self' ? '**Diri sendiri**' : `**${targetPlayer.username}**`} kena ${damage} damage! ${damage > 1 ? '**(2x KATER!)**' : ''}\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`);

        } else {
            // ⚪ MISS - Tidak kena damage
            resultEmbed = new EmbedBuilder()
                .setColor(0x44FF44)
                .setDescription(`⚪ **MISS!** ${target === 'self' ? '**Diri sendiri**' : `**${targetPlayer.username}**`} selamat!`);

            // Bonus turn jika tembak diri sendiri dan miss
            if (target === 'self') {
                extraTurn = true;
                resultEmbed.setDescription(resultEmbed.data.description + `\n\n🎉 **BONUS TURN!** ${shooter.username} dapat giliran lagi!`);
            }
        }

        // Update chamber
        game.currentChamber++;
        if (game.currentChamber >= game.chambers.length) {
            game.currentChamber = 0;
        }

        // Check chamber reset
        this.checkChamberReset(game);

        await message.edit({ embeds: [resultEmbed] });

        // Check game over
        if (game.health[targetPlayer.id] <= 0) {
            await this.endGame(game, shooter);
            return true;
        }

        // Update turn logic
        if (playerEffects.borgol) {
            // Borgol active - tetap giliran yang sama
            playerEffects.borgol = false;
            resultEmbed.setDescription(resultEmbed.data.description + `\n\n🔗 **BORGOL ACTIVE!** ${shooter.username} dapat tembak lagi!`);
            await message.edit({ embeds: [resultEmbed] });
        } else if (!extraTurn) {
            // Normal turn - pindah ke lawan
            game.currentPlayer = 1 - game.currentPlayer;
        }
        // Jika extraTurn true (tembak diri miss), tetap giliran yang sama

        this.games.set(gameId, game);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.sendGameState(game);

        return true;
    }

    checkChamberReset(game) {
        const loadedRemaining = game.chambers.filter(c => c === '💥').length;
        const emptyRemaining = game.chambers.filter(c => c === '⚪').length;

        if (loadedRemaining === 0 || emptyRemaining === 0) {
            this.resetChambers(game);
            return true;
        }
        return false;
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
