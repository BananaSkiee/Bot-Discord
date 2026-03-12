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
        const empty = Math.floor(Math.random() * 4) + 2; // Minimal 2 kosong, maksimal 5 kosong
        const loaded = 8 - empty;
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
                messageId: null,
                logMessageId: null
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
        const p1 = game.players[0];
        const p2 = game.players[1];

        // Gacha untuk Player 1
        game.items[p1.id] = this.generateItems();
        // Gacha untuk Player 2
        game.items[p2.id] = this.generateItems();

        const gachaEmbed = new EmbedBuilder()
            .setTitle('🎯 GACHA ITEMS SELESAI')
            .setColor(0x00FF00)
            .setDescription(`**${p1.username}** dan **${p2.username}** telah menerima item mereka!`)
            .addFields(
                { name: `🎒 ${p1.username}`, value: game.items[p1.id].join(' ') || 'Kosong', inline: true },
                { name: `🎒 ${p2.username}`, value: game.items[p2.id].join(' ') || 'Kosong', inline: true }
            );

        await interaction.editReply({ embeds: [gachaEmbed], components: [] });
        
        // Jeda sebentar sebelum reveal chamber
        setTimeout(async () => {
            await this.revealChamber(game.id, interaction);
        }, 3000);
    }

    async revealChamber(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        game.chambers = this.generateChambers();
        const loaded = game.chambers.filter(c => c === '💥').length;
        const empty = game.chambers.filter(c => c === '⚪').length;

        const chamberEmbed = new EmbedBuilder()
            .setTitle('🔫 CHAMBER RELOADED')
            .setColor(0xFF6B6B)
            .setDescription(`Shotgun telah diisi!\n\n**💥 ${loaded} Peluru Tajam**\n**⚪ ${empty} Peluru Kosong**\n\nGame dimulai sekarang!`);

        await game.channel.send({ embeds: [chamberEmbed] });
        await this.sendGameState(game);
    }

    async sendGameState(game) {
        if (game.currentChamber >= game.chambers.length) {
            return await this.revealChamber(game.id);
        }

        const player = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];

        const embed = new EmbedBuilder()
            .setTitle('🎯 SHOTGUN DUELS - BATTLE PHASE')
            .setColor(0x2F3136)
            .setDescription(`### ${player.username} vs ${opponent.username}`)
            .addFields(
                {
                    name: '❤️ DARAH',
                    value: `**${player.username}:** ${'❤️'.repeat(game.health[player.id])}\n**${opponent.username}:** ${'❤️'.repeat(game.health[opponent.id])}`,
                    inline: true
                },
                {
                    name: '🔫 INFO',
                    value: `Peluru ke: **${game.currentChamber + 1}/8**\nSisa Tajam: **${game.chambers.slice(game.currentChamber).filter(c => c === '💥').length}**`,
                    inline: true
                },
                {
                    name: '🎒 INVENTORY KAMU',
                    value: game.items[player.id].map((item, i) => `\`${i + 1}\` ${item} ${this.ITEMS[item].name}`).join('\n') || 'Tidak ada item',
                    inline: false
                }
            )
            .setFooter({ text: `Giliran: ${player.username}` });

        const itemButtons = game.items[player.id].slice(0, 5).map((item, index) => 
            new ButtonBuilder()
                .setCustomId(`item_${game.id}_${index}`)
                .setEmoji(item)
                .setStyle(ButtonStyle.Primary)
        );

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`shoot_self_${game.id}`).setLabel('Tembak Diri').setEmoji('🎯').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`shoot_opponent_${game.id}`).setLabel('Tembak Lawan').setEmoji('🔫').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`surrender_${game.id}`).setLabel('Menyerah').setStyle(ButtonStyle.Secondary)
        );

        const components = itemButtons.length > 0 ? [new ActionRowBuilder().addComponents(itemButtons), actionRow] : [actionRow];

        if (game.messageId) {
            const oldMsg = await game.channel.messages.fetch(game.messageId).catch(() => null);
            if (oldMsg) await oldMsg.delete();
        }

        const msg = await game.channel.send({ content: `${player}`, embeds: [embed], components });
        game.messageId = msg.id;
    }

    async shoot(gameId, playerId, target, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        const isLive = game.chambers[game.currentChamber] === '💥';
        const shooter = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];
        const dmg = game.effects[shooter.id].doubleDamage ? 2 : 1;

        let msg = "";
        if (isLive) {
            const targetId = target === 'self' ? shooter.id : opponent.id;
            game.health[targetId] -= dmg;
            msg = `💥 **DOOR!** ${target === 'self' ? shooter : opponent} tertembak peluru tajam! (-${dmg} HP)`;
            game.effects[shooter.id].doubleDamage = false;
        } else {
            msg = `⚪ **KLIK...** Peluru kosong.`;
        }

        game.currentChamber++;
        await game.channel.send(msg);

        // Cek Game Over
        if (game.health[shooter.id] <= 0 || game.health[opponent.id] <= 0) {
            const winner = game.health[shooter.id] > 0 ? shooter : opponent;
            await game.channel.send(`🏆 **DUEL SELESAI!** ${winner} adalah pemenangnya!`);
            return this.games.delete(gameId);
        }

        // Giliran
        if (!(target === 'self' && !isLive)) {
            if (game.effects[opponent.id].skipTurn) {
                game.effects[opponent.id].skipTurn = false;
                await game.channel.send(`🔗 ${opponent.username} tidak bisa bergerak karena borgol! Giliran ${shooter.username} lagi.`);
            } else {
                game.currentPlayer = 1 - game.currentPlayer;
            }
        } else {
            await game.channel.send(`✨ Karena nembak diri sendiri pakai peluru kosong, **${shooter.username}** dapat giliran lagi!`);
        }

        await this.sendGameState(game);
    }

    async useItem(gameId, playerId, itemIndex, interaction) {
        const game = this.games.get(gameId);
        const item = game.items[playerId][itemIndex];
        const shooter = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];

        game.items[playerId].splice(itemIndex, 1);

        let effectMsg = "";
        switch (item) {
            case '🚬':
                game.health[playerId] = Math.min(game.health[playerId] + 1, 5);
                effectMsg = `🚬 **${shooter.username}** merokok dan merasa lebih sehat! (+1 HP)`;
                break;
            case '🍺':
                const ejected = game.chambers[game.currentChamber];
                game.currentChamber++;
                effectMsg = `🍺 **${shooter.username}** minum bir dan membuang peluru: **${ejected}**`;
                break;
            case '🔎':
                const next = game.chambers[game.currentChamber];
                await interaction.followUp({ content: `🔎 Peluru saat ini adalah: **${next}**`, ephemeral: true });
                return await this.sendGameState(game);
            case '🔪':
                game.effects[playerId].doubleDamage = true;
                effectMsg = `🔪 **${shooter.username}** menggergaji shotgunnya! Damage berikutnya menjadi 2!`;
                break;
            case '🔗':
                game.effects[opponent.id].skipTurn = true;
                effectMsg = `🔗 **${shooter.username}** memborgol **${opponent.username}**!`;
                break;
        }

        await game.channel.send(effectMsg);
        await this.sendGameState(game);
    }

    async surrender(gameId, playerId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        const loser = game.players.find(p => p.id === playerId);
        const winner = game.players.find(p => p.id !== playerId);
        await game.channel.send(`🏳️ **${loser.username}** menyerah! **${winner.username}** menang!`);
        this.games.delete(gameId);
    }
}

module.exports = ShotgunDuels;
