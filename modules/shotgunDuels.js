const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ITEMS = {
            '🚬': { name: 'Rokok', effect: 'Heal 1 HP' },
            '🍺': { name: 'Minum', effect: 'Buang 1 peluru' },
            '🔪': { name: 'Kater', effect: 'Damage x2 (1x per turn)' },
            '🔎': { name: 'Lup', effect: 'Lihat peluru' },
            '🔗': { name: 'Borgol', effect: 'Skip turn (1x per turn)' }
        };
    }

    getGame(gameId) { return this.games.get(gameId); }
    isPlayerInGame(id) { return [...this.games.values()].some(g => g.players.some(p => p.id === id)); }

    generateChambers() {
        const loaded = Math.floor(Math.random() * 3) + 2; // 2-4 Tajam
        const total = 8;
        return [...Array(loaded).fill('💥'), ...Array(total - loaded).fill('⚪')].sort(() => Math.random() - 0.5);
    }

    giveItems(game) {
        const available = Object.keys(this.ITEMS);
        game.players.forEach(p => {
            const toGive = Math.floor(Math.random() * 4) + 1; // 1-4 item baru sesuai request
            for(let i=0; i < toGive; i++) {
                if (game.items[p.id].length < 4) { // Max 4 items
                    game.items[p.id].push(available[Math.floor(Math.random() * available.length)]);
                }
            }
        });
    }

    async startGame(p1, p2, channel) {
        const gameId = `shotgun-${Date.now()}`;
        // RANDOM STARTER: Acak siapa yang masuk index 0
        const randomizedPlayers = [p1, p2].sort(() => Math.random() - 0.5);
        
        const game = {
            id: gameId,
            players: randomizedPlayers,
            ready: { [p1.id]: false, [p2.id]: false },
            health: { [p1.id]: 5, [p2.id]: 5 },
            items: { [p1.id]: [], [p2.id]: [] },
            effects: { 
                [p1.id]: { dbl: false, skip: false, usedLockItem: false }, 
                [p2.id]: { dbl: false, skip: false, usedLockItem: false } 
            },
            chambers: [],
            currentIdx: 0,
            currentPlayer: 0,
            logs: ['➤ Menunggu kedua pemain menekan tombol SIAP...'],
            message: null,
            phase: 'WAITING',
            channel: channel
        };
        this.games.set(gameId, game);
        await this.render(gameId);
        return gameId;
    }

    addLog(game, text) {
        game.logs.unshift(`➤ ${text}`);
        if (game.logs.length > 5) game.logs.pop(); // Maksimal 5 baris log
    }

    async render(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        const p1 = game.players[0];
        const p2 = game.players[1];
        const turnPlayer = game.players[game.currentPlayer];

        let mainContent = `## 🔫 SHOTGUN DUELS\n`;
        
        if (game.phase === 'WAITING') {
            mainContent += `> **${p1.username}** vs **${p2.username}**\n\n**STATUS:**\n${game.ready[p1.id] ? '✅' : '❌'} ${p1.username}\n${game.ready[p2.id] ? '✅' : '❌'} ${p2.username}\n\n*Duel akan dimulai setelah kedua pemain siap.*`;
        } else if (game.phase === 'REVEAL') {
            mainContent += `### 🔍 REVEAL CHAMBER\nIngat urutan peluru ini dalam **5 detik**:\n# ${game.chambers.join(' ')}\n\n*Jangan sampai lupa!*`;
        } else if (game.phase === 'BATTLE') {
            mainContent += `### 🩸 ARENA\n**${p1.username}:** ${'❤️'.repeat(game.health[p1.id])}\n**${p2.username}:** ${'❤️'.repeat(game.health[p2.id])}\n\n`;
            mainContent += `**GILIRAN:** ${turnPlayer}\n**CHAMBER:** Peluru ke-${game.currentIdx + 1}/8\n\n**📝 LOG:**\n\`\`\`md\n${game.logs.join('\n')}\n\`\`\``;
        } else if (game.phase === 'OVER') {
            mainContent += `### 🏆 GAME OVER\n${game.logs[0]}`;
        }

        const components = [];
        if (game.phase === 'WAITING') {
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`ready_${gameId}`).setLabel('SIAP').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`surrender_${gameId}`).setLabel('SUREND').setStyle(ButtonStyle.Danger)
            ));
        } else if (game.phase === 'BATTLE') {
            const itemRow = new ActionRowBuilder();
            game.items[turnPlayer.id].forEach((emoji, i) => {
                itemRow.addComponents(new ButtonBuilder().setCustomId(`item_${gameId}_${i}`).setEmoji(emoji).setStyle(ButtonStyle.Primary));
            });

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`shoot_opp_${gameId}`).setLabel('TEMBAK LAWAN').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`shoot_self_${gameId}`).setLabel('TEMBAK DIRI').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`surrender_${gameId}`).setLabel('🏳️').setStyle(ButtonStyle.Secondary)
            );

            if (itemRow.components.length > 0) components.push(itemRow);
            components.push(actionRow);
        }

        const payload = {
            content: "",
            components: [{
                type: 17,
                components: [
                    {
                        type: 12, // Media Section
                        items: [{ media: { url: "https://r2.erweima.ai/i/6f90d1920807.png" } }]
                    },
                    { type: 10, content: mainContent }, // Text Section
                    ...components
                ]
            }]
        };

        if (!game.message) {
            game.message = await game.channel.send(payload);
        } else {
            await game.message.edit(payload).catch(() => null);
        }
    }

    async handleAction(customId, gameId, userId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        const [action, , extra] = customId.split('_');

        if (action === 'ready') {
            game.ready[userId] = true;
            if (game.ready[game.players[0].id] && game.ready[game.players[1].id]) {
                await this.triggerReload(game);
            } else {
                await this.render(gameId);
            }
        }

        if (action === 'shoot') {
            const target = extra; // 'opp' atau 'self'
            const shooter = game.players[game.currentPlayer];
            const opponent = game.players[1 - game.currentPlayer];
            const isLive = game.chambers[game.currentIdx] === '💥';
            const dmg = game.effects[shooter.id].dbl ? 2 : 1;

            if (isLive) {
                const victimId = target === 'opp' ? opponent.id : shooter.id;
                game.health[victimId] = Math.max(0, game.health[victimId] - dmg);
                this.addLog(game, `${shooter.username} menembak ${target === 'opp' ? opponent.username : 'diri'}... 💥 KENA! (-${dmg} HP)`);
            } else {
                this.addLog(game, `${shooter.username} menembak ${target === 'opp' ? opponent.username : 'diri'}... ⚪ MISS!`);
            }

            game.currentIdx++;
            game.effects[shooter.id].dbl = false;
            game.effects[shooter.id].usedLockItem = false;

            if (game.health[p1.id] <= 0 || game.health[p2.id] <= 0) { // Cek HP
                const winner = game.health[shooter.id] > 0 ? shooter : opponent;
                this.addLog(game, `🏆 ${winner.username} menang duel!`);
                game.phase = 'OVER';
                await this.render(gameId);
                return this.games.delete(gameId);
            }

            if (target === 'self' && !isLive) {
                this.addLog(game, `✨ Bonus turn untuk ${shooter.username}!`);
            } else {
                if (game.effects[opponent.id].skip) {
                    game.effects[opponent.id].skip = false;
                    this.addLog(game, `🔗 ${opponent.username} terlewat!`);
                } else {
                    game.currentPlayer = 1 - game.currentPlayer;
                }
            }

            if (game.currentIdx >= 8) await this.triggerReload(game);
            else await this.render(gameId);
        }

        if (action === 'item') {
            const idx = parseInt(extra);
            const item = game.items[userId][idx];
            const shooter = game.players[game.currentPlayer];

            // Item Lock (Borgol/Pisau 1x per turn)
            if ((item === '🔗' || item === '🔪') && game.effects[userId].usedLockItem) {
                return await interaction.followUp({ content: "❌ Kamu sudah menggunakan item jenis ini di turn sekarang!", ephemeral: true });
            }

            game.items[userId].splice(idx, 1);
            if (item === '🔗' || item === '🔪') game.effects[userId].usedLockItem = true;

            if (item === '🚬') { game.health[userId] = Math.min(game.health[userId] + 1, 5); this.addLog(game, `${shooter.username} pakai Rokok 🚬 (+1 HP)`); }
            if (item === '🍺') { this.addLog(game, `${shooter.username} pakai Bir 🍺: Peluru ${game.chambers[game.currentIdx]} dibuang.`); game.currentIdx++; }
            if (item === '🔪') { game.effects[userId].dbl = true; this.addLog(game, `${shooter.username} pakai Pisau 🔪 (DMG x2!)`); }
            if (item === '🔗') { game.effects[game.players[1 - game.currentPlayer].id].skip = true; this.addLog(game, `${shooter.username} pakai Borgol 🔗`); }
            if (item === '🔎') { 
                await interaction.followUp({ content: `🔎 Peluru saat ini: **${game.chambers[game.currentIdx]}**`, ephemeral: true });
            }

            if (game.currentIdx >= 8) await this.triggerReload(game);
            else await this.render(gameId);
        }

        if (action === 'surrender') {
            const loser = game.players.find(p => p.id === userId);
            const winner = game.players.find(p => p.id !== userId);
            this.addLog(game, `🏳️ ${loser.username} menyerah! ${winner.username} menang!`);
            game.phase = 'OVER';
            await this.render(gameId);
            this.games.delete(gameId);
        }
    }

    async triggerReload(game) {
        game.phase = 'REVEAL';
        game.chambers = this.generateChambers();
        game.currentIdx = 0;
        this.giveItems(game);
        this.addLog(game, "Chamber Reloaded & Item dibagikan.");
        await this.render(game.id);

        setTimeout(async () => {
            if (this.games.has(game.id)) {
                game.phase = 'BATTLE';
                await this.render(game.id);
            }
        }, 5000);
    }
}

module.exports = ShotgunDuels;
