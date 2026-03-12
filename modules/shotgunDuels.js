// modules/shotgunDuels.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ROUND_START_ITEMS = [2, 3, 4];
        this.ITEMS = {
            '🚬': { name: 'Rokok', effect: 'Heal +1 HP (max 5)' },
            '🍺': { name: 'Minum', effect: 'Buang peluru terdepan' },
            '🔪': { name: 'Kater', effect: 'Next hit damage 2x' },
            '🔎': { name: 'Lup', effect: 'Lihat chamber berikutnya' },
            '🔗': { name: 'Borgol', effect: 'Lawan skip 1 turn' }
        };
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    isPlayerInGame(playerId) {
        for (const game of this.games.values()) {
            if (game.players.some(p => p.id === playerId)) return true;
        }
        return false;
    }

    generateChambers() {
        // Logika Buckshot: Minimal 2 peluru, maksimal 8 total.
        const total = 8;
        const loaded = Math.floor(Math.random() * 3) + 2; // 2-4 peluru tajam
        const empty = total - loaded;
        
        return [
            ...Array(loaded).fill('💥'),
            ...Array(empty).fill('⚪')
        ].sort(() => Math.random() - 0.5);
    }

    generateItems() {
        const itemCount = this.ROUND_START_ITEMS[Math.floor(Math.random() * this.ROUND_START_ITEMS.length)];
        const availableItems = Object.keys(this.ITEMS);
        return Array.from({ length: itemCount }, () => availableItems[Math.floor(Math.random() * availableItems.length)]);
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
                items: { [players[0].id]: [], [players[1].id]: [] },
                health: { [players[0].id]: 5, [players[1].id]: 5 },
                effects: { 
                    [players[0].id]: { doubleDamage: false, skipTurn: false },
                    [players[1].id]: { doubleDamage: false, skipTurn: false }
                },
                channel: channel,
                gameMessage: null,
                isProcessing: false // Lock biar gak spam klik
            };

            this.games.set(gameId, game);
            await this.startNewRound(game);
            return gameId;
        } catch (error) {
            console.error('❌ Error in startGame:', error);
            return null;
        }
    }

    async startNewRound(game) {
        // Kasih item baru setiap round peluru diisi
        game.items[game.players[0].id] = [...game.items[game.players[0].id], ...this.generateItems()].slice(0, 8);
        game.items[game.players[1].id] = [...game.items[game.players[1].id], ...this.generateItems()].slice(0, 8);
        
        game.chambers = this.generateChambers();
        game.currentChamber = 0;

        const loaded = game.chambers.filter(c => c === '💥').length;
        const empty = game.chambers.filter(c => c === '⚪').length;

        const chamberEmbed = new EmbedBuilder()
            .setTitle('🔫 CHAMBER RELOADED')
            .setColor(0xFF6B6B)
            .setDescription(`Shotgun telah diisi ulang!\n\n**💥 ${loaded} Peluru Tajam**\n**⚪ ${empty} Peluru Kosong**\n\nMenyiapkan arena...`);

        const msg = await game.channel.send({ embeds: [chamberEmbed] });
        
        setTimeout(async () => {
            await msg.delete().catch(() => null);
            await this.sendGameState(game);
        }, 4000);
    }

    async sendGameState(game) {
        // Jika peluru habis, reload
        if (game.currentChamber >= game.chambers.length) {
            return await this.startNewRound(game);
        }

        const player = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];

        const embed = new EmbedBuilder()
            .setTitle('🎯 SHOTGUN DUELS - BATTLE PHASE')
            .setColor(0x2F3136)
            .setThumbnail('https://cdn.discordapp.com/emojis/1093993933549457448.webp')
            .setDescription(`Giliran: **${player.username}**`)
            .addFields(
                {
                    name: `❤️ HP ${player.username}`,
                    value: `${'❤️'.repeat(game.health[player.id])} (${game.health[player.id]})`,
                    inline: true
                },
                {
                    name: `❤️ HP ${opponent.username}`,
                    value: `${'❤️'.repeat(game.health[opponent.id])} (${game.health[opponent.id]})`,
                    inline: true
                },
                {
                    name: '🔫 STATS CHAMBER',
                    value: `Sisa Peluru: **${game.chambers.length - game.currentChamber}**\nNext DMG: **${game.effects[player.id].doubleDamage ? '2x 🔪' : '1x'}**`,
                    inline: false
                },
                {
                    name: '🎒 INVENTORY KAMU',
                    value: game.items[player.id].map((item, i) => `\`${i + 1}\` ${item} ${this.ITEMS[item].name}`).join('\n') || '*Kosong*',
                    inline: false
                }
            )
            .setFooter({ text: `Gunakan tombol di bawah untuk bertindak!` });

        // Tombol Items (Max 5 per row)
        const itemRows = [];
        if (game.items[player.id].length > 0) {
            const itemButtons = game.items[player.id].slice(0, 5).map((item, index) => 
                new ButtonBuilder()
                    .setCustomId(`item_${game.id}_${index}`)
                    .setEmoji(item)
                    .setStyle(ButtonStyle.Primary)
            );
            itemRows.push(new ActionRowBuilder().addComponents(itemButtons));
        }

        // Tombol Action
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`shoot_self_${game.id}`).setLabel('Tembak Diri').setEmoji('🎯').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`shoot_opponent_${game.id}`).setLabel('Tembak Lawan').setEmoji('🔫').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`surrender_${game.id}`).setLabel('🏳️').setStyle(ButtonStyle.Secondary)
        );

        const components = [...itemRows, actionRow];

        // LOGIC ANTI-SPAM: Gunakan edit pesan jika pesan sudah ada
        if (game.gameMessage) {
            await game.gameMessage.edit({ content: `${player}`, embeds: [embed], components }).catch(async () => {
                game.gameMessage = await game.channel.send({ content: `${player}`, embeds: [embed], components });
            });
        } else {
            game.gameMessage = await game.channel.send({ content: `${player}`, embeds: [embed], components });
        }
        game.isProcessing = false;
    }

    async shoot(gameId, playerId, target, interaction) {
        const game = this.games.get(gameId);
        if (!game || game.isProcessing) return;
        game.isProcessing = true;

        const isLive = game.chambers[game.currentChamber] === '💥';
        const shooter = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];
        const dmg = game.effects[shooter.id].doubleDamage ? 2 : 1;

        let resultMsg = "";
        if (isLive) {
            const targetId = target === 'self' ? shooter.id : opponent.id;
            game.health[targetId] = Math.max(0, game.health[targetId] - dmg);
            resultMsg = `💥 **DOOR!** ${target === 'self' ? shooter : opponent} kena peluru tajam! **-${dmg} HP**`;
            game.effects[shooter.id].doubleDamage = false;
        } else {
            resultMsg = `⚪ **KLIK...** Peluru kosong.`;
        }

        game.currentChamber++;
        await game.channel.send(resultMsg);

        // Cek Mati
        if (game.health[shooter.id] <= 0 || game.health[opponent.id] <= 0) {
            const winner = game.health[shooter.id] > 0 ? shooter : opponent;
            const winEmbed = new EmbedBuilder()
                .setTitle('🏆 DUEL BERAKHIR')
                .setColor(0xF1C40F)
                .setDescription(`Selamat kepada **${winner.username}** yang berhasil bertahan hidup!`);
            
            await game.channel.send({ embeds: [winEmbed] });
            if (game.gameMessage) await game.gameMessage.delete().catch(() => null);
            return this.games.delete(gameId);
        }

        // Penentuan Giliran
        let extraTurn = false;
        if (target === 'self' && !isLive) {
            extraTurn = true;
            await game.channel.send(`✨ **${shooter.username}** beruntung! Karena nembak diri pakai peluru kosong, dapat giliran lagi.`);
        } else {
            if (game.effects[opponent.id].skipTurn) {
                game.effects[opponent.id].skipTurn = false;
                await game.channel.send(`🔗 **${opponent.username}** masih diborgol! Giliran **${shooter.username}** lagi.`);
                extraTurn = true;
            } else {
                game.currentPlayer = 1 - game.currentPlayer;
            }
        }

        // Reset damage effect if it was used or if turn changes
        game.effects[shooter.id].doubleDamage = false;

        setTimeout(() => this.sendGameState(game), 2000);
    }

    async useItem(gameId, playerId, itemIndex, interaction) {
        const game = this.games.get(gameId);
        if (!game || game.isProcessing) return;
        
        const item = game.items[playerId][itemIndex];
        const shooter = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];

        game.items[playerId].splice(itemIndex, 1);
        game.isProcessing = true;

        let effectMsg = "";
        switch (item) {
            case '🚬':
                game.health[playerId] = Math.min(game.health[playerId] + 1, 5);
                effectMsg = `🚬 **${shooter.username}** ngerokok. HP nambah jadi ${game.health[playerId]}!`;
                break;
            case '🍺':
                const ejected = game.chambers[game.currentChamber];
                game.currentChamber++;
                effectMsg = `🍺 **${shooter.username}** minum bir. Peluru **${ejected}** dibuang keluar!`;
                break;
            case '🔎':
                const next = game.chambers[game.currentChamber];
                game.isProcessing = false;
                return await interaction.followUp({ content: `🔎 Kamu ngintip... peluru berikutnya adalah: **${next}**`, ephemeral: true });
            case '🔪':
                game.effects[playerId].doubleDamage = true;
                effectMsg = `🔪 **${shooter.username}** motong laras shotgun! Damage berikutnya **2x lipat**!`;
                break;
            case '🔗':
                game.effects[opponent.id].skipTurn = true;
                effectMsg = `🔗 **${shooter.username}** masang borgol ke **${opponent.username}**!`;
                break;
        }

        await game.channel.send(effectMsg);
        setTimeout(() => this.sendGameState(game), 1500);
    }

    async surrender(gameId, playerId) {
        const game = this.games.get(gameId);
        if (!game) return;
        const winner = game.players.find(p => p.id !== playerId);
        await game.channel.send(`🏳️ Duel dibubarkan karena salah satu pemain menyerah. **${winner.username}** menang lewat WO!`);
        if (game.gameMessage) await game.gameMessage.delete().catch(() => null);
        this.games.delete(gameId);
    }
}

module.exports = ShotgunDuels;
