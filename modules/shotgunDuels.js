const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    games: new Map(),

    async startGame(p1, p2, channel) {
        const gameId = `sg_${Date.now()}`;
        const randomized = [p1, p2].sort(() => Math.random() - 0.5);
        
        const game = {
            id: gameId,
            players: randomized,
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
            logs: ['➤ Menunggu pemain SIAP...'],
            message: null,
            phase: 'WAITING',
            channel: channel
        };
        this.games.set(gameId, game);
        await this.render(gameId);
    },

    addLog(game, text) {
        game.logs.unshift(`➤ ${text}`);
        if (game.logs.length > 5) game.logs.pop();
    },

    async render(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        const p1 = game.players[0];
        const p2 = game.players[1];
        const turnPlayer = game.players[game.currentPlayer];

        let content = "## 🔫 SHOTGUN DUELS\n";
        if (game.phase === 'WAITING') {
            content += `> **${p1.username}** vs **${p2.username}**\n\n**STATUS:**\n${game.ready[p1.id] ? '✅' : '❌'} ${p1.username}\n${game.ready[p2.id] ? '✅' : '❌'} ${p2.username}`;
        } else if (game.phase === 'REVEAL') {
            content += `### 🔍 REVEAL (5 Detik)\n# ${game.chambers.join(' ')}\n-# Ingat urutan peluru ini!`;
        } else if (game.phase === 'BATTLE') {
            content += `### 🩸 ARENA\n**${p1.username}:** ${'❤️'.repeat(game.health[p1.id])} (${game.health[p1.id]})\n**${p2.username}:** ${'❤️'.repeat(game.health[p2.id])} (${game.health[p2.id]})\n\n**TURN:** ${turnPlayer}\n\`\`\`md\n${game.logs.join('\n')}\n\`\`\``;
        } else {
            content += `### 🏆 HASIL AKHIR\n${game.logs[0]}`;
        }

        const rows = [];
        if (game.phase === 'WAITING') {
            rows.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`sg_ready_${gameId}`).setLabel('SIAP').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`sg_surrender_${gameId}`).setLabel('BATAL').setStyle(ButtonStyle.Danger)
            ));
        } else if (game.phase === 'BATTLE') {
            const itemRow = new ActionRowBuilder();
            game.items[turnPlayer.id].forEach((emoji, i) => {
                itemRow.addComponents(new ButtonBuilder().setCustomId(`sg_item_${gameId}_${i}`).setEmoji(emoji).setStyle(ButtonStyle.Primary));
            });
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`sg_shoot_opp_${gameId}`).setLabel('TEMBAK LAWAN').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`sg_shoot_self_${gameId}`).setLabel('TEMBAK DIRI').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`sg_surrender_${gameId}`).setLabel('🏳️').setStyle(ButtonStyle.Secondary)
            );
            if (itemRow.components.length > 0) rows.push(itemRow);
            rows.push(actionRow);
        }

        const payload = {
            components: [{
                type: 17,
                components: [
                    { type: 12, items: [{ media: { url: "https://r2.erweima.ai/i/6f90d1920807.png" } }] },
                    { type: 14, spacing: 1 },
                    { type: 10, content: content },
                    ...rows.map(r => r.toJSON()),
                    { type: 14, spacing: 1 },
                    { type: 10, content: `-# © BananaSkiee Duel Systems <t:${Math.floor(Date.now()/1000)}:R>` }
                ]
            }]
        };

        try {
            if (!game.message) game.message = await game.channel.send({ ...payload, flags: MessageFlags.IsComponentsV2 });
            else await game.message.edit({ ...payload, flags: MessageFlags.IsComponentsV2 });
        } catch (e) { console.log("Render Error:", e.message); }
    },

    async handleShotgunInteractions(interaction) {
        if (!interaction.isButton()) return;
        const [prefix, action, gameId, extra] = interaction.customId.split('_');
        if (prefix !== 'sg') return;

        const game = this.games.get(gameId);
        if (!game) return interaction.reply({ content: "Game tidak ditemukan!", flags: 64 });
        if (!game.players.some(p => p.id === interaction.user.id)) return interaction.reply({ content: "Lu bukan pemain!", flags: 64 });
        
        if (game.phase === 'BATTLE' && game.players[game.currentPlayer].id !== interaction.user.id && action !== 'surrender') {
            return interaction.reply({ content: "Sabar, nunggu giliran!", flags: 64 });
        }

        await interaction.deferUpdate();

        if (action === 'ready') {
            game.ready[interaction.user.id] = true;
            if (game.ready[game.players[0].id] && game.ready[game.players[1].id]) {
                await this.triggerReload(game);
            } else { await this.render(gameId); }
        }

        if (action === 'shoot') {
            const shooter = game.players[game.currentPlayer];
            const opponent = game.players[1 - game.currentPlayer];
            const isLive = game.chambers[game.currentIdx] === '💥';
            const dmg = game.effects[shooter.id].dbl ? 2 : 1;

            if (isLive) {
                const victimId = extra === 'opp' ? opponent.id : shooter.id;
                game.health[victimId] = Math.max(0, game.health[victimId] - dmg);
                this.addLog(game, `${shooter.username} menembak ${extra === 'opp' ? 'lawan' : 'diri'}... 💥 KENA!`);
            } else {
                this.addLog(game, `${shooter.username} menembak ${extra === 'opp' ? 'lawan' : 'diri'}... ⚪ MISS!`);
            }

            game.currentIdx++;
            game.effects[shooter.id].dbl = false;
            game.effects[shooter.id].usedLock = false;

            if (game.health[p1.id] <= 0 || game.health[p2.id] <= 0) {
                const winner = game.health[game.players[0].id] > 0 ? game.players[0] : game.players[1];
                this.addLog(game, `🏆 ${winner.username} MENANG!`);
                game.phase = 'OVER';
            } else if (!(extra === 'self' && !isLive)) {
                if (game.effects[opponent.id].skip) {
                    game.effects[opponent.id].skip = false;
                    this.addLog(game, `🔗 ${opponent.username} masih terborgol!`);
                } else { game.currentPlayer = 1 - game.currentPlayer; }
            }

            if (game.currentIdx >= game.chambers.length && game.phase !== 'OVER') await this.triggerReload(game);
            else await this.render(gameId);
        }
        
        if (action === 'surrender') {
            this.addLog(game, `${interaction.user.username} kabur dari duel.`);
            game.phase = 'OVER';
            await this.render(gameId);
            this.games.delete(gameId);
        }
    },

    async triggerReload(game) {
        game.phase = 'REVEAL';
        const load = Math.floor(Math.random() * 3) + 2;
        game.chambers = [...Array(load).fill('💥'), ...Array(6-load).fill('⚪')].sort(() => Math.random() - 0.5);
        game.currentIdx = 0;
        game.players.forEach(p => { 
            if (game.items[p.id].length < 4) game.items[p.id].push(['🚬','🍺','🔪','🔎','🔗'][Math.floor(Math.random()*5)]);
        });
        await this.render(game.id);
        setTimeout(async () => {
            if (this.games.has(game.id)) {
                game.phase = 'BATTLE';
                await this.render(game.id);
            }
        }, 5000);
    }
};
