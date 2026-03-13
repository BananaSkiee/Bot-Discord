// modules/shotgunDuels.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShotgunLogic {
    constructor() {
        this.games = new Map();
        // Helper Animasi Font
        this.fonts = {
            loading: ["『 ▒▒▒▒▒▒▒▒▒▒ 』", "『 ██▒▒▒▒▒▒▒▒ 』", "『 ████▒▒▒▒▒▒ 』", "『 ██████▒▒▒▒ 』", "『 ████████▒▒ 』", "『 ██████████ 』"],
            reload: "ＲＥＬＯＡＤＩＮＧ  ＣＨＡＭＢＥＲ",
            gacha: "ＧＡＣＨＡＩＮＧ  ＩＴＥＭＳ"
        };
    }

    getGame(id) { return this.games.get(id); }

    async acceptDuel(gameId, interaction, challengerId, opponentId) {
        if (interaction.user.id !== opponentId) {
            return interaction.reply({ content: "❌ Bukan lu yang ditantang!", ephemeral: true });
        }
        
        const challengerUser = await interaction.client.users.fetch(challengerId);
        const opponentUser = await interaction.client.users.fetch(opponentId);
        
        const game = {
            id: gameId,
            players: [
                { 
                    id: challengerId, 
                    username: challengerUser.username,
                    tag: `<@${challengerId}>`,
                    hp: 5, 
                    items: [], 
                    ready: false 
                },
                { 
                    id: opponentId, 
                    username: opponentUser.username,
                    tag: `<@${opponentId}>`,
                    hp: 5, 
                    items: [], 
                    ready: false 
                }
            ],
            chamber: [],
            currentPlayer: Math.floor(Math.random() * 2),
            logs: ["│ INFO │ Game dimulai!", "│ INFO │ Menunggu pemain ready...", "│ INFO │", "│ INFO │", "│ INFO │"],
            nextDmg: 1,
            handcuffed: false,
            handcuffedPlayer: null,
            usedItemThisTurn: { handcuff: false, knife: false },
            reloadCount: 0,
            afkTimer: null,
            message: null
        };

        this.games.set(gameId, game);
        this.resetAFK(gameId, interaction);

        const statusStr = `${game.players[0].tag} Wait vs ${game.players[1].tag} Wait`;

        const payload = {
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${opponentUser.username} menerima tantangan**\n## Informasi\n> AFK 5 menit = Kalah\n> Main dengan Cerdik\n## Jenis Item\n> - 🍺 Minum: Buang peluru\n> - 🔪 Pisau: Double Damage\n> - 🔗 Borgol: Jalan 2x\n> - 🔎 Lup: Lihat isi peluru\n> - 🚬 Rokok: Heal 1 HP\n\n${statusStr}` },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: 4, type: 2, label: "Tunggu", custom_id: `sg_ready_${gameId}` },
                            { style: 2, type: 2, label: "◼️", custom_id: `sg_dec_${gameId}`, disabled: true },
                            { style: 3, type: 2, label: "Selesai", custom_id: `sg_done_${gameId}`, disabled: true }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        };

        await interaction.update(payload);
    }

    async rejectDuel(gameId, interaction) {
        const rejectNotes = [
            "Mentalnya ciut!",
            "Kabur sebelum perang!",
            "Takut mati rupanya!",
            "Mending main yang lain aja!",
            "Keberaniannya hilang!"
        ];
        const randomNote = rejectNotes[Math.floor(Math.random() * rejectNotes.length)];

        await interaction.update({
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${interaction.user.username} Menolak Tantangan**\n\n>>> Note: ${randomNote}` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });
        
        // Hapus game dari memory
        setTimeout(() => this.games.delete(gameId), 5000);
    }

    async handleReady(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const player = game.players.find(p => p.id === interaction.user.id);
        if (!player || player.ready) return;

        player.ready = true;
        this.resetAFK(gameId, interaction);

        const allReady = game.players.every(p => p.ready);

        if (allReady) {
            await this.startNewRound(gameId, interaction, true);
        } else {
            const statusStr = game.players.map(p => `${p.tag} ${p.ready ? 'Ready' : 'Wait'}`).join(' vs ');
            
            await interaction.update({
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: "# Game Shotgun Duels" },
                        { type: 14 },
                        { type: 10, content: `## Persiapan\n${statusStr}` },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                { style: 4, type: 2, label: "Tunggu", custom_id: `sg_ready_${gameId}`, disabled: true },
                                { style: 2, type: 2, label: "◼️", custom_id: `sg_dec_${gameId}`, disabled: true },
                                { style: 3, type: 2, label: "Selesai", custom_id: `sg_done_${gameId}`, disabled: true }
                            ]
                        },
                        { type: 14 },
                        { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                    ]
                }]
            });
        }
    }

    async startNewRound(gameId, interaction, isFirstRound = false) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        game.reloadCount++;
        
        // Animasi Loading
        for (let i = 0; i < this.fonts.loading.length; i++) {
            const frame = this.fonts.loading[i];
            const animText = i < 3 ? this.fonts.gacha : this.fonts.reload;
            
            await interaction.editReply({
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: `# ${animText}` },
                        { type: 14 },
                        { type: 10, content: `\`\`\`${frame}\`\`\`\n-# Mempersiapkan chamber...` }
                    ]
                }]
            });
            await new Promise(r => setTimeout(r, 600));
        }

        // Aturan Peluru: Total 8, Min 2 Kosong & 2 Isi
        const total = 8;
        const realCount = Math.floor(Math.random() * 5) + 2; // 2 sampai 6 isi
        const emptyCount = total - realCount;
        
        game.chamber = Array(realCount).fill('🔴').concat(Array(emptyCount).fill('⚪'));
        this.shuffle(game.chamber);

        // Gacha Item (1-4 random, minimal 1)
        game.players.forEach(p => {
            p.items = []; // Reset items
            const itemCount = Math.floor(Math.random() * 4) + 1; // 1-4 item
            const pool = ['🍺', '🔪', '🔗', '🔎', '🚬'];
            for(let i = 0; i < itemCount; i++) {
                p.items.push(pool[Math.floor(Math.random() * pool.length)]);
            }
        });

        // Tampilkan Chamber & Items (5 detik)
        await interaction.editReply(this.renderChamberView(game));
        await new Promise(r => setTimeout(r, 5000));
        
        // Reset status untuk round baru
        game.nextDmg = 1;
        game.handcuffed = false;
        game.handcuffedPlayer = null;
        game.usedItemThisTurn = { handcuff: false, knife: false };
        game.logs = ["│ INFO │ Round baru dimulai!", "│ INFO │ Chamber telah diisi ulang", "│ INFO │", "│ INFO │", "│ INFO │"];
        
        await this.renderMain(gameId, interaction);
    }

    renderChamberView(game) {
        const real = game.chamber.filter(c => c === '🔴').length;
        const empty = game.chamber.filter(c => c === '⚪').length;
        
        const p1Items = game.players[0].items.map(i => `> - **${this.getItemName(i)}** (${i})`).join('\n') || '> - Tidak ada item';
        const p2Items = game.players[1].items.map(i => `> - **${this.getItemName(i)}** (${i})`).join('\n') || '> - Tidak ada item';
        
        return {
            components: [
                {
                    type: 17,
                    components: [
                        { type: 10, content: "# 🔄 RELOAD CHAMBER" },
                        { type: 14 },
                        { type: 10, content: `**Isi Chamber:**\n> **Kosong: ${empty} ⚪**\n> **Peluru: ${real} 🔴**\n\n**Item ${game.players[0].tag}:**\n${p1Items}\n\n**Item ${game.players[1].tag}:**\n${p2Items}` },
                        { type: 14 },
                        { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${game.id}` }
                    ]
                }
            ]
        };
    }

    getItemName(emoji) {
        const names = {
            '🍺': 'Minum',
            '🔪': 'Pisau',
            '🔗': 'Borgol',
            '🔎': 'Lup',
            '🚬': 'Rokok'
        };
        return names[emoji] || 'Item';
    }

    async renderMain(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const p1 = game.players[0];
        const p2 = game.players[1];
        const current = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];

        const hpBar = (hp) => "♥️".repeat(hp) + "🤍".repeat(5-hp);

        // Status section
        let statusText = "";
        if (game.nextDmg > 1 || game.handcuffed) {
            statusText = "\n### Status:\n";
            if (game.nextDmg > 1) statusText += `> **Next DMG: 2x**\n`;
            if (game.handcuffed && game.handcuffedPlayer) {
                statusText += `> **${game.handcuffedPlayer.tag} Terborgol**\n`;
            }
        }

        // Items section
        const currentItems = current.items.map(item => `${this.getItemName(item)} (${item})`).join('\n> - ') || 'Tidak ada item';
        
        const mainContent = `### ${p1.tag} vs ${p2.tag}
> **${p1.tag}:** ${hpBar(p1.hp)} (${p1.hp})
> **${p2.tag}:** ${hpBar(p2.hp)} (${p2.hp})

> **Giliran: ${current.tag}**
> **Sisa peluru: ${game.chamber.length}/8**
> **Reload Chamber: ${game.reloadCount}x**${statusText}

### Item ${current.username} :
> - ${currentItems}`;

        // Item buttons
        const itemButtons = [];
        if (current.items.length > 0) {
            const row = { type: 1, components: [] };
            current.items.forEach((item, idx) => {
                if (idx < 5) { // Max 5 buttons per row
                    row.components.push({
                        type: 2,
                        style: 2,
                        label: item,
                        custom_id: `sg_item_${gameId}_${idx}`
                    });
                }
            });
            itemButtons.push(row);
        }

        // Action buttons row
        const actionRow = {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Shoot Yourself", custom_id: `sg_shoot_self_${gameId}` },
                { type: 2, style: 2, label: "Shoot Enemy", custom_id: `sg_shoot_opp_${gameId}` },
                { type: 2, style: 2, label: "🏳️", custom_id: `sg_surrender_${gameId}` }
            ]
        };

        // Logs
        const logText = game.logs.join('\n');

        const payload = {
            components: [
                {
                    type: 17,
                    components: [
                        { type: 12, items: [] },
                        { type: 10, content: mainContent },
                        { type: 14 },
                        ...itemButtons,
                        actionRow,
                        { type: 14 }
                    ]
                },
                {
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: "## Log Shotgun Duels:" },
                        { type: 14 },
                        { type: 10, content: logText },
                        { type: 14 },
                        { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                    ]
                }
            ]
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload);
        } else {
            await interaction.update(payload);
        }
    }

    async handleShoot(gameId, target, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const bullet = game.chamber.shift();
        const shooter = game.players[game.currentPlayer];
        const victim = target === 'self' ? shooter : game.players[1 - game.currentPlayer];

        let logMsg = "";
        let damage = game.nextDmg;
        
        if (bullet === '🔴') {
            victim.hp -= damage;
            
            if (target === 'self') {
                logMsg = `│ INFO │ 💥 ${shooter.username} menembak diri sendiri! -${damage} HP`;
            } else {
                logMsg = `│ INFO │ 💥 ${shooter.username} menembak ${victim.username}! -${damage} HP`;
            }
            
            // Reset status setelah tembakan
            game.nextDmg = 1;
            game.usedItemThisTurn = { handcuff: false, knife: false };
            
            // Cek handcuff
            if (game.handcuffed && game.handcuffedPlayer && game.handcuffedPlayer.id === victim.id) {
                game.handcuffed = false;
                game.handcuffedPlayer = null;
                // Korban tetap tidak bisa jalan di turn ini
            } else if (!game.handcuffed) {
                game.currentPlayer = 1 - game.currentPlayer;
            } else {
                game.handcuffed = false;
                game.handcuffedPlayer = null;
            }
        } else {
            logMsg = `│ INFO │ 💨 ${shooter.username} menembak tapi kosong!`;
            
            if (target !== 'self') {
                if (!game.handcuffed) {
                    game.currentPlayer = 1 - game.currentPlayer;
                } else {
                    game.handcuffed = false;
                    game.handcuffedPlayer = null;
                }
            }
            
            game.nextDmg = 1;
            game.usedItemThisTurn = { handcuff: false, knife: false };
        }

        this.addLog(game, logMsg);
        this.resetAFK(gameId, interaction);

        // Cek game over
        const p1 = game.players[0];
        const p2 = game.players[1];
        
        if (p1.hp <= 0 || p2.hp <= 0) {
            return this.endGame(gameId, interaction, p1.hp <= 0 ? p2 : p1);
        }
        
        if (game.chamber.length === 0) {
            return this.startNewRound(gameId, interaction);
        }
        
        await this.renderMain(gameId, interaction);
    }

    async handleItem(gameId, idx, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const player = game.players[game.currentPlayer];
        const opponent = game.players[1 - game.currentPlayer];
        const item = player.items[idx];

        if (!item) return;

        let logMsg = `│ INFO │ ${player.username} menggunakan ${this.getItemName(item)} ${item}`;
        let needRender = true;

        // Handle item effects
        if (item === '🔗') { // Borgol
            if (game.usedItemThisTurn.handcuff) {
                return interaction.reply({ content: "❌ Borgol cuma bisa 1x per turn!", ephemeral: true });
            }
            game.handcuffed = true;
            game.handcuffedPlayer = opponent;
            game.usedItemThisTurn.handcuff = true;
            
        } else if (item === '🔪') { // Pisau
            if (game.usedItemThisTurn.knife) {
                return interaction.reply({ content: "❌ Pisau cuma bisa 1x per turn!", ephemeral: true });
            }
            game.nextDmg = 2;
            game.usedItemThisTurn.knife = true;
            
        } else if (item === '🚬') { // Rokok
            if (player.hp < 5) {
                player.hp++;
                logMsg = `│ INFO │ ${player.username} merokok, HP +1!`;
            } else {
                return interaction.reply({ content: "❌ HP sudah penuh!", ephemeral: true });
            }
            
        } else if (item === '🍺') { // Minum
            if (game.chamber.length > 0) {
                const removed = game.chamber.shift();
                logMsg = `│ INFO │ ${player.username} minum, membuang 1 peluru (${removed})!`;
            } else {
                return interaction.reply({ content: "❌ Tidak ada peluru untuk dibuang!", ephemeral: true });
            }
            
        } else if (item === '🔎') { // Lup
            needRender = false;
            const nextBullet = game.chamber[0] || 'Kosong';
            const bulletText = nextBullet === '🔴' ? '🔴 Berisi' : '⚪ Kosong';
            await interaction.reply({ 
                content: `🔍 **${player.username}** melihat peluru selanjutnya: **${bulletText}**`,
                ephemeral: true 
            });
        }

        // Hapus item yang digunakan
        player.items.splice(idx, 1);
        
        if (needRender) {
            this.addLog(game, logMsg);
            this.resetAFK(gameId, interaction);
            
            // Cek jika chamber habis setelah minum
            if (item === '🍺' && game.chamber.length === 0) {
                return this.startNewRound(gameId, interaction);
            }
            
            await this.renderMain(gameId, interaction);
        }
    }

    async handleSurrender(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const surrenderer = game.players.find(p => p.id === interaction.user.id);
        const winner = game.players.find(p => p.id !== interaction.user.id);
        
        if (!surrenderer || !winner) return;
        
        const surrenderNotes = [
            "Menyerah sebelum bertarung!",
            "Keberaniannya luntur!",
            "Kabur dari kenyataan!",
            "Mentalnya lemah!",
            "Tidak siap bertarung!"
        ];
        const randomNote = surrenderNotes[Math.floor(Math.random() * surrenderNotes.length)];

        await interaction.update({
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**Selamat ${winner.tag} menang!**\n**${surrenderer.username} Menyerah**\n\n>>> Note: ${randomNote}` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });
        
        // Hapus game
        if (game.afkTimer) clearTimeout(game.afkTimer);
        this.games.delete(gameId);
    }

    async endGame(gameId, interaction, winner) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const loser = game.players.find(p => p.id !== winner.id);
        
        const winNotes = [
            "Kemenangan yang gemilang!",
            "Pantang menyerah sampai akhir!",
            "Strategi yang brilian!",
            "Luar biasa pertarungannya!",
            "Berhasil mengalahkan lawan!"
        ];
        const randomNote = winNotes[Math.floor(Math.random() * winNotes.length)];

        await interaction.editReply({
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**Selamat ${winner.tag} menang!**\n**${loser.username} Kalah**\n\n>>> Note: ${randomNote}` },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });
        
        // Hapus game
        if (game.afkTimer) clearTimeout(game.afkTimer);
        this.games.delete(gameId);
    }

    addLog(game, msg) {
        game.logs.unshift(msg);
        if (game.logs.length > 5) game.logs.pop();
    }

    resetAFK(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        if (game.afkTimer) clearTimeout(game.afkTimer);
        
        game.afkTimer = setTimeout(async () => {
            await this.afkWin(gameId, interaction);
        }, 300000); // 5 menit
    }

    async afkWin(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const afkPlayer = game.players[game.currentPlayer];
        const winner = game.players[1 - game.currentPlayer];
        
        const afkNotes = [
            "Terlalu lama mikir, mentalnya kabur!",
            "AFK terlalu lama, konsentrasi hilang!",
            "Mungkin lagi sibuk, lain kali main lagi!",
            "Jangan kelamaan mikir, nanti kena AFK!",
            "Kehabisan waktu, lain kali lebih cepat!"
        ];
        const randomNote = afkNotes[Math.floor(Math.random() * afkNotes.length)];

        await interaction.editReply({
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: `**${afkPlayer.username} AFK Selama 5 menit!**\n**Selamat ${winner.tag} menang!**\n\n>>> Note: ${randomNote}` },
                    { type: 14 },
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
