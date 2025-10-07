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
                revealedChamber: null,
                messageId: null
            };

            this.games.set(gameId, game);
            console.log(`✅ Game created: ${gameId}`);
            console.log(`🎒 Player 1 items: ${game.items[player1.id].join(', ')}`);
            console.log(`🎒 Player 2 items: ${game.items[player2.id].join(', ')}`);
            
            return gameId;
        } catch (error) {
            console.error('❌ Error in startGame:', error);
            return null;
        }
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

            // Buat embed
            const embed = new EmbedBuilder()
                .setTitle('🎯 SHOTGUN DUELS')
                .setColor(0x2F3136)
                .setDescription(`**${player.username}** 🆚 **${opponent.username}**`)
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

            // Tombol Aksi utama - TANPA VIEW CHAMBER, DENGAN SURRENDER
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
                    
                    if (this.checkChamberReset(game)) {
                        message += '\n\n🔄 **CHAMBER RESET!** Semua peluru habis!';
                    }
                }
                break;
                
            case '🔪':
                playerEffects.kater = true;
                message = `**${game.players[game.currentPlayer].username}** menggunakan 🔪 **Kater**! Hit berikutnya damage 2x!`;
                break;
                
            case '🔎':
                if (game.currentChamber < game.chambers.length) {
                    const nextChamber = game.chambers[game.currentChamber];
                    message = `**${game.players[game.currentPlayer].username}** menggunakan 🔎 **Lup**! Chamber berikutnya: ${nextChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`;
                }
                break;
                
            case '🔗':
                playerEffects.borgol = true;
                message = `**${game.players[game.currentPlayer].username}** menggunakan 🔗 **Borgol**! Dapat 2x tembak dalam 1 giliran!`;
                break;
        }

        // Hapus item setelah digunakan
        items.splice(itemIndex, 1);

        if (message) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setDescription(`🎁 **ITEM USED**\n${message}`);
            await interaction.followUp({ embeds: [embed] });
        }

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
            playerEffects.kater = false;
        }

        // Animasi tembak
        const shootEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`🔫 **${shooter.username}** menembak **${target === 'self' ? 'diri sendiri' : targetPlayer.username}**...`);
        
        const message = await interaction.followUp({ embeds: [shootEmbed], fetchReply: true });
        await new Promise(resolve => setTimeout(resolve, 2000));

        let resultEmbed;

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
                resultEmbed.setDescription(resultEmbed.data.description + `\n\n🎉 **BONUS TURN!** ${shooter.username} dapat giliran lagi!`);
            }
        }

        game.currentChamber++;
        game.revealedChamber = null; // Reset revealed chamber setelah tembak

        if (game.currentChamber >= 8 || this.checkChamberReset(game)) {
            await this.resetChambers(game);
            resultEmbed.setDescription(resultEmbed.data.description + `\n\n🔄 **CHAMBER RESET!** Chamber dan item direset ulang!`);
        }

        await message.edit({ embeds: [resultEmbed] });

        if (game.health[targetPlayer.id] <= 0) {
            await this.endGame(game, shooter, interaction);
            return true;
        }

        if (playerEffects.borgol) {
            playerEffects.borgol = false;
            resultEmbed.setDescription(resultEmbed.data.description + `\n\n🔗 **BORGOL ACTIVE!** ${shooter.username} dapat tembak lagi!`);
            await message.edit({ embeds: [resultEmbed] });
        } else if (!extraTurn) {
            game.currentPlayer = 1 - game.currentPlayer;
        }

        this.games.set(gameId, game);
        await new Promise(resolve => setTimeout(resolve, 3000));
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

        const embed = new EmbedBuilder()
            .setTitle('🏳️ **SURRENDER** 🏳️')
            .setColor(0xFF6B6B)
            .setDescription(`**${surrenderingPlayer.username}** menyerah!\n\n**${winner.username}** menang tanpa perlawanan! 🏆`)
            .addFields(
                {
                    name: '❤️ FINAL HEALTH',
                    value: `${winner.username}: ${game.health[winner.id]}/5\n${surrenderingPlayer.username}: ${game.health[surrenderingPlayer.id]}/5`,
                    inline: true
                }
            )
            .setThumbnail(winner.displayAvatarURL())
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
        game.items[game.players[0].id] = this.generateItems();
        game.items[game.players[1].id] = this.generateItems();
        game.revealedChamber = null;
        
        console.log(`🔄 Chamber reset! New items:`);
        console.log(`🎒 ${game.players[0].username}: ${game.items[game.players[0].id].join(', ')}`);
        console.log(`🎒 ${game.players[1].username}: ${game.items[game.players[1].id].join(', ')}`);
        
        this.games.set(game.id, game);
    }

    async endGame(game, winner, interaction) {
        const loser = game.players.find(p => p.id !== winner.id);
        
        const embed = new EmbedBuilder()
            .setTitle('🎉 **GAME OVER** 🎉')
            .setColor(0xFFD700)
            .setDescription(`**${winner.username}** MENANG! 🏆\n\n**${loser.username}** kalah dengan heroik!`)
            .addFields(
                {
                    name: '❤️ FINAL HEALTH',
                    value: `${winner.username}: ${game.health[winner.id]}/5\n${loser.username}: ${game.health[loser.id]}/5`,
                    inline: true
                }
            )
            .setThumbnail(winner.displayAvatarURL())
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
