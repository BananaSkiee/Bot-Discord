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

        // BUAT LOG MESSAGE TERLEBIH DAHULU
        const initialLogEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎯 SHOTGUN DUELS - BATTLE LOG')
            .setDescription('## ⚔️ PREPARATION PHASE\n\n**Memulai proses gacha items...**')
            .addFields(
                { name: '🔄 STATUS', value: 'Menunggu Player 1...', inline: true },
                { name: '⏰ TIMELINE', value: 'Gacha Items → Reveal Chamber → Game Start', inline: true }
            )
            .setFooter({ text: 'Duel dimulai!' });

        const logMessage = await game.channel.send({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**`,
            embeds: [initialLogEmbed] 
        });
        game.logMessageId = logMessage.id;

        // EMBED 1: GACHA PLAYER 1 - ANIMASI
        const animasi1Embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎰 GACHA ITEM PLAYER 1\n\n**${player1.username}** sedang mengacak items...\n\n\`\`\`\n🎰 ${'▓'.repeat(8)} 🎰\nLoading: 0%\n\`\`\``);

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player1}`,
            embeds: [animasi1Embed] 
        });

        // ANIMASI PROGRESS BAR - 6 DETIK
        for (let i = 1; i <= 6; i++) {
            const progress = Math.floor((i / 6) * 100);
            const bars = '▓'.repeat(i) + '░'.repeat(6 - i);
            
            const progressEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
                .setDescription(`## 🎰 GACHA ITEM PLAYER 1\n\n**${player1.username}** sedang mengacak items...\n\n\`\`\`\n🎰 ${bars} 🎰\nLoading: ${progress}%\n\`\`\``);

            await interaction.editReply({ 
                content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player1}`,
                embeds: [progressEmbed] 
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // EMBED 1: GACHA PLAYER 1 - HASIL
        const player1Items = this.generateItems();
        game.items[player1.id] = player1Items;

        const hasil1Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎁 ITEM PLAYER 1 DITERIMA!\n\n**${player1.username}** mendapatkan items:\n\n${player1Items.map(item => `• ${item} **${this.ITEMS[item].name}** - *${this.ITEMS[item].effect}*`).join('\n')}`)
            .setFooter({ text: 'Beralih ke Player 2...' });

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player1}`,
            embeds: [hasil1Embed] 
        });

        // UPDATE LOG MESSAGE
        const log1Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - BATTLE LOG')
            .setDescription('## ⚔️ PREPARATION PHASE\n\n**Gacha items berhasil!**')
            .addFields(
                { 
                    name: `🎒 ${player1.username}'s ITEMS`, 
                    value: player1Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n') || 'No items',
                    inline: true 
                },
                { 
                    name: `🔄 STATUS`, 
                    value: 'Menunggu Player 2...', 
                    inline: true 
                },
                { 
                    name: '⏳ PROGRESS', 
                    value: '**50% Complete**\nPlayer 1 ✓ | Player 2 ⏳', 
                    inline: true 
                }
            )
            .setFooter({ text: 'Preparation in progress...' });

        await logMessage.edit({ embeds: [log1Embed] });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // EMBED 1: GACHA PLAYER 2 - ANIMASI
        const animasi2Embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎰 GACHA ITEM PLAYER 2\n\n**${player2.username}** sedang mengacak items...\n\n\`\`\`\n🎰 ${'▓'.repeat(8)} 🎰\nLoading: 0%\n\`\`\``);

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player2}`,
            embeds: [animasi2Embed] 
        });

        // ANIMASI PROGRESS BAR - 6 DETIK
        for (let i = 1; i <= 6; i++) {
            const progress = Math.floor((i / 6) * 100);
            const bars = '▓'.repeat(i) + '░'.repeat(6 - i);
            
            const progressEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
                .setDescription(`## 🎰 GACHA ITEM PLAYER 2\n\n**${player2.username}** sedang mengacak items...\n\n\`\`\`\n🎰 ${bars} 🎰\nLoading: ${progress}%\n\`\`\``);

            await interaction.editReply({ 
                content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player2}`,
                embeds: [progressEmbed] 
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // EMBED 1: GACHA PLAYER 2 - HASIL
        const player2Items = this.generateItems();
        game.items[player2.id] = player2Items;

        const hasil2Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🎁 ITEM PLAYER 2 DITERIMA!\n\n**${player2.username}** mendapatkan items:\n\n${player2Items.map(item => `• ${item} **${this.ITEMS[item].name}** - *${this.ITEMS[item].effect}*`).join('\n')}`)
            .setFooter({ text: 'Beralih ke Reveal Chamber...' });

        await interaction.editReply({ 
            content: `**🎮 ${player1.username} 🆚 ${player2.username}**\n${player2}`,
            embeds: [hasil2Embed] 
        });

        // UPDATE LOG MESSAGE
        const log2Embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 SHOTGUN DUELS - BATTLE LOG')
            .setDescription('## ⚔️ PREPARATION PHASE\n\n**Gacha items selesai!**')
            .addFields(
                { 
                    name: `🎒 ${player1.username}'s ITEMS`, 
                    value: player1Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n') || 'No items',
                    inline: true 
                },
                { 
                    name: `🎒 ${player2.username}'s ITEMS`, 
                    value: player2Items.map(item => `${item} ${this.ITEMS[item].name}`).join('\n') || 'No items',
                    inline: true 
                },
                { 
                    name: '⏳ PROGRESS', 
                    value: '**100% Complete**\nPlayer 1 ✓ | Player 2 ✓', 
                    inline: true 
                }
            )
            .setFooter({ text: 'Chamber reveal incoming...' });

        await logMessage.edit({ embeds: [log2Embed] });

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
            .setDescription(`## 🔫 CHAMBER REVEAL\n\n**Mengacak dan memuat chamber...**\n\n\`\`\`\n🔫 ${'▓'.repeat(8)} 🔫\nLoading: 0%\n\`\`\``);

        await interaction.editReply({ 
            content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
            embeds: [animasiChamberEmbed] 
        });

        // ANIMASI PROGRESS BAR - 6 DETIK
        for (let i = 1; i <= 6; i++) {
            const progress = Math.floor((i / 6) * 100);
            const bars = '▓'.repeat(i) + '░'.repeat(6 - i);
            
            const progressEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
                .setDescription(`## 🔫 CHAMBER REVEAL\n\n**Mengacak dan memuat chamber...**\n\n\`\`\`\n🔫 ${bars} 🔫\nLoading: ${progress}%\n\`\`\``);

            await interaction.editReply({ 
                content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
                embeds: [progressEmbed] 
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // GENERATE CHAMBER
        game.chambers = this.generateChambers();
        const loadedCount = game.chambers.filter(c => c === '💥').length;
        const emptyCount = game.chambers.filter(c => c === '⚪').length;

        // EMBED 1: HASIL CHAMBER (MENU UTAMA)
        const hasilChamberEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('🎯 SHOTGUN DUELS - PREPARATION')
            .setDescription(`## 🔫 CHAMBER READY!\n\n**Chamber telah terungkap dan siap untuk duel!**\n\n**💥 ${loadedCount} Loaded** • **⚪ ${emptyCount} Empty**\n\n*Game akan dimulai dalam 3 detik!*`)
            .setFooter({ text: 'Bersiaplah untuk duel!' });

        await interaction.editReply({ 
            content: `**🎮 ${game.players[0].username} 🆚 ${game.players[1].username}**`,
            embeds: [hasilChamberEmbed] 
        });

        // UPDATE LOG MESSAGE
        const logChamberEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('🎯 SHOTGUN DUELS - BATTLE LOG')
            .setDescription('## ⚔️ CHAMBER REVEALED\n\n**Chamber telah terungkap!**')
            .addFields(
                { 
                    name: '🔫 CHAMBER COMPOSITION', 
                    value: `**💥 ${loadedCount} Loaded**\n**⚪ ${emptyCount} Empty**\n\n*Total: 8 Chambers*`,
                    inline: true 
                },
                { 
                    name: '📊 STATISTICS', 
                    value: `**Loaded:** ${Math.round((loadedCount/8)*100)}%\n**Empty:** ${Math.round((emptyCount/8)*100)}%\n**Risk Level:** ${loadedCount >= 5 ? 'HIGH' : loadedCount >= 3 ? 'MEDIUM' : 'LOW'}`,
                    inline: true 
                },
                { 
                    name: '🚀 STATUS', 
                    value: '**READY FOR BATTLE**\nGame starting soon...', 
                    inline: true 
                }
            )
            .setFooter({ text: 'Duel dimulai!' });

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
                .setTitle('🎯 SHOTGUN DUELS - BATTLE PHASE')
                .setColor(0x2F3136)
                .setDescription(`### ⚔️ ${player.username} 🆚 ${opponent.username}`)
                .addFields(
                    {
                        name: '❤️ HEALTH STATUS',
                        value: `⚔️ **${player.username}:** ${'❤️'.repeat(game.health[player.id])}${'♡'.repeat(5 - game.health[player.id])} (${game.health[player.id]}/5)\n⚔️ **${opponent.username}:** ${'❤️'.repeat(game.health[opponent.id])}${'♡'.repeat(5 - game.health[opponent.id])} (${game.health[opponent.id]}/5)`,
                        inline: true
                    },
                    {
                        name: '\n🔫 CHAMBER INFO',
                        value: chamberInfo,
                        inline: true
                    },
                    {
                        name: '\n🎒 INVENTORY',
                        value: `**${player.username}:**\n${game.items[player.id].map(item => `${item} ${this.ITEMS[item].name}`).join('\n') || 'No items'}\n\n**${opponent.username}:**\n${game.items[opponent.id].map(item => `${item} ${this.ITEMS[item].name}`).join('\n') || 'No items'}`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `🎯 Turn: ${player.username} • AFK dalam 5 menit akan kalah!` 
                })
                .setTimestamp();

            // TOMBOL ITEM - FIX BUG KATER & BORGOL
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
        let shouldRemoveItem = true; // SEMUA ITEM LANGSUNG HILANG SETELAH DIPAKAI
        
        switch (item) {
            case '🚬':
                if (game.health[playerId] < 5) {
                    game.health[playerId] = Math.min(5, game.health[playerId] + 1);
                    message = `**${player.username}** menggunakan 🚬 **Rokok** → **+1 HP** (❤️ ${game.health[playerId]}/5)`;
                } else {
                    message = `**${player.username}** menggunakan 🚬 **Rokok** → HP sudah penuh!`;
                }
                break;
                
            case '🍺':
                if (game.chambers.length > 0) {
                    const removed = game.chambers.shift();
                    game.currentChamber = Math.max(0, game.currentChamber - 1);
                    message = `**${player.username}** menggunakan 🍺 **Minum** → **Buang peluru** (${removed === '💥' ? '💥 Loaded' : '⚪ Empty'})`;
                    
                    if (this.checkChamberReset(game)) {
                        await this.resetChambers(game, interaction);
                        message += `\n🔄 **CHAMBER & ITEM RESET!**`;
                    }
                }
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
                message = `**${player.username}** menggunakan 🔪 **Kater** → **Next hit damage 2x!**`;
                break;
                
            case '🔎':
                if (game.currentChamber < game.chambers.length) {
                    const nextChamber = game.chambers[game.currentChamber];
                    message = `**${player.username}** menggunakan 🔎 **Lup** → **Next chamber:** ${nextChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`;
                }
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
                message = `**${player.username}** menggunakan 🔗 **Borgol** → **Dapat 2x tembak dalam 1 giliran!**`;
                break;
        }

        // HAPUS ITEM DARI INVENTORY SETELAH DIPAKAI
        items.splice(itemIndex, 1);

        this.addActionLog(game, message);
        await this.sendActionMessage(game, interaction, game.actionLog.join('\n\n'));

        this.games.set(gameId, game);
        await this.sendGameState(game, interaction);
        return true;
    }

    // ... (method shoot, surrender, checkChamberReset, resetChambers, endGame tetap sama)

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
            // HAPUS KATER SETELAH TEMBAK BERHASIL
            if (playerEffects.kater) {
                playerEffects.kater = false;
            }
        }

        let resultMessage = '';

        if (isLoaded) {
            game.health[targetPlayer.id] = Math.max(0, game.health[targetPlayer.id] - damage);
            
            if (damage > 1) {
                resultMessage = `**${shooter.username}** 🔫 menembak **${targetPlayer.username}**\n💥 **HIT!** Menerima ${damage} damage (2x KATER!)\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`;
            } else {
                resultMessage = `**${shooter.username}** 🔫 menembak **${targetPlayer.username}**\n💥 **HIT!** Menerima ${damage} damage\n❤️ ${targetPlayer.username}: ${game.health[targetPlayer.id]}/5`;
            }

        } else {
            resultMessage = `**${shooter.username}** 🔫 menembak **${targetPlayer.username}**\n⚪ **MISS!** Selamat!`;

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

    // ... (method lainnya tetap sama)

    addActionLog(game, message) {
        game.actionLog.push(message);
        if (game.actionLog.length > 5) {
            game.actionLog.shift();
        }
    }

    async sendActionMessage(game, interaction, content) {
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('🎯 SHOTGUN DUELS - ACTION LOG')
            .setDescription(content)
            .setFooter({ text: `Game ID: ${game.id.slice(-6)} • Real-time Updates` });

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

    // ... (method lainnya)

}

module.exports = ShotgunDuels;
