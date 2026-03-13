const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShotgunLogic {
    constructor() {
        this.games = new Map();
    }

    getGame(id) { return this.games.get(id); }

    async acceptDuel(gameId, interaction, challengerId, opponentId) {
        if (interaction.user.id !== opponentId) return interaction.reply({ content: "❌ Bukan lu yang ditantang!", ephemeral: true });
        
        const game = {
            id: gameId,
            players: [
                { id: challengerId, username: (await interaction.client.users.fetch(challengerId)).username, hp: 5, items: [], ready: false },
                { id: opponentId, username: (await interaction.client.users.fetch(opponentId)).username, hp: 5, items: [], ready: false }
            ],
            chamber: [],
            currentPlayer: Math.floor(Math.random() * 2),
            logs: ["│ INFO │ Game dimulai!", "│ INFO │ Menunggu pemain ready...", "│ INFO │", "│ INFO │", "│ INFO │"],
            nextDmg: 1,
            handcuffed: false,
            usedItemThisTurn: { handcuff: false, knife: false },
            reloadCount: 0,
            afkTimer: null
        };

        this.games.set(gameId, game);
        this.resetAFK(gameId, interaction);

        await interaction.update({
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${game.players[1].username} menerima tantangan**\n## Informasi\n> AFK 5 menit = Kalah\n> Main dengan Cerdik\n## Jenis Item\n> - 🍺 Minum: Buang peluru\n> - 🔪 Pisau: Double Damage\n> - 🔗 Borgol: Jalan 2x\n> - 🔎 Lup: Lihat isi peluru\n> - 🚬 Rokok: Heal 1 HP\n\n**${game.players[0].username} Wait vs ${game.players[1].username} Wait**` },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: 4, type: 2, label: "Tunggu", custom_id: `sg_ready_${gameId}` },
                            { style: 2, type: 2, label: "◼️", custom_id: `sg_dec`, disabled: true },
                            { style: 3, type: 2, label: "Selesai", custom_id: `sg_done`, disabled: true }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });
    }

    async rejectDuel(gameId, interaction) {
        await interaction.update({
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${interaction.user.username} Menolak Tantangan**\n\n>>> Note: Lawan mentalnya ciut!` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });
    }

    async handleReady(gameId, interaction) {
        const game = this.games.get(gameId);
        const player = game.players.find(p => p.id === interaction.user.id);
        if (!player || player.ready) return;

        player.ready = true;
        const allReady = game.players.every(p => p.ready);

        if (allReady) {
            await this.startNewRound(gameId, interaction);
        } else {
            const statusStr = game.players.map(p => `${p.username} ${p.ready ? 'Ready' : 'Wait'}`).join(' vs ');
            await interaction.update({
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: "# Game Shotgun Duels" },
                        { type: 14 },
                        { type: 10, content: `## Persiapan\n${statusStr}` },
                        { type: 1, components: [{ style: 3, type: 2, label: "Selesai", custom_id: "sg_rd", disabled: true }] },
                        { type: 14 },
                        { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                    ]
                }]
            });
        }
    }

    async startNewRound(gameId, interaction) {
        const game = this.games.get(gameId);
        game.reloadCount++;
        
        // Aturan Peluru: Total 8, Min 2 Kosong & 2 Isi
        const total = 8;
        const realCount = Math.floor(Math.random() * 5) + 2; // 2 sampai 6 isi
        const emptyCount = total - realCount;
        
        game.chamber = Array(realCount).fill('🔴').concat(Array(emptyCount).fill('⚪'));
        this.shuffle(game.chamber);

        // Gacha Item (1-4 random)
        game.players.forEach(p => {
            const itemCount = Math.floor(Math.random() * 4) + 1;
            const pool = ['🍺', '🔪', '🔗', '🔎', '🚬'];
            for(let i=0; i<itemCount; i++) {
                if(p.items.length < 4) p.items.push(pool[Math.floor(Math.random() * pool.length)]);
            }
        });

        // Animasi Gacha (Font Only)
        const frames = ["G A C H A .", "G A C H A . .", "G A C H A . . .", "R E L O A D .", "R E L O A D . .", "R E L O A D . . ."];
        for (let f of frames) {
            await interaction.editReply({
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: `# ${f}` },
                        { type: 14 },
                        { type: 10, content: "-# Mempersiapkan peluru..." }
                    ]
                }]
            });
            await new Promise(r => setTimeout(r, 600));
        }

        // Tampilkan Chamber (5 detik)
        await interaction.editReply(this.renderChamberView(game));
        await new Promise(r => setTimeout(r, 5000));
        
        await this.renderMain(gameId, interaction);
    }

    renderChamberView(game) {
        const real = game.chamber.filter(c => c === '🔴').length;
        const empty = game.chamber.filter(c => c === '⚪').length;
        return {
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Reload Chamber" },
                    { type: 14 },
                    { type: 10, content: `**Isi Chamber:**\n> **Kosong: ${empty} ⚪**\n> **Peluru: ${real} 🔴**\n\n**Item ${game.players[0].username}:**\n${game.players[0].items.map(i => `> - ${i}`).join('\n')}\n\n**Item ${game.players[1].username}:**\n${game.players[1].items.map(i => `> - ${i}`).join('\n')}` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${game.id}` }
                ]
            }]
        };
    }

    async renderMain(gameId, interaction) {
        const game = this.games.get(gameId);
        const p1 = game.players[0];
        const p2 = game.players[1];
        const current = game.players[game.currentPlayer];

        const hpBar = (hp) => "♥️".repeat(hp) + "🤍".repeat(5-hp);

        const payload = {
            components: [
                {
                    type: 17,
                    components: [
                        { type: 12, items: [] },
                        { type: 10, content: `### ${p1.username} vs ${p2.username}\n> **${p1.username}:** ${hpBar(p1.hp)} (${p1.hp})\n> **${p2.username}:** ${hpBar(p2.hp)} (${p2.hp})\n\n> **Giliran: ${current.username}**\n> **Sisa peluru: ${game.chamber.length}/8**\n> **Reload Chamber: ${game.reloadCount}x**` },
                        { type: 14 },
                        ...(game.nextDmg > 1 || game.handcuffed ? [{ type: 10, content: `### Status:\n${game.nextDmg > 1 ? '> **Next DMG: 2x**\n' : ''}${game.handcuffed ? `> **${game.players[1-game.currentPlayer].username} Terborgol**` : ''}` }] : []),
                        {
                            type: 1,
                            components: current.items.map((item, idx) => ({
                                type: 2, style: 2, label: item, custom_id: `sg_item_${gameId}_${idx}`
                            }))
                        },
                        {
                            type: 1,
                            components: [
                                { type: 2, style: 2, label: "Shoot Yourself", custom_id: `sg_shoot_self_${gameId}` },
                                { type: 2, style: 2, label: "Shoot Enemy", custom_id: `sg_shoot_opp_${gameId}` },
                                { type: 2, style: 2, label: "🏳️", custom_id: `sg_surrender_${gameId}` }
                            ]
                        }
                    ]
                },
                {
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: "## Log Shotgun Duels:" },
                        { type: 14 },
                        { type: 10, content: game.logs.join('\n') },
                        { type: 14 },
                        { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                    ]
                }
            ]
        };

        if (interaction.replied || interaction.deferred) await interaction.editReply(payload);
        else await interaction.update(payload);
    }

    async handleShoot(gameId, target, interaction) {
        const game = this.games.get(gameId);
        const bullet = game.chamber.shift();
        const shooter = game.players[game.currentPlayer];
        const victim = target === 'self' ? shooter : game.players[1 - game.currentPlayer];

        let logMsg = "";
        if (bullet === '🔴') {
            victim.hp -= game.nextDmg;
            logMsg = `│ INFO │ 💥 DOR! ${victim.username} kena ${game.nextDmg} DMG!`;
            game.nextDmg = 1;
            game.usedItemThisTurn = { handcuff: false, knife: false };
            if (!game.handcuffed) game.currentPlayer = 1 - game.currentPlayer;
            else game.handcuffed = false;
        } else {
            logMsg = `│ INFO │ 💨 KLIK! Peluru kosong.`;
            game.nextDmg = 1;
            game.usedItemThisTurn = { handcuff: false, knife: false };
            if (target !== 'self') {
                if (!game.handcuffed) game.currentPlayer = 1 - game.currentPlayer;
                else game.handcuffed = false;
            }
        }

        this.addLog(game, logMsg);
        this.resetAFK(gameId, interaction);

        if (p1.hp <= 0 || p2.hp <= 0) return this.endGame(gameId, interaction);
        if (game.chamber.length === 0) return this.startNewRound(gameId, interaction);
        
        await this.renderMain(gameId, interaction);
    }

    async handleItem(gameId, idx, interaction) {
        const game = this.games.get(gameId);
        const player = game.players[game.currentPlayer];
        const item = player.items[idx];

        if (item === '🔗') {
            if (game.usedItemThisTurn.handcuff) return interaction.reply({ content: "❌ Borgol cuma bisa 1x per turn!", ephemeral: true });
            game.handcuffed = true;
            game.usedItemThisTurn.handcuff = true;
        } else if (item === '🔪') {
            if (game.usedItemThisTurn.knife) return interaction.reply({ content: "❌ Pisau cuma bisa 1x per turn!", ephemeral: true });
            game.nextDmg = 2;
            game.usedItemThisTurn.knife = true;
        } else if (item === '🚬') {
            if (player.hp < 5) player.hp++;
        } else if (item === '🍺') {
            game.chamber.shift();
        } else if (item === '🔎') {
            return interaction.reply({ content: `🔍 Peluru selanjutnya adalah: ${game.chamber[0]}`, ephemeral: true });
        }

        player.items.splice(idx, 1);
        this.addLog(game, `│ INFO │ ${player.username} menggunakan ${item}`);
        await this.renderMain(gameId, interaction);
    }

    addLog(game, msg) {
        game.logs.unshift(msg);
        if (game.logs.length > 5) game.logs.pop();
    }

    resetAFK(gameId, interaction) {
        const game = this.games.get(gameId);
        if (game.afkTimer) clearTimeout(game.afkTimer);
        game.afkTimer = setTimeout(() => this.afkWin(gameId, interaction), 300000);
    }

    async afkWin(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        const winner = game.players[1 - game.currentPlayer];
        await interaction.editReply({
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${game.players[game.currentPlayer].username} AFK, Selamat kamu menang ${winner.username}!**\n\n> Note: Jangan kelamaan mikir, mentalnya kabur ya?` },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });
        this.games.delete(gameId);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

module.exports = ShotgunLogic;
