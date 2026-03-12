const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ITEMS = {
            '🚬': { name: 'Rokok', effect: 'Heal 1 HP' },
            '🍺': { name: 'Minum', effect: 'Buang 1 peluru' },
            '🔪': { name: 'Kater', effect: 'Damage x2' },
            '🔎': { name: 'Lup', effect: 'Lihat peluru' },
            '🔗': { name: 'Borgol', effect: 'Skip turn' }
        };
    }

    getGame(gameId) { return this.games.get(gameId); }
    isPlayerInGame(id) { return [...this.games.values()].some(g => g.players.some(p => p.id === id)); }

    generateChambers() {
        const loaded = Math.floor(Math.random() * 3) + 2; 
        return [...Array(loaded).fill('💥'), ...Array(8 - loaded).fill('⚪')].sort(() => Math.random() - 0.5);
    }

    giveItems(game) {
        const available = Object.keys(this.ITEMS);
        game.players.forEach(p => {
            const toGive = Math.floor(Math.random() * 3) + 1;
            for(let i=0; i < toGive; i++) {
                if (game.items[p.id].length < 4) game.items[p.id].push(available[Math.floor(Math.random() * available.length)]);
            }
        });
    }

    async startGame(p1, p2, channel) {
        const gameId = `shotgun-${Date.now()}`;
        const randomizedPlayers = [p1, p2].sort(() => Math.random() - 0.5);
        
        const game = {
            id: gameId,
            players: randomizedPlayers,
            ready: { [p1.id]: false, [p2.id]: false },
            health: { [p1.id]: 5, [p2.id]: 5 },
            items: { [p1.id]: [], [p2.id]: [] },
            effects: { 
                [p1.id]: { dbl: false, skip: false, usedLock: false }, 
                [p2.id]: { dbl: false, skip: false, usedLock: false } 
            },
            chambers: [],
            currentIdx: 0,
            currentPlayer: 0,
            logs: ['➤ Menunggu pemain menekan tombol SIAP...'],
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
        if (game.logs.length > 5) game.logs.pop();
    }

    async render(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        const p1 = game.players[0];
        const p2 = game.players[1];
        const turnPlayer = game.players[game.currentPlayer];

        let mainContent = `## 🔫 SHOTGUN DUELS\n`;
        if (game.phase === 'WAITING') {
            mainContent += `**STATUS PERSIAPAN:**\n${game.ready[p1.id] ? '✅' : '❌'} ${p1.username}\n${game.ready[p2.id] ? '✅' : '❌'} ${p2.username}`;
        } else if (game.phase === 'REVEAL') {
            mainContent += `### 🔍 REVEAL CHAMBER (5 Detik)\n# ${game.chambers.join(' ')}`;
        } else if (game.phase === 'BATTLE') {
            mainContent += `### 🩸 ARENA\n**${p1.username}:** ${'❤️'.repeat(game.health[p1.id])}\n**${p2.username}:** ${'❤️'.repeat(game.health[p2.id])}\n\n**GILIRAN:** ${turnPlayer}\n**LOG:**\n\`\`\`md\n${game.logs.join('\n')}\n\`\`\``;
        } else if (game.phase === 'OVER') {
            mainContent += `### 🏆 HASIL AKHIR\n${game.logs[0]}`;
        }

        const buttons = [];
        if (game.phase === 'WAITING') {
            buttons.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`ready_${gameId}`).setLabel('SIAP').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`surrender_${gameId}`).setLabel('BATAL').setStyle(ButtonStyle.Danger)
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
            if (itemRow.components.length > 0) buttons.push(itemRow);
            buttons.push(actionRow);
        }

        // PERBAIKAN: Bungkus Container di dalam komponen yang valid
        const payload = {
            content: "",
            components: [
                {
                    type: 1, // Action Row sebagai pembungkus utama
                    components: [{
                        type: 17, // Container v2
                        components: [
                            { type: 12, items: [{ media: { url: "https://r2.erweima.ai/i/6f90d1920807.png" } }] },
                            { type: 10, content: mainContent }
                        ]
                    }]
                },
                ...buttons // Tombol-tombol ditaruh setelah Container
            ]
        };

        try {
            if (!game.message) {
                game.message = await game.channel.send(payload);
            } else {
                await game.message.edit(payload);
            }
        } catch (e) { console.error("Render Error:", e); }
    }

    async handleAction(customId, gameId, userId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        const parts = customId.split('_');
        const action = parts[0];

        if (action === 'ready') {
            game.ready[userId] = true;
            if (game.ready[game.players[0].id] && game.ready[game.players[1].id]) {
                await this.triggerReload(game);
            } else { await this.render(gameId); }
        }

        if (action === 'shoot') {
            const target = parts[1]; // opp / self
            const shooter = game.players[game.currentPlayer];
            const opponent = game.players[1 - game.currentPlayer];
            const isLive = game.chambers[game.currentIdx] === '💥';
            const dmg = game.effects[shooter.id].dbl ? 2 : 1;

            if (isLive) {
                const victimId = target === 'opp' ? opponent.id : shooter.id;
                game.health[victimId] = Math.max(0, game.health[victimId] - dmg);
                this.addLog(game, `${shooter.username} nembak ${target === 'opp' ? 'lawan' : 'diri'}... 💥 KENA!`);
            } else {
                this.addLog(game, `${shooter.username} nembak ${target === 'opp' ? 'lawan' : 'diri'}... ⚪ MISS!`);
            }

            game.currentIdx++;
            game.effects[shooter.id].dbl = false;
            game.effects[shooter.id].usedLock = false;

            if (game.health[game.players[0].id] <= 0 || game.health[game.players[1].id] <= 0) {
                const winner = game.health[shooter.id] > 0 ? shooter : opponent;
                this.addLog(game, `🏆 ${winner.username} MENANG!`);
                game.phase = 'OVER';
                await this.render(gameId);
                return this.games.delete(gameId);
            }

            if (!(target === 'self' && !isLive)) {
                if (game.effects[opponent.id].skip) {
                    game.effects[opponent.id].skip = false;
                    this.addLog(game, `🔗 ${opponent.username} di-borgol!`);
                } else { game.currentPlayer = 1 - game.currentPlayer; }
            } else { this.addLog(game, `✨ Bonus giliran!`); }

            if (game.currentIdx >= 8) await this.triggerReload(game);
            else await this.render(gameId);
        }

        if (action === 'item') {
            const idx = parseInt(parts[2]);
            const item = game.items[userId][idx];
            if ((item === '🔗' || item === '🔪') && game.effects[userId].usedLock) {
                return await interaction.followUp({ content: "Item ini cuma bisa 1x per turn!", flags: 64 });
            }
            game.items[userId].splice(idx, 1);
            if (item === '🔗' || item === '🔪') game.effects[userId].usedLock = true;

            if (item === '🚬') { game.health[userId] = Math.min(game.health[userId] + 1, 5); this.addLog(game, `${userId === game.players[0].id ? game.players[0].username : game.players[1].username} ngerokok.`); }
            if (item === '🔪') { game.effects[userId].dbl = true; this.addLog(game, `Pisau dipakai.`); }
            if (item === '🔗') { game.effects[game.players[1-game.currentPlayer].id].skip = true; this.addLog(game, `Borgol dipasang.`); }
            if (item === '🍺') { this.addLog(game, `Peluru ${game.chambers[game.currentIdx]} dibuang.`); game.currentIdx++; }
            if (item === '🔎') { await interaction.followUp({ content: `Peluru: ${game.chambers[game.currentIdx]}`, flags: 64 }); }

            if (game.currentIdx >= 8) await this.triggerReload(game);
            else await this.render(gameId);
        }

        if (action === 'surrender') {
            this.addLog(game, `Pemain menyerah.`);
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
        this.addLog(game, "Chamber diisi ulang.");
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
