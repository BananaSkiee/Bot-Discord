// modules/shotgunDuels.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShotgunLogic {
    constructor() {
        this.games = new Map();
    }

    getGame(id) { 
        return this.games.get(id); 
    }

    // --- Helper Animasi Font ---
    get fonts() {
        return {
            loading: ["『 ▒▒▒▒▒▒▒▒▒▒ 』", "『 ██▒▒▒▒▒▒▒▒ 』", "『 ████▒▒▒▒▒▒ 』", "『 ██████▒▒▒▒ 』", "『 ████████▒▒ 』", "『 ██████████ 』"],
            reload: "ＲＥＬＯＡＤＩＮＧ  ＣＨＡＭＢＥＲ",
            gacha: "ＧＡＣＨＡＩＮＧ  ＩＴＥＭＳ"
        };
    }

    async acceptDuel(gameId, interaction, challengerId, opponentId) {
        if (interaction.user.id !== opponentId) {
            return interaction.reply({ 
                content: "❌ Bukan lu yang ditantang!", 
                ephemeral: true 
            });
        }
        
        const challengerUser = await interaction.client.users.fetch(challengerId);
        const opponentUser = await interaction.client.users.fetch(opponentId);

        const game = {
            id: gameId,
            players: [
                { 
                    id: challengerId, 
                    username: challengerUser.username, 
                    hp: 5, 
                    items: [], 
                    ready: false 
                },
                { 
                    id: opponentId, 
                    username: opponentUser.username, 
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
            usedItemThisTurn: { handcuff: false, knife: false },
            reloadCount: 0,
            afkTimer: null
        };

        this.games.set(gameId, game);
        this.resetAFK(gameId, interaction);

        // HAPUS type: 12 (Media Gallery) karena tidak ada gambar
        await interaction.update({
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**<@${opponentId}> menerima tantangan\nKamu, <@${challengerId}>**\n## Informasi\n> AFK 5 menit = Kalah\n> Main dengan Cerdik\n## Jenis Item\n> - Minum ( 🍺 ) Buang peluru\n> - Pisau ( 🔪 ) Double Damage\n> - Borgol ( 🔗 ) Jalan 2x\n> - Lup ( 🔎 ) Lihat isi peluru\n> - Rokok ( 🚬 ) Heal 1 HP\n\n**${game.players[0].username} Wait vs ${game.players[1].username} Wait**` 
                    },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { 
                                style: 4, 
                                type: 2, 
                                label: "Tunggu", 
                                custom_id: `sg_ready_${gameId}` 
                            },
                            { 
                                style: 2, 
                                type: 2, 
                                label: "◼️", 
                                custom_id: `sg_dec`, 
                                disabled: true 
                            },
                            { 
                                style: 3, 
                                type: 2, 
                                label: "Selesai", 
                                custom_id: `sg_done`, 
                                disabled: true 
                            }
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
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**${interaction.user.username} Menolak Tantangan**\n\n>>> Note: Lawan mentalnya ciut! Jangan takut untuk mencoba, keberanian adalah kunci kemenangan.` 
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });
    }

    async handleReady(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            return interaction.reply({ 
                content: "❌ Game tidak ditemukan!", 
                ephemeral: true 
            });
        }

        const player = game.players.find(p => p.id === interaction.user.id);
        if (!player) {
            return interaction.reply({ 
                content: "❌ Kamu bukan pemain di game ini!", 
                ephemeral: true 
            });
        }

        if (player.ready) {
            return interaction.reply({ 
                content: "❌ Kamu sudah ready!", 
                ephemeral: true 
            });
        }

        player.ready = true;
        const allReady = game.players.every(p => p.ready);

        if (allReady) {
            await this.startNewRound(gameId, interaction);
        } else {
            const statusStr = game.players.map(p => 
                `${p.username} ${p.ready ? 'Ready' : 'Wait'}`
            ).join(' vs ');
            
            await interaction.update({
                flags: 32768,
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: "# Game Shotgun Duels" },
                        { type: 14 },
                        { type: 10, content: `## Persiapan\n${statusStr}` },
                        { 
                            type: 1, 
                            components: [
                                { 
                                    style: 3, 
                                    type: 2, 
                                    label: "Selesai", 
                                    custom_id: "sg_rd", 
                                    disabled: true 
                                }
                            ] 
                        },
                        { type: 14 },
                        { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                    ]
                }]
            });
        }
    }

    async startNewRound(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

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
            p.items = []; // Reset items dulu
            for(let i = 0; i < itemCount; i++) {
                if(p.items.length < 4) {
                    p.items.push(pool[Math.floor(Math.random() * pool.length)]);
                }
            }
        });

        // Reset status per turn
        game.usedItemThisTurn = { handcuff: false, knife: false };
        game.nextDmg = 1;
        game.handcuffed = false;

        // Animasi Loading
        const loadingFrames = this.fonts.loading;
        for (let i = 0; i < loadingFrames.length; i++) {
            await interaction.editReply({
                flags: 32768,
                components: [
                    {
                        type: 17,
                        components: [
                            { type: 10, content: `# ${this.fonts.gacha}` },
                            { type: 14 },
                            { type: 10, content: `${loadingFrames[i]}` }
                        ]
                    }
                ]
            });
            await new Promise(r => setTimeout(r, 400));
        }

        // Animasi Reload
        for (let i = 0; i < loadingFrames.length; i++) {
            await interaction.editReply({
                flags: 32768,
                components: [
                    {
                        type: 17,
                        components: [
                            { type: 10, content: `# ${this.fonts.reload}` },
                            { type: 14 },
                            { type: 10, content: `${loadingFrames[i]}` }
                        ]
                    }
                ]
            });
            await new Promise(r => setTimeout(r, 400));
        }

        // Tampilkan Chamber & Items (5 detik)
        await interaction.editReply(this.renderChamberView(game));
        await new Promise(r => setTimeout(r, 5000));
        
        // Reset logs untuk round baru
        game.logs = ["│ INFO │ Round baru dimulai!", "│ INFO │", "│ INFO │", "│ INFO │", "│ INFO │"];
        
        await this.renderMain(gameId, interaction);
    }

    renderChamberView(game) {
        const real = game.chamber.filter(c => c === '🔴').length;
        const empty = game.chamber.filter(c => c === '⚪').length;
        
        const itemEmojis = {
            '🍺': 'Minum ( 🍺 )',
            '🔪': 'Pisau ( 🔪 )',
            '🔗': 'Borgol ( 🔗 )',
            '🔎': 'Lup ( 🔎 )',
            '🚬': 'Rokok ( 🚬 )'
        };

        return {
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Reload Chamber" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**Isi Chamber:**\n> **Kosong: ${empty} ⚪**\n> **Peluru: ${real} 🔴**\n\n**Item ${game.players[0].username}:**\n${game.players[0].items.map(i => `> - **${itemEmojis[i]}**`).join('\n')}\n\n**Item ${game.players[1].username}:**\n${game.players[1].items.map(i => `> - **${itemEmojis[i]}**`).join('\n')}` 
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${game.id}` }
                ]
            }]
        };
    }

    async renderMain(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        const p1 = game.players[0];
        const p2 = game.players[1];
        const current = game.players[game.currentPlayer];

        const hpBar = (hp) => "♥️".repeat(hp) + "🤍".repeat(5 - hp);

        const itemEmojis = {
            '🍺': '🍺',
            '🔪': '🔪',
            '🔗': '🔗',
            '🔎': '🔎',
            '🚬': '🚬'
        };

        // Build status section
        let statusContent = "";
        if (game.nextDmg > 1 || game.handcuffed) {
            statusContent = "### Status:\n";
            if (game.nextDmg > 1) statusContent += `> **Next DMG: 2x**\n`;
            if (game.handcuffed) statusContent += `> **${game.players[1 - game.currentPlayer].username} Terborgol**\n`;
        }

        // Build item buttons
        const itemButtons = current.items.map((item, idx) => ({
            type: 2,
            style: 2,
            label: itemEmojis[item],
            custom_id: `sg_item_${gameId}_${idx}`
        }));

        // Fill empty slots if less than 4 items
        while (itemButtons.length < 4) {
            itemButtons.push({
                type: 2,
                style: 2,
                label: "◼️",
                custom_id: `sg_empty_${gameId}_${itemButtons.length}`,
                disabled: true
            });
        }

        const payload = {
            flags: 32768,
            components: [
                {
                    type: 17,
                    components: [
                        // HAPUS type: 12 (Media Gallery) yang menyebabkan error
                        { type: 10, content: "# Game Shotgun Duels" },
                        { type: 14 },
                        { 
                            type: 10, 
                            content: `### ${p1.username} vs ${p2.username}\n> **${p1.username}:** ${hpBar(p1.hp)} **(${p1.hp})**\n> **${p2.username}:** ${hpBar(p2.hp)} **(${p2.hp})**\n\n> **Giliran: <@${current.id}>**\n> **Sisa peluru: ${game.chamber.length}/8**\n> **Reload Chamber: ${game.reloadCount}x**\n${statusContent}\n### Item ${current.username}:\n${current.items.map(i => `> - ${itemEmojis[i]}`).join('\n')}` 
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: itemButtons
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

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload);
        } else {
            await interaction.update(payload);
        }
    }

    async handleShoot(gameId, target, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            return interaction.reply({ 
                content: "❌ Game tidak ditemukan!", 
                ephemeral: true 
            });
        }

        const bullet = game.chamber.shift();
        const shooter = game.players[game.currentPlayer];
        const victim = target === 'self' ? shooter : game.players[1 - game.currentPlayer];

        let logMsg = "";
        let gameEnded = false;

        if (bullet === '🔴') {
            victim.hp -= game.nextDmg;
            logMsg = `│ INFO │ 💥 DOR! ${victim.username} kena ${game.nextDmg} DMG!`;
            
            // Reset status
            game.nextDmg = 1;
            game.usedItemThisTurn = { handcuff: false, knife: false };
            
            // Switch turn unless handcuffed
            if (!game.handcuffed) {
                game.currentPlayer = 1 - game.currentPlayer;
            } else {
                game.handcuffed = false;
            }
        } else {
            logMsg = `│ INFO │ 💨 KLIK! Peluru kosong.`;
            game.nextDmg = 1;
            game.usedItemThisTurn = { handcuff: false, knife: false };
            
            if (target !== 'self') {
                if (!game.handcuffed) {
                    game.currentPlayer = 1 - game.currentPlayer;
                } else {
                    game.handcuffed = false;
                }
            }
        }

        this.addLog(game, logMsg);
        this.resetAFK(gameId, interaction);

        // Check win condition
        if (game.players[0].hp <= 0 || game.players[1].hp <= 0) {
            const winner = game.players.find(p => p.hp > 0);
            const loser = game.players.find(p => p.hp <= 0);
            return this.endGame(gameId, interaction, winner, loser, 'kill');
        }

        // Check if chamber empty
        if (game.chamber.length === 0) {
            // Show reload animation in log area briefly
            const p1 = game.players[0];
            const p2 = game.players[1];
            const hpBar = (hp) => "♥️".repeat(hp) + "🤍".repeat(5 - hp);
            
            await interaction.update({
                flags: 32768,
                components: [
                    {
                        type: 17,
                        components: [
                            { type: 10, content: "# Game Shotgun Duels" },
                            { type: 14 },
                            { 
                                type: 10, 
                                content: `### ${p1.username} vs ${p2.username}\n> **${p1.username}:** ${hpBar(p1.hp)} **(${p1.hp})**\n> **${p2.username}:** ${hpBar(p2.hp)} **(${p2.hp})**\n\n> **Giliran: <@${game.players[game.currentPlayer].id}>**\n> **Sisa peluru: 0/8**\n> **Reload Chamber: ${game.reloadCount}x**` 
                            },
                            { type: 14 },
                            {
                                type: 1,
                                components: [
                                    { type: 2, style: 2, label: "◼️", custom_id: `sg_wait`, disabled: true },
                                    { type: 2, style: 2, label: "◼️", custom_id: `sg_wait2`, disabled: true },
                                    { type: 2, style: 2, label: "◼️", custom_id: `sg_wait3`, disabled: true }
                                ]
                            }
                        ]
                    },
                    {
                        type: 17,
                        components: [
                            { type: 14 },
                            { type: 10, content: "# Reload Chamber" },
                            { type: 14 },
                            { type: 10, content: "Mempersiapkan peluru baru..." },
                            { type: 14 },
                            { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                        ]
                    }
                ]
            });
            
            await new Promise(r => setTimeout(r, 2000));
            return this.startNewRound(gameId, interaction);
        }
        
        await this.renderMain(gameId, interaction);
    }

    async handleItem(gameId, idx, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            return interaction.reply({ 
                content: "❌ Game tidak ditemukan!", 
                ephemeral: true 
            });
        }

        const player = game.players[game.currentPlayer];
        
        if (idx >= player.items.length) {
            return interaction.reply({ 
                content: "❌ Item tidak valid!", 
                ephemeral: true 
            });
        }

        const item = player.items[idx];

        if (item === '🔗') {
            if (game.usedItemThisTurn.handcuff) {
                return interaction.reply({ 
                    content: "❌ Borgol cuma bisa 1x per turn!", 
                    ephemeral: true 
                });
            }
            game.handcuffed = true;
            game.usedItemThisTurn.handcuff = true;
        } else if (item === '🔪') {
            if (game.usedItemThisTurn.knife) {
                return interaction.reply({ 
                    content: "❌ Pisau cuma bisa 1x per turn!", 
                    ephemeral: true 
                });
            }
            game.nextDmg = 2;
            game.usedItemThisTurn.knife = true;
        } else if (item === '🚬') {
            if (player.hp < 5) player.hp++;
        } else if (item === '🍺') {
            if (game.chamber.length > 0) {
                game.chamber.shift();
            }
        } else if (item === '🔎') {
            const nextBullet = game.chamber[0] || '⚪';
            const bulletType = nextBullet === '🔴' ? 'Peluru Aktif 🔴' : 'Peluru Kosong ⚪';
            return interaction.reply({ 
                content: `🔍 Peluru selanjutnya adalah: **${bulletType}**`, 
                ephemeral: true 
            });
        }

        player.items.splice(idx, 1);
        this.addLog(game, `│ INFO │ ${player.username} menggunakan ${item}`);
        await this.renderMain(gameId, interaction);
    }

    async handleSurrender(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            return interaction.reply({ 
                content: "❌ Game tidak ditemukan!", 
                ephemeral: true 
            });
        }

        const surrenderPlayer = game.players.find(p => p.id === interaction.user.id);
        if (!surrenderPlayer) {
            return interaction.reply({ 
                content: "❌ Kamu bukan pemain di game ini!", 
                ephemeral: true 
            });
        }

        const winner = game.players.find(p => p.id !== interaction.user.id);
        
        await interaction.update({
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**Selamat kamu menang <@${winner.id}>**\n**Karena <@${surrenderPlayer.id}> menyerah!**\n\n> Note: Menyerah bukanlah akhir dari segalanya. Yang penting adalah keberanian untuk mencoba lagi di lain waktu. Mental juara tidak pernah menyerah, tapi tahu kapan harus beristirahat.` 
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });

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
        game.afkTimer = setTimeout(() => this.afkWin(gameId, interaction), 300000);
    }

    async afkWin(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const winner = game.players[1 - game.currentPlayer];
        const afkPlayer = game.players[game.currentPlayer];
        
        try {
            await interaction.editReply({
                flags: 32768,
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: "# Game Shotgun Duels" },
                        { type: 14, divider: true },
                        { 
                            type: 10, 
                            content: `**<@${afkPlayer.id}> AFK Selama 5 menit, Selamat\nKamu menang <@${winner.id}>!**\n\n> Note: Waktu adalah emas! Jangan kelamaan mikir, mentalnya kabur ya? Strategi cepat dan tepat adalah kunci kemenangan sejati.` 
                        },
                        { type: 14 },
                        { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                    ]
                }]
            });
        } catch (err) {
            console.error("Error saat mengedit reply AFK:", err);
        }
        
        this.games.delete(gameId);
    }

    async endGame(gameId, interaction, winner, loser, type) {
        const game = this.games.get(gameId);
        if (!game) return;

        let content = "";
        if (type === 'kill') {
            content = `**Selamat kamu menang <@${winner.id}>!**\n\n> Note: Kemenangan yang gemilang! Strategi dan keberanianmu telah membuahkan hasil. Terus asah instingmu untuk pertempuran berikutnya.`;
        }

        await interaction.update({
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: content },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        });

        if (game.afkTimer) clearTimeout(game.afkTimer);
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
