const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    games: new Map(),

    getGame(id) { return this.games.get(id); },

    async acceptDuel(gameId, interaction, challengerId, opponentId) {
        if (interaction.user.id !== opponentId) return interaction.reply({ content: "Bukan lu yang ditantang!", ephemeral: true });

        const game = {
            id: gameId,
            players: [{ id: challengerId, username: interaction.client.users.cache.get(challengerId).username, ready: false }, 
                      { id: opponentId, username: interaction.user.username, ready: false }],
            health: { [challengerId]: 5, [opponentId]: 5 },
            items: { [challengerId]: [], [opponentId]: [] },
            effects: { [challengerId]: { knife: false, cuffed: false, usedCuff: false, usedKnife: false }, 
                       [opponentId]: { knife: false, cuffed: false, usedCuff: false, usedKnife: false } },
            chambers: [],
            currentIdx: 0,
            currentPlayer: Math.floor(Math.random() * 2),
            logs: ["│ INFO │ Game dimulai!"],
            reloadCount: 0,
            phase: 'LOBBY',
            lastActive: Date.now()
        };

        this.games.set(gameId, game);
        this.startAFKCheck(gameId);
        await this.render(gameId, interaction);
    },

    async rejectDuel(gameId, interaction) {
        const payload = {
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${interaction.user.username} Menolak Tantangan**\n\n>>> Note: Mental aman bos? jangan ciut gitu.` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        };
        await interaction.update(payload);
    },

    async render(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        game.lastActive = Date.now();

        const p1 = game.players[0];
        const p2 = game.players[1];
        let payload = { components: [] };

        if (game.phase === 'LOBBY') {
            payload.components.push({
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${p2.username} menerima tantangan\nKamu, ${p1.username}**\n## Informasi\n> AFK 5 menit = Kalah\n> Main dengan Cerdik\n## Jenis Item\n> - Minum ( 🍺 ) Buang peluru\n> - Pisau ( 🔪 ) Double Demage\n> - Borgol ( 🔗 ) Jalan 2x\n> - Lup ( 🔎 ) Lihat isi peluru\n> - Rokok ( 🚬 ) Heal 1 HP\n\n**${p1.username} ${p1.ready ? 'Ready' : 'Wait'} vs ${p2.username} ${p2.ready ? 'Ready' : 'Wait'}**` },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: p1.ready && p2.ready ? 3 : 4, type: 2, label: "Tunggu", custom_id: `sg_ready_${gameId}`, disabled: false },
                            { style: 2, type: 2, label: "◼️", custom_id: `sg_dec_2`, disabled: true },
                            { style: 3, type: 2, label: "Selesai", custom_id: `sg_done_${gameId}`, disabled: !p1.ready || !p2.ready }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            });
        } 
        else if (game.phase === 'GACHA') {
            const live = game.chambers.filter(c => c === '🔴').length;
            const blank = game.chambers.filter(c => c === '⚪').length;
            payload.components.push({
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels (POV pas selesai gacha)" },
                    { type: 14 },
                    { type: 10, content: `**Isi Chamber:**\n> **Kosong: ${blank} ⚪ **\n> **Peluru: ${live} 🔴**\n\n**Item ${p1.username}:**\n${this.formatItems(game.items[p1.id])}\n\n**Item ${p2.username}:**\n${this.formatItems(game.items[p2.id])}` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            });
        }
        else if (game.phase === 'BATTLE') {
            const turnP = game.players[game.currentPlayer];
            const oppP = game.players[1 - game.currentPlayer];
            const statusLine = [];
            if (game.effects[turnP.id].knife) statusLine.push("> **Next DMG: 2x**");
            if (game.effects[oppP.id].cuffed) statusLine.push(`> **${oppP.username} Terborgol**`);

            const itemButtons = game.items[turnP.id].map((it, i) => ({
                style: 2, type: 2, label: it.emoji, custom_id: `sg_item_${gameId}_${i}`
            }));

            payload.components.push({
                type: 17,
                components: [
                    { type: 12, items: [] },
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `### ${p1.username} vs ${p2.username}\n> **${p1.username}:** ${this.drawHP(game.health[p1.id])} **(${game.health[p1.id]})**\n> **${p2.username}:** ${this.drawHP(game.health[p2.id])} **(${game.health[p2.id]})**\n\n> **Giliran: ${turnP.username}**\n> **Sisa peluru: ${game.chambers.length - game.currentIdx}/${game.chambers.length}**\n> **Reload Chamber: ${game.reloadCount}x**\n${statusLine.length ? `### Status:\n${statusLine.join('\n')}` : ''}\n### Item ${turnP.username} :\n${game.items[turnP.id].map(it => `> - ${it.name} ( ${it.emoji} )`).join('\n')}` },
                    { type: 14 },
                    { type: 1, components: itemButtons.length ? itemButtons : [{ style: 2, type: 2, label: "No Items", custom_id: "none", disabled: true }] },
                    { type: 1, components: [
                        { style: 2, type: 2, label: "Shoot Yourself", custom_id: `sg_shoot_self_${gameId}` },
                        { style: 2, type: 2, label: "Shoot Enemy", custom_id: `sg_shoot_opp_${gameId}` },
                        { style: 2, type: 2, label: "🏳️", custom_id: `sg_surrender_${gameId}` }
                    ]},
                    { type: 14 }
                ]
            }, {
                type: 17,
                components: [
                    { type: 14 }, { type: 10, content: "## Log Shotgun Duels:" }, { type: 14 },
                    { type: 10, content: game.logs.join('\n') },
                    { type: 14 }, { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            });
        }

        await interaction.update(payload).catch(() => interaction.editReply(payload));
    },

    formatItems(items) {
        if (!items.length) return "> - (Tidak ada item)";
        return items.map(it => `> - **${it.name} ( ${it.emoji} )**`).join('\n');
    },

    drawHP(hp) { return "♥️".repeat(hp) + "🤍".repeat(5 - hp); },

    async handleAction(action, gameId, userId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        if (action === 'ready') {
            const p = game.players.find(pl => pl.id === userId);
            if (p) p.ready = true;
            await this.render(gameId, interaction);
            if (game.players.every(pl => pl.ready)) {
                // Semua ready, masuk gacha
                setTimeout(() => this.triggerReload(gameId, interaction), 1500);
            }
        }

        if (action === 'shoot_self' || action === 'shoot_opp') {
            const shooterId = userId;
            const target = action === 'shoot_self' ? 'self' : 'opp';
            const isLive = game.chambers[game.currentIdx] === '🔴';
            const dmg = game.effects[shooterId].knife ? 2 : 1;
            
            if (isLive) {
                const victimId = target === 'self' ? shooterId : game.players.find(p => p.id !== shooterId).id;
                game.health[victimId] = Math.max(0, game.health[victimId] - dmg);
                this.addLog(game, `💥 ${interaction.user.username} menembak ${target === 'self' ? 'diri sendiri' : 'lawan'}! KENA!`);
            } else {
                this.addLog(game, `⚪ ${interaction.user.username} menembak ${target === 'self' ? 'diri sendiri' : 'lawan'}! KOSONG!`);
            }

            game.currentIdx++;
            game.effects[shooterId].knife = false;
            game.effects[shooterId].usedKnife = false;
            game.effects[shooterId].usedCuff = false;

            // Logic turn
            if (game.health[game.players[0].id] <= 0 || game.health[game.players[1].id] <= 0) {
                game.phase = 'END';
                // Render menang nnti
            } else {
                // Jika nembak diri sendiri dan kosong, tetep giliran dia
                if (!(target === 'self' && !isLive)) {
                    const opponent = game.players.find(p => p.id !== shooterId);
                    if (game.effects[opponent.id].cuffed) {
                        game.effects[opponent.id].cuffed = false;
                        this.addLog(game, `🔗 ${opponent.username} terborgol, giliran dilewati!`);
                    } else {
                        game.currentPlayer = 1 - game.currentPlayer;
                    }
                }
            }

            if (game.currentIdx >= game.chambers.length) {
                await this.triggerReload(gameId, interaction);
            } else {
                await this.render(gameId, interaction);
            }
        }
    },

    async triggerReload(gameId, interaction) {
        const game = this.games.get(gameId);
        game.phase = 'GACHA';
        game.reloadCount++;
        
        // Rule: Isi semua peluru ada 8, min 2 kosong/isi
        const liveCount = Math.floor(Math.random() * 5) + 2; // Range 2 sampe 6
        const blankCount = 8 - liveCount;
        game.chambers = [...Array(liveCount).fill('🔴'), ...Array(blankCount).fill('⚪')].sort(() => Math.random() - 0.5);
        game.currentIdx = 0;

        // Bagi Item (Max 4)
        game.players.forEach(p => {
            const roll = Math.floor(Math.random() * 4) + 1; // Dapet 1-4 item
            for(let i=0; i<roll; i++) {
                if(game.items[p.id].length < 4) {
                    const pool = [
                        { name: 'Minum', emoji: '🍺' }, { name: 'Pisau', emoji: '🔪' },
                        { name: 'Borgol', emoji: '🔗' }, { name: 'Lup', emoji: '🔎' },
                        { name: 'Rokok', emoji: '🚬' }
                    ];
                    game.items[p.id].push(pool[Math.floor(Math.random()*pool.length)]);
                }
            }
        });

        await this.render(gameId, interaction);
        this.addLog(game, `🔄 Reloading Chamber...`);
        
        setTimeout(async () => {
            game.phase = 'BATTLE';
            await this.render(gameId, interaction);
        }, 5000);
    },

    addLog(game, text) {
        game.logs.unshift(`│ INFO │ ${text}`);
        if (game.logs.length > 5) game.logs.pop();
    },

    startAFKCheck(gameId) {
        const timer = setInterval(() => {
            const game = this.games.get(gameId);
            if (!game) return clearInterval(timer);
            if (Date.now() - game.lastActive > 300000) { // 5 Menit
                // Logic AFK Win
                this.games.delete(gameId);
                clearInterval(timer);
            }
        }, 60000);
    }
};
