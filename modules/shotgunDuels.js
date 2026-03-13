const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    games: new Map(),

    // --- Helper Animasi Font ---
    fonts: {
        loading: ["『 ▒▒▒▒▒▒▒▒▒▒ 』", "『 ██▒▒▒▒▒▒▒▒ 』", "『 ████▒▒▒▒▒▒ 』", "『 ██████▒▒▒▒ 』", "『 ████████▒▒ 』", "『 ██████████ 』"],
        reload: "ＲＥＬＯＡＤＩＮＧ  ＣＨＡＭＢＥＲ",
        gacha: "ＧＡＣＨＡＩＮＧ  ＩＴＥＭＳ"
    },

    async startGame(p1, p2, channel) {
        const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const game = {
            id: gameId,
            players: [p1, p2],
            health: { [p1.id]: 5, [p2.id]: 5 },
            items: { [p1.id]: [], [p2.id]: [] },
            usedItemThisTurn: { [p1.id]: { knife: false, handcuff: false }, [p2.id]: { knife: false, handcuff: false } },
            effects: { [p1.id]: { double: false, cuffed: false }, [p2.id]: { double: false, cuffed: false } },
            chambers: [],
            totalChamber: 0,
            currentIdx: 0,
            currentPlayer: 0,
            logs: ["│ INFO │ Game dimulai!", "│ INFO │ Menunggu tantangan diterima...", "│ INFO │", "│ INFO │", "│ INFO │"],
            phase: 'CHALLENGE',
            message: null,
            channel: channel
        };
        this.games.set(gameId, game);
        await this.render(gameId);
    },

    addLog(game, text) {
        game.logs.unshift(`│ INFO │ ${text}`);
        if (game.logs.length > 5) game.logs.pop();
    },

    // --- Logic Reload & Item ---
    async reloadLogic(game) {
        game.phase = 'RELOAD_ANIM';
        let live = Math.floor(Math.random() * 3) + 2; // Min 2 max 4
        let empty = Math.floor(Math.random() * 3) + 2; // Min 2 max 4
        game.chambers = [...Array(live).fill('🔴'), ...Array(empty).fill('⚪')].sort(() => Math.random() - 0.5);
        game.totalChamber = game.chambers.length;
        game.currentIdx = 0;

        // Gacha Item (1-4 item)
        game.players.forEach(p => {
            const currentCount = game.items[p.id].length;
            const canReceive = 4 - currentCount;
            if (canReceive > 0) {
                const get = Math.floor(Math.random() * canReceive) + 1;
                for (let i = 0; i < get; i++) {
                    game.items[p.id].push(['🔪', '🔗', '🚬', '🔎'][Math.floor(Math.random() * 4)]);
                }
            }
        });

        // Animasi Teks
        for (const frame of this.fonts.loading) {
            game.animFrame = frame;
            await this.render(game.id);
            await new Promise(r => setTimeout(r, 600));
        }

        game.phase = 'SHOW_CHAMBER';
        await this.render(game.id);
        
        setTimeout(async () => {
            if (this.games.has(game.id)) {
                game.phase = 'BATTLE';
                game.usedItemThisTurn[game.players[0].id] = { knife: false, handcuff: false };
                game.usedItemThisTurn[game.players[1].id] = { knife: false, handcuff: false };
                await this.render(game.id);
            }
        }, 5000);
    },

    async render(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;
        const p1 = game.players[0];
        const p2 = game.players[1];
        const turn = game.players[game.currentPlayer];
        const enemy = game.players[1 - game.currentPlayer];

        let components = [];

        if (game.phase === 'CHALLENGE') {
            components = [{
                type: 17, components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: `\n**Hey ${p2}, ${p1.username} menantang\nKamu bermain game Shotgun Duels**\n\n>>> **Accept**, *untuk menerimanya*\n**Reject**, *untuk menolaknya*` },
                    { type: 14 },
                    { type: 1, components: [
                        { style: 3, type: 2, label: "Accept", custom_id: `sg_accept_${gameId}` },
                        { style: 2, type: 2, label: "◼️", custom_id: "none", disabled: true },
                        { style: 4, type: 2, label: "Reject", custom_id: `sg_reject_${gameId}` }
                    ]},
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }];
        } 
        else if (game.phase === 'REJECTED') {
            components = [{
                type: 17, components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${p2.username} Menolak Tantangan\nkamu ${p1.username}**\n\n>>> Note: Lawan sedang ciut nyalinya.` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }];
        }
        else if (game.phase === 'ACCEPTED') {
            components = [{
                type: 17, components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${p2.username} menerima tantangan\nKamu, ${p1.username}**\n## Informasi\n> Gunakan item strategis untuk menang.\n> Darah maksimal 5. Tembak diri sendiri jika peluru kosong untuk lanjut giliran.\n## Jenis Item\n> 🔪 Pisau: DMG 2x | 🔗 Borgol: Skip giliran lawan | 🚬 Rokok: Heal 1 HP | 🔎 Lup: Cek peluru\n\n**${p1.username} Ready vs ${p2.username} Ready**` },
                    { type: 14 },
                    { type: 1, components: [
                        { style: 3, type: 2, label: "Mulai Duel", custom_id: `sg_start_${gameId}` }
                    ]},
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }];
        }
        else if (game.phase === 'RELOAD_ANIM') {
            components = [{
                type: 17, components: [
                    { type: 10, content: `# ${this.fonts.reload}` },
                    { type: 14 },
                    { type: 10, content: `### ${game.animFrame}\n> Sedang menyusun peluru maut...` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }];
        }
        else if (game.phase === 'SHOW_CHAMBER') {
            const liveC = game.chambers.filter(c => c === '🔴').length;
            const emptyC = game.chambers.filter(c => c === '⚪').length;
            components = [{
                type: 17, components: [
                    { type: 10, content: "# Game Shotgun Duels (RELOAD)" },
                    { type: 14 },
                    { type: 10, content: `**Isi Chamber:**\n> **Kosong: ${emptyC} ⚪**\n> **Peluru: ${liveC} 🔴**\n\n**Item ${p1.username}:**\n${game.items[p1.id].map(i => `> - ${i}`).join('\n') || '> Kosong'}\n\n**Item ${p2.username}:**\n${game.items[p2.id].map(i => `> - ${i}`).join('\n') || '> Kosong'}` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }];
        }
        else if (game.phase === 'BATTLE') {
            const itemButtons = game.items[turn.id].map((emoji, idx) => ({
                style: 2, type: 2, label: emoji, custom_id: `sg_item_${gameId}_${idx}`
            }));

            components = [
                {
                    type: 17, components: [
                        { type: 10, content: "# Game Shotgun Duels" },
                        { type: 14 },
                        { type: 10, content: `### ${p1.username} vs ${p2.username}\n> **${p1.username}:** ${'♥️'.repeat(game.health[p1.id])}${'🤍'.repeat(5-game.health[p1.id])} (${game.health[p1.id]})\n> **${p2.username}:** ${'♥️'.repeat(game.health[p2.id])}${'🤍'.repeat(5-game.health[p2.id])} (${game.health[p2.id]})\n\n> **Giliran: ${turn.username}**\n> **Sisa peluru: ${game.chambers.length - game.currentIdx}/${game.totalChamber}**\n### Status:\n> **Next DMG: ${game.effects[turn.id].double ? '2x' : '1x'}**\n> **Status Lawan: ${game.effects[enemy.id].cuffed ? 'Terborgol 🔗' : 'Normal'}**\n### Item ${turn.username} :\n${game.items[turn.id].map(i => `> - ${i}`).join('\n') || '> Gak punya item'}` },
                        { type: 14 },
                        { type: 1, components: itemButtons.slice(0, 4) }, // Max 4 item
                        { type: 1, components: [
                            { style: 2, type: 2, label: "Shoot Yourself", custom_id: `sg_shoot_self_${gameId}` },
                            { style: 2, type: 2, label: "Shoot Enemy", custom_id: `sg_shoot_enemy_${gameId}` },
                            { style: 4, type: 2, label: "🏳️", custom_id: `sg_suren_${gameId}` }
                        ]},
                        { type: 14 }
                    ]
                },
                {
                    type: 17, components: [
                        { type: 14 }, { type: 10, content: "## Log Shotgun Duels:" }, { type: 14 },
                        { type: 10, content: `\`\`\`ansi\n${game.logs.join('\n')}\n\`\`\`` },
                        { type: 14 }, { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                    ]
                }
            ];
        }
        else if (game.phase === 'WIN') {
            components = [{
                type: 17, components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**Selamat kamu menang ${game.winner}**\n\n> ${game.winReason}` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }];
        }

        const payload = { components, flags: MessageFlags.IsComponentsV2 };
        try {
            if (!game.message) game.message = await game.channel.send(payload);
            else await game.message.edit(payload);
        } catch (e) { console.error(e); }
    },

    async handleShotgunInteractions(interaction) {
        const [pfx, action, gameId, extra] = interaction.customId.split('_');
        if (pfx !== 'sg') return;
        
        const game = this.games.get(gameId);
        if (!game) return;

        // --- Handle Accept/Reject ---
        if (action === 'accept' && interaction.user.id === game.players[1].id) {
            game.phase = 'ACCEPTED';
            return await this.render(gameId);
        }
        if (action === 'reject' && interaction.user.id === game.players[1].id) {
            game.phase = 'REJECTED';
            await this.render(gameId);
            return this.games.delete(gameId);
        }
        if (action === 'start' && (interaction.user.id === game.players[0].id || interaction.user.id === game.players[1].id)) {
            return await this.reloadLogic(game);
        }

        // --- Handle Battle ---
        if (game.phase !== 'BATTLE') return;
        const turnPlayer = game.players[game.currentPlayer];
        if (interaction.user.id !== turnPlayer.id && action !== 'suren') return;

        if (action === 'suren') {
            game.phase = 'WIN';
            game.winner = game.players.find(p => p.id !== interaction.user.id).username;
            game.winReason = `Lawan (${interaction.user.username}) mentalnya ciut dan memilih menyerah.`;
            await this.render(gameId);
            return this.games.delete(gameId);
        }

        if (action === 'item') {
            const itemIdx = parseInt(extra);
            const item = game.items[turnPlayer.id][itemIdx];
            
            if (item === '🔪') {
                if (game.usedItemThisTurn[turnPlayer.id].knife) return;
                game.effects[turnPlayer.id].double = true;
                game.usedItemThisTurn[turnPlayer.id].knife = true;
                this.addLog(game, `${turnPlayer.username} mengasah shotgun (DMG x2)`);
            } else if (item === '🔗') {
                if (game.usedItemThisTurn[turnPlayer.id].handcuff) return;
                game.effects[game.players[1-game.currentPlayer].id].cuffed = true;
                game.usedItemThisTurn[turnPlayer.id].handcuff = true;
                this.addLog(game, `${turnPlayer.username} memborgol lawan`);
            } else if (item === '🚬') {
                game.health[turnPlayer.id] = Math.min(5, game.health[turnPlayer.id] + 1);
                this.addLog(game, `${turnPlayer.username} merokok (Heal +1)`);
            } else if (item === '🔎') {
                const next = game.chambers[game.currentIdx];
                this.addLog(game, `${turnPlayer.username} melihat peluru selanjutnya adalah ${next}`);
            }

            game.items[turnPlayer.id].splice(itemIdx, 1);
            return await this.render(gameId);
        }

        if (action === 'shoot') {
            const isLive = game.chambers[game.currentIdx] === '🔴';
            const dmg = game.effects[turnPlayer.id].double ? 2 : 1;
            const targetId = extra === 'enemy' ? game.players[1-game.currentPlayer].id : turnPlayer.id;

            if (isLive) {
                game.health[targetId] = Math.max(0, game.health[targetId] - dmg);
                this.addLog(game, `DUARR! ${extra === 'enemy' ? 'Lawan' : 'Diri sendiri'} terkena peluru! (-${dmg} HP)`);
            } else {
                this.addLog(game, `KLIK! Peluru kosong.`);
            }

            game.currentIdx++;
            game.effects[turnPlayer.id].double = false;

            // Cek Menang
            if (game.health[p1.id] <= 0 || game.health[p2.id] <= 0) {
                game.phase = 'WIN';
                game.winner = game.health[p1.id] > 0 ? p1.username : p2.username;
                game.winReason = `Menghancurkan lawan sampai tak tersisa darahnya.`;
            } else {
                // Logic Ganti Giliran
                let skipNext = false;
                if (extra === 'self' && !isLive) skipNext = false; // Tembak diri kosong = main lagi
                else {
                    if (game.effects[game.players[1-game.currentPlayer].id].cuffed) {
                        game.effects[game.players[1-game.currentPlayer].id].cuffed = false;
                        this.addLog(game, `Lawan terborgol, ${turnPlayer.username} main lagi!`);
                    } else {
                        game.currentPlayer = 1 - game.currentPlayer;
                    }
                }
            }

            if (game.phase !== 'WIN' && game.currentIdx >= game.chambers.length) {
                await this.render(gameId);
                setTimeout(() => this.reloadLogic(game), 2000);
            } else {
                await this.render(gameId);
            }
        }
    }
};
