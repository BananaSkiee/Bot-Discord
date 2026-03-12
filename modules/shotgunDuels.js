const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShotgunDuels {
    constructor() {
        this.games = new Map();
        this.ITEMS = { '🚬': 'Heal', '🍺': 'Burn', '🔪': 'Dmg', '🔎': 'See', '🔗': 'Lock' };
    }

    getGame(gameId) { return this.games.get(gameId); }
    isPlayerInGame(id) { return [...this.games.values()].some(g => g.players.some(p => p.id === id)); }

    async startGame(p1, p2, channel) {
        const gameId = `shotgun-${Date.now()}`;
        const randomizedPlayers = [p1, p2].sort(() => Math.random() - 0.5);
        const game = {
            id: gameId,
            players: randomizedPlayers,
            ready: { [p1.id]: false, [p2.id]: false },
            health: { [p1.id]: 5, [p2.id]: 5 },
            items: { [p1.id]: [], [p2.id]: [] },
            effects: { [p1.id]: { dbl: false, skip: false, usedLock: false }, [p2.id]: { dbl: false, skip: false, usedLock: false } },
            chambers: [],
            currentIdx: 0,
            currentPlayer: 0,
            logs: ['➤ Menunggu pemain SIAP...'],
            message: null,
            phase: 'WAITING',
            channel: channel
        };
        this.games.set(gameId, game);
        await this.render(gameId);
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

        let content = `## 🔫 SHOTGUN DUELS\n`;
        if (game.phase === 'WAITING') {
            content += `> **${p1.username}** vs **${p2.username}**\n${game.ready[p1.id] ? '✅' : '❌'} P1 | ${game.ready[p2.id] ? '✅' : '❌'} P2`;
        } else if (game.phase === 'REVEAL') {
            content += `### 🔍 REVEAL (5s)\n# ${game.chambers.join(' ')}`;
        } else if (game.phase === 'BATTLE') {
            content += `### 🩸 ARENA\n**${p1.username}**: ${'❤️'.repeat(game.health[p1.id])}\n**${p2.username}**: ${'❤️'.repeat(game.health[p2.id])}\n\n**LOGS:**\n\`\`\`md\n${game.logs.join('\n')}\n\`\`\``;
        } else {
            content += `### 🏆 SELESAI\n${game.logs[0]}`;
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

        // --- V2 COMPONENT PAYLOAD ---
        const payload = {
            components: [
                {
                    type: 1, // Action Row utama
                    components: [{
                        type: 17, // Container
                        components: [
                            { type: 12, items: [{ media: { url: "https://r2.erweima.ai/i/6f90d1920807.png" } }] }, // Media Section
                            { type: 10, content: content } // Text Section
                        ]
                    }]
                },
                ...buttons // Tombol ditaruh di Row terpisah
            ]
        };

        if (!game.message) game.message = await game.channel.send(payload);
        else await game.message.edit(payload).catch(e => console.log("Edit fail:", e.message));
    }

    async handleAction(customId, gameId, userId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        const [action, , extra] = customId.split('_');

        if (action === 'ready') {
            game.ready[userId] = true;
            if (game.ready[game.players[0].id] && game.ready[game.players[1].id]) {
                await this.triggerReload(game);
            } else await this.render(gameId);
        }
        // ... (Logic tembak & item sama seperti sebelumnya, pastikan game.phase diupdate)
        // Tambahkan logic handleAction lu di sini
    }

    async triggerReload(game) {
        game.phase = 'REVEAL';
        game.chambers = [...Array(Math.floor(Math.random()*3)+2).fill('💥'), ...Array(4).fill('⚪')].sort(() => Math.random()-0.5);
        game.currentIdx = 0;
        await this.render(game.id);
        setTimeout(async () => { game.phase = 'BATTLE'; await this.render(game.id); }, 5000);
    }
}

// EXPORT INSTANCE LANGSUNG BIAR GAK UNDEFINED
module.exports = new ShotgunDuels();
