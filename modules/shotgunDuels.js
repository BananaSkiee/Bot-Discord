const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ROUND_START_ITEMS = [2, 3, 4];
        this.ITEMS = {
            '🚬': { name: 'Rokok', effect: 'Heal +1 HP (max 5)', reusable: false },
            '🍺': { name: 'Minum', effect: 'Buang peluru terdepan', reusable: false },
            '🔪': { name: 'Kater', effect: 'Next hit damage 2x', reusable: false },
            '🔎': { name: 'Lup', effect: 'Lihat chamber berikutnya', reusable: false },
            '🔗': { name: 'Borgol', effect: 'Dapat 2x tembak dalam 1 giliran', reusable: false }
        };
        this.afkTimeouts = new Map();
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
                logMessageId: null,
                actionMessageId: null,
                actionLog: [],
                stage: 'gacha'
            };

            this.games.set(gameId, game);
            
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

        // EMBED 1: GACHA PLAYER 1 - ANIMASI
        const animasi1Embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎰 SEDANG GACHA ITEM PLAYER 1!\n\n**${player1.username}** sedang gacha items...\n\n${'🎰 '.repeat(8)}`);

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player1}`,
            embeds: [animasi1Embed] 
        });

        // ANIMASI LAMA - 5 DETIK
        await new Promise(resolve => setTimeout(resolve, 5000));

        // EMBED 1: GACHA PLAYER 1 - HASIL
        const player1Items = this.generateItems();
        game.items[player1.id] = player1Items;

        const hasil1Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎁 GACHA ITEM PLAYER 1!\n\n**${player1.username}** mendapatkan items:\n${player1Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`);

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player1}`,
            embeds: [hasil1Embed] 
        });

        // EMBED 2: LOG PLAYER 1
        const log1Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - GACHA LOG')
            .setDescription(`## 🎁 PLAYER 1 ITEMS!\n\n**${player1.username}** mendapatkan:\n${player1Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`)
            .setFooter({ text: 'Player 2 sedang gacha...' });

        const logMessage = await game.channel.send({ 
            content: `${player1}`,
            embeds: [log1Embed] 
        });
        game.logMessageId = logMessage.id;

        await new Promise(resolve => setTimeout(resolve, 3000));

        // EMBED 1: GACHA PLAYER 2 - ANIMASI
        const animasi2Embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎰 SEDANG GACHA ITEM PLAYER 2!\n\n**${player2.username}** sedang gacha items...\n\n${'🎰 '.repeat(8)}`);

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player2}`,
            embeds: [animasi2Embed] 
        });

        // ANIMASI LAMA - 5 DETIK
        await new Promise(resolve => setTimeout(resolve, 5000));

        // EMBED 1: GACHA PLAYER 2 - HASIL
        const player2Items = this.generateItems();
        game.items[player2.id] = player2Items;

        const hasil2Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎁 GACHA ITEM PLAYER 2!\n\n**${player2.username}** mendapatkan items:\n${player2Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`);

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player2}`,
            embeds: [hasil2Embed] 
        });

        // EMBED 2: LOG PLAYER 2
        const log2Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - GACHA LOG')
            .setDescription(`## 🎁 PLAYER 2 ITEMS!\n\n**${player2.username}** mendapatkan:\n${player2Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n')}`)
            .setFooter({ text: 'Beralih ke reveal chamber...' });

        await logMessage.edit({ 
            content: `${player2}`,
            embeds: [log2Embed] 
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // LANJUT KE REVEAL CHAMBER
        await this.revealChamber(game.id, interaction);
    }

    async revealChamber(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        // EMBED 1: ANIMASI REVEAL CHAMBER
        const animasiChamberEmbed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 SEDANG MENGUNGKAP CHAMBER!\n\nMengacak dan mengungkap chamber...\n\n${'🎲 '.repeat(8)}`);

        await interaction.editReply({ 
            content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
            embeds: [animasiChamberEmbed] 
        });

        // ANIMASI LAMA - 5 DETIK
        await new Promise(resolve => setTimeout(resolve, 5000));

        // GENERATE CHAMBER
        game.chambers = this.generateChambers();
        const loadedCount = game.chambers.filter(c => c === '💥').length;
        const emptyCount = game.chambers.filter(c => c === '⚪').length;

        // EMBED 1: HASIL CHAMBER
        const hasilChamberEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 CHAMBER TERUNGKAP!\n\n**💥 ${loadedCount} Loaded • ⚪ ${emptyCount} Empty**\n\n*Game akan dimulai dalam 3 detik!*`);

        await interaction.editReply({ 
            content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
            embeds: [hasilChamberEmbed] 
        });

        // EMBED 2: LOG CHAMBER
        const logChamberEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('🎯 SHOTGUN DUELS - CHAMBER INFO')
            .setDescription(`## 🔫 CHAMBER READY!\n\n**💥 ${loadedCount} Loaded • ⚪ ${emptyCount} Empty**\n\nGame siap dimulai!`)
            .setFooter({ text: 'Good luck!' });

        await game.channel.messages.fetch(game.logMessageId)
            .then(msg => msg.edit({ embeds: [logChamberEmbed] }))
            .catch(console.error);

        game.stage = 'gameplay';
        this.games.set(game.id, game);

        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.startGameplay(game, interaction);
    }

    async startGameplay(game, interaction) {
        game.stage = 'gameplay';
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

            // TOMBOL ITEM
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

            // TOMBOL AKSI
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

            this.setAfkTimeout(game.id, 300000);
            this.games.set(game.id, game);

        } catch (error) {
            console.error('❌ Error in sendGameState:', error);
        }
    }

    // ... (method useItem, shoot, surrender, checkChamberReset, resetChambers, endGame tetap sama)

    async useItem(gameId, playerId, itemIndex, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            await interaction.reply({ 
                content: '❌ Game tidak ditemukan!', 
                ephemeral: true 
            });
            return false;
        }

        if (game.players[game.currentPlayer].id !== playerId) {
            await interaction.reply({ 
                content: '❌ Bukan giliran kamu!', 
                ephemeral: true 
            });
            return false;
        }

        const items = game.items[playerId];
        if (itemIndex >= items.length || !items[itemIndex]) {
            await interaction.reply({ 
                content: '❌ Item tidak valid!', 
                ephemeral: true 
            });
            return false;
        }

        const item = items[itemIndex];
        const playerEffects = game.effects[playerId];
        const player = game.players[game.currentPlayer];

        let message = '';
        let shouldRemoveItem = false;
        
        switch (item) {
            case '🚬':
                if (game.health[playerId] < 5) {
                    game.health[playerId] = Math.min(5, game.health[playerId] + 1);
                    message = `**${player.username}** used 🚬 **Rokok** → +1 HP (❤️ ${game.health[playerId]}/5)`;
                } else {
                    message = `**${player.username}** used 🚬 **Rokok** → HP sudah penuh!`;
                }
                shouldRemoveItem = true;
                break;
                
            case '🍺':
                if (game.chambers.length > 0) {
                    const removed = game.chambers.shift();
                    game.currentChamber = Math.max(0, game.currentChamber - 1);
                    message = `**${player.username}** used 🍺 **Minum** → Buang peluru (${removed === '💥' ? '💥 Loaded' : '⚪ Empty'})`;
                    
                    if (this.checkChamberReset(game)) {
                        await this.resetChambers(game, interaction);
                        message += `\n🔄 **CHAMBER & ITEM RESET!**`;
                    }
                }
                shouldRemoveItem = true;
                break;
                
            case '🔪':
                if (playerEffects.kater) {
                    await interaction.reply({ 
                        content: '❌ Kater sudah aktif!', 
                        ephemeral: true 
                    });
                    return false;
                }
                playerEffects.kater = true;
                message = `**${player.username}** used 🔪 **Kater** → Next hit damage 2x!`;
                shouldRemoveItem = false;
                break;
                
            case '🔎':
                if (game.currentChamber < game.chambers.length) {
                    const nextChamber = game.chambers[game.currentChamber];
                    message = `**${player.username}** used 🔎 **Lup** → Next chamber: ${nextChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`;
                }
                shouldRemoveItem = true;
                break;
                
            case '🔗':
                if (playerEffects.borgol) {
                    await interaction.reply({ 
                        content: '❌ Borgol sudah aktif!', 
                        ephemeral: true 
                    });
                    return false;
                }
                playerEffects.borgol = true;
                playerEffects.borgolShots = 2;
                message = `**${player.username}** used 🔗 **Borgol** → Dapat 2x tembak!`;
                shouldRemoveItem = false;
                break;
        }

        if (shouldRemoveItem) {
            items.splice(itemIndex, 1);
        }

        this.addActionLog(game, message);
        await this.sendActionMessage(game, interaction, game.actionLog.join('\n\n'));

        this.games.set(gameId, game);
        await this.sendGameState(game, interaction);
        return true;
    }

    async shoot(gameId, playerId, target, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            await interaction.reply({ 
                content: '❌ Game tidak ditemukan!', 
                ephemeral: true 
            });
            return false;
        }

        if (game.players[game.currentPlayer].id !== playerId) {
            await interaction.reply({ 
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
                const katerIndex = game.items[playerId].indexOf('🔪');
                if (katerIndex !== -1) {
                    game.items[playerId].splice(katerIndex, 1);
                }
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

        this.addActionLog(game, resultMessage);
        await this.sendActionMessage(game, interaction, game.actionLog.join('\n\n'));

        game.currentChamber++;

        if (game.currentChamber >= 8 || this.checkChamberReset(game)) {
            await this.resetChambers(game, interaction);
        }

        if (game.health[targetPlayer.id] <= 0) {
            await this.endGame(gameId, shooter, interaction);
            return true;
        }

        let borgolActive = false;
        if (playerEffects.borgol && playerEffects.borgolShots > 0) {
            playerEffects.borgolShots--;
            borgolActive = true;
            
            if (playerEffects.borgolShots === 0) {
                playerEffects.borgol = false;
                const borgolIndex = game.items[playerId].indexOf('🔗');
                if (borgolIndex !== -1) {
                    game.items[playerId].splice(borgolIndex, 1);
                }
                resultMessage += `\n🔗 **BORGOL HABIS!**`;
            } else {
                resultMessage += `\n🔗 **BORGOL ACTIVE!** (${playerEffects.borgolShots} tembak tersisa)`;
            }
            
            await this.sendActionMessage(game, interaction, `${game.actionLog.join('\n\n')}\n\n${resultMessage}`);
        }

        if (!extraTurn && !borgolActive) {
            game.currentPlayer = 1 - game.currentPlayer;
        }

        this.games.set(gameId, game);
        await this.sendGameState(game, interaction);
        return true;
    }

    async surrender(gameId, playerId, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            await interaction.reply({ 
                content: '❌ Game tidak ditemukan!', 
                ephemeral: true 
            });
            return false;
        }

        const surrenderingPlayer = game.players.find(p => p.id === playerId);
        const winner = game.players.find(p => p.id !== playerId);

        if (!surrenderingPlayer || !winner) {
            await interaction.reply({ 
                content: '❌ Pemain tidak ditemukan!', 
                ephemeral: true 
            });
            return false;
        }

        const surrenderMessage = `🏳️ **SURRENDER!**\n**${surrenderingPlayer.username}** menyerah!\n**${winner.username}** menang! 🏆`;
        
        this.addActionLog(game, surrenderMessage);
        await this.sendActionMessage(game, interaction, surrenderMessage);
        await this.endGame(gameId, winner, interaction, false);
        return true;
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

    checkChamberReset(game) {
        const loadedRemaining = game.chambers.slice(game.currentChamber).filter(c => c === '💥').length;
        const emptyRemaining = game.chambers.slice(game.currentChamber).filter(c => c === '⚪').length;
        return loadedRemaining === 0 || emptyRemaining === 0;
    }

    async resetChambers(game, interaction = null) {
        try {
            game.chambers = this.generateChambers();
            game.currentChamber = 0;
            
            const player1Items = this.generateItems();
            const player2Items = this.generateItems();
            
            game.items[game.players[0].id] = player1Items;
            game.items[game.players[1].id] = player2Items;
            
            game.effects[game.players[0].id] = { kater: false, borgol: false, borgolShots: 0 };
            game.effects[game.players[1].id] = { kater: false, borgol: false, borgolShots: 0 };
            
            const resetEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("🔄 CHAMBER & ITEM RESET!")
                .setDescription(`**Chamber telah direset dan kalian dapat item baru!**\n\n` +
                    `**${game.players[0].username}:**\n${player1Items.map(item => `${item} ${this.ITEMS[item].name}`).join(', ') || 'No items'}\n\n` +
                    `**${game.players[1].username}:**\n${player2Items.map(item => `${item} ${this.ITEMS[item].name}`).join(', ') || 'No items'}`)
                .setFooter({ text: "Item lama hilang, dapat yang baru!" });

            if (interaction) {
                await interaction.followUp({ embeds: [resetEmbed] });
            } else if (game.channel) {
                await game.channel.send({ embeds: [resetEmbed] });
            }

            this.games.set(game.id, game);
            return true;
        } catch (error) {
            console.error('❌ Error in resetChambers:', error);
            return false;
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

    async endGame(gameId, winner, interaction, isAfk = false) {
        const game = this.games.get(gameId);
        if (!game) return;

        if (this.afkTimeouts.has(gameId)) {
            clearTimeout(this.afkTimeouts.get(gameId));
            this.afkTimeouts.delete(gameId);
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

        if (game.logMessageId) {
            try {
                const message = await game.channel.messages.fetch(game.logMessageId);
                await message.delete();
            } catch (error) {}
        }
        
        this.games.delete(gameId);
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
        if (this.afkTimeouts.has(gameId)) {
            clearTimeout(this.afkTimeouts.get(gameId));
            this.afkTimeouts.delete(gameId);
        }
        this.games.delete(gameId);
    }
}

module.exports = ShotgunDuels;
