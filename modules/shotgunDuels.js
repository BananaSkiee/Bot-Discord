// modules/shotgunDuels.js - VERSI FIX BUG
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShotgunLogic {
    constructor() {
        this.games = new Map();
        this.stats = { totalGames: 0, activeGames: 0 };
        this.fonts = {
            loading: ["『 ░░░░░░░░░░ 』", "『 █░░░░░░░░░ 』", "『 ██░░░░░░░░ 』", "『 ███░░░░░░░ 』", "『 ████░░░░░░ 』", "『 █████░░░░░ 』", "『 ██████░░░░ 』", "『 ███████░░░ 』", "『 ████████░░ 』", "『 █████████░ 』", "『 ██████████ 』"],
            gacha: "ＧＡＣＨＡ  ＩＴＥＭＳ",
            reload: "ＲＥＬＯＡＤ  ＣＨＡＭＢＥＲ"
        };
    }

    getGame(id) { 
        return this.games.get(id); 
    }

    get gamesList() {
        return Array.from(this.games.keys());
    }

    // ===== UTILITY =====
    hpBar(hp) {
        return "♥️".repeat(hp) + "🤍".repeat(5 - hp);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // ===== GAME LIFECYCLE =====
    async acceptDuel(gameId, interaction, challengerId, opponentId) {
        try {
            if (interaction.user.id !== opponentId) {
                return await interaction.reply({ 
                    content: "❌ Bukan lu yang ditantang!", 
                    flags: 64
                });
            }

            const challenger = await interaction.client.users.fetch(challengerId);
            const opponent = await interaction.client.users.fetch(opponentId);

            const game = {
                id: gameId,
                players: [
                    { id: challengerId, username: challenger.username, hp: 5, items: [], ready: false },
                    { id: opponentId, username: opponent.username, hp: 5, items: [], ready: false }
                ],
                chamber: [],
                currentPlayer: Math.floor(Math.random() * 2), // Random siapa mulai
                logs: ["│ INFO │ Game dimulai!", "│ INFO │ Menunggu pemain ready...", "│ INFO │", "│ INFO │", "│ INFO │"],
                nextDmg: 1,
                handcuffed: false,
                usedItemThisTurn: { handcuff: false, knife: false },
                reloadCount: 0,
                afkTimer: null,
                createdAt: Date.now()
            };

            this.games.set(gameId, game);
            this.stats.totalGames++;
            this.stats.activeGames++;
            
            this.resetAFK(gameId, interaction);
            await this.renderReadyScreen(gameId, interaction);
            
        } catch (err) {
            console.error('🎮 acceptDuel ERROR:', err);
            return await interaction.reply({ 
                content: "❌ Gagal membuat game!", 
                flags: 64 
            });
        }
    }

    async rejectDuel(gameId, interaction) {
        const content = `**<@${interaction.user.id}> Menolak Tantangan**\n\n>>> *Mental ciut! Keberanian adalah kunci kemenangan. Jangan takut untuk mencoba lain kali!*`;
        
        const payload = {
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
        };
        await interaction.update(payload);
    }

    // ===== READY SYSTEM =====
    async renderReadyScreen(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) return;

        const [p1, p2] = game.players;
        const statusLine = `**<@${p1.id}> ${p1.ready ? '✅ Ready' : '⏳ Wait'} vs <@${p2.id}> ${p2.ready ? '✅ Ready' : '⏳ Wait'}**`;
        
        const infoText = `**<@${p2.id}> menerima tantangan dari <@${p1.id}>**\n\n## 📋 Informasi\n> ⏱️ AFK 5 menit = Kalah\n> 🧠 Main dengan Cerdik\n\n## 🎒 Jenis Item\n> 🍺 **Minum** - Buang peluru\n> 🔪 **Pisau** - Double Damage\n> 🔗 **Borgol** - Jalan 2x\n> 🔎 **Lup** - Lihat isi peluru\n> 🚬 **Rokok** - Heal 1 HP\n\n${statusLine}`;

        const p1Button = p1.ready 
            ? { style: 4, type: 2, label: "⏹️ Waiting", custom_id: `sg_wait_${gameId}_p1`, disabled: true }
            : { style: 3, type: 2, label: "✅ Confirm", custom_id: `sg_ready_${gameId}_${p1.id}`, disabled: false };
            
        const p2Button = p2.ready
            ? { style: 4, type: 2, label: "⏹️ Waiting", custom_id: `sg_wait_${gameId}_p2`, disabled: true }
            : { style: 3, type: 2, label: "✅ Confirm", custom_id: `sg_ready_${gameId}_${p2.id}`, disabled: false };

        const payload = {
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { type: 10, content: infoText },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            p1Button,
                            { style: 2, type: 2, label: "◼️", custom_id: `sg_dec_${gameId}`, disabled: true },
                            p2Button
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        };

        await interaction.update(payload);
    }

    async handleReady(gameId, interaction) {
        try {
            const game = this.games.get(gameId);
            if (!game) {
                return await interaction.reply({ 
                    content: "❌ Game tidak ditemukan!", 
                    flags: 64 
                });
            }

            const player = game.players.find(p => p.id === interaction.user.id);
            if (!player) {
                return await interaction.reply({ 
                    content: "❌ Kamu bukan pemain di game ini!", 
                    flags: 64 
                });
            }

            if (player.ready) {
                return await interaction.reply({ 
                    content: "❌ Kamu sudah ready!", 
                    flags: 64 
                });
            }

            player.ready = true;
            const allReady = game.players.every(p => p.ready);

            if (allReady) {
                await interaction.deferUpdate();
                await this.startNewRound(gameId, interaction);
            } else {
                await this.renderReadyScreen(gameId, interaction);
            }
        } catch (err) {
            console.error('🎮 handleReady ERROR:', err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "❌ Error!", flags: 64 });
            }
        }
    }

    // ===== GAMEPLAY =====
    async startNewRound(gameId, interaction) {
        try {
            const game = this.games.get(gameId);
            if (!game) return;

            game.reloadCount++;
            
            // Generate chamber: 8 total, min 2 live, min 2 blank
            const liveCount = Math.floor(Math.random() * 5) + 2; // 2-6 live
            const blankCount = 8 - liveCount;
            
            game.chamber = [
                ...Array(liveCount).fill('🔴'),
                ...Array(blankCount).fill('⚪')
            ];
            this.shuffle(game.chamber);

            // Generate items: 1-4 random per player (pasti dapat minimal 1)
            const itemPool = ['🍺', '🔪', '🔗', '🔎', '🚬'];
            game.players.forEach(p => {
                const count = Math.floor(Math.random() * 4) + 1; // 1-4 item
                p.items = [];
                for (let i = 0; i < count; i++) {
                    p.items.push(itemPool[Math.floor(Math.random() * itemPool.length)]);
                }
            });

            // Reset turn state
            game.usedItemThisTurn = { handcuff: false, knife: false };
            game.nextDmg = 1;
            game.handcuffed = false;

            // Animation: Gacha Items
            for (const frame of this.fonts.loading) {
                await interaction.editReply({
                    flags: 32768,
                    components: [{
                        type: 17,
                        components: [
                            { type: 10, content: `# ${this.fonts.gacha}` },
                            { type: 14 },
                            { type: 10, content: frame },
                            { type: 14 },
                            { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                        ]
                    }]
                });
                await new Promise(r => setTimeout(r, 200));
            }

            // Show chamber info (5 seconds)
            await interaction.editReply(this.renderChamberView(game, gameId));
            await new Promise(r => setTimeout(r, 5000));

            // Animation: Reload Chamber
            for (const frame of this.fonts.loading) {
                await interaction.editReply({
                    flags: 32768,
                    components: [{
                        type: 17,
                        components: [
                            { type: 10, content: `# ${this.fonts.reload}` },
                            { type: 14 },
                            { type: 10, content: frame },
                            { type: 14 },
                            { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                        ]
                    }]
                });
                await new Promise(r => setTimeout(r, 200));
            }
            
            // Reset logs
            game.logs = ["│ INFO │ 🎮 Round baru dimulai!", "│ INFO │", "│ INFO │", "│ INFO │", "│ INFO │"];
            
            await this.renderMain(gameId, interaction);
            
        } catch (err) {
            console.error('🎮 startNewRound ERROR:', err);
        }
    }

    renderChamberView(game, gameId) {
        const live = game.chamber.filter(c => c === '🔴').length;
        const blank = game.chamber.filter(c => c === '⚪').length;
        
        const [p1, p2] = game.players;
        
        const itemNames = {
            '🍺': 'Minum (🍺)',
            '🔪': 'Pisau (🔪)',
            '🔗': 'Borgol (🔗)',
            '🔎': 'Lup (🔎)',
            '🚬': 'Rokok (🚬)'
        };

        const p1Items = p1.items.map(i => `> - **${itemNames[i]}**`).join('\n') || '> - (kosong)';
        const p2Items = p2.items.map(i => `> - **${itemNames[i]}**`).join('\n') || '> - (kosong)';

        return {
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**Isi Chamber:**\n> **Kosong: ${blank} ⚪**\n> **Peluru: ${live} 🔴**\n\n**Item ${p1.username}:**\n${p1Items}\n\n**Item ${p2.username}:**\n${p2Items}` 
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                ]
            }]
        };
    }

    async renderMain(gameId, interaction) {
        try {
            const game = this.games.get(gameId);
            if (!game) return;

            const [p1, p2] = game.players;
            const current = game.players[game.currentPlayer];

            // Status section
            let statusText = "";
            if (game.nextDmg > 1) statusText += `> 💥 **Next DMG: 2x**\n`;
            if (game.handcuffed) {
                const victim = game.players[1 - game.currentPlayer];
                statusText += `> 🔗 **<@${victim.id}> Terborgol**\n`;
            }

            // Item buttons
            const itemButtons = [];
            for (let i = 0; i < 4; i++) {
                if (i < current.items.length) {
                    itemButtons.push({
                        type: 2,
                        style: 2,
                        label: current.items[i],
                        custom_id: `sg_item_${gameId}_${i}`
                    });
                } else {
                    itemButtons.push({
                        type: 2,
                        style: 2,
                        label: "◼️",
                        custom_id: `sg_empty_${gameId}_${i}`,
                        disabled: true
                    });
                }
            }

            // Item list text
            const itemList = current.items.map(i => `> - ${i}`).join('\n') || '> - (kosong)';

            const mainContent = `### ⚔️ <@${p1.id}> vs <@${p2.id}>
> **<@${p1.id}>:** ${this.hpBar(p1.hp)} **(${p1.hp}/5)**
> **<@${p2.id}>:** ${this.hpBar(p2.hp)} **(${p2.hp}/5)**

> 🎯 **Giliran:** <@${current.id}>
> 🎲 **Sisa peluru:** ${game.chamber.length}/8
> 🔄 **Reload:** ${game.reloadCount}x
${statusText ? `\n### 📊 Status:\n${statusText}` : ''}
### 🎒 Item <@${current.id}> :
${itemList}`;

            const logContent = game.logs.join('\n') || "│ INFO │ (no logs)";

            const payload = {
                flags: 32768,
                components: [
                    {
                        type: 17,
                        components: [
                            { type: 10, content: "# Game Shotgun Duels" },
                            { type: 14 },
                            { type: 10, content: mainContent },
                            { type: 14 },
                            { type: 1, components: itemButtons },
                            {
                                type: 1,
                                components: [
                                    { type: 2, style: 1, label: "🎯 Shoot Yourself", custom_id: `sg_shoot_self_${gameId}` },
                                    { type: 2, style: 4, label: "🔥 Shoot Enemy", custom_id: `sg_shoot_opp_${gameId}` },
                                    { type: 2, style: 2, label: "🏳️ Surrender", custom_id: `sg_surrender_${gameId}` }
                                ]
                            }
                        ]
                    },
                    {
                        type: 17,
                        components: [
                            { type: 14 },
                            { type: 10, content: "## Log Shotgun Duels" },
                            { type: 14 },
                            { type: 10, content: logContent },
                            { type: 14 },
                            { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                        ]
                    }
                ]
            };

            await interaction.editReply(payload);
        } catch (err) {
            console.error('🎮 renderMain ERROR:', err);
        }
    }

    // ===== ACTIONS =====
    async handleShoot(gameId, target, interaction) {
        try {
            const game = this.games.get(gameId);
            if (!game) {
                return await interaction.reply({ 
                    content: "❌ Game tidak ditemukan!", 
                    flags: 64 
                });
            }

            // FIX: Ambil p1 dan p2 dari game.players
            const p1 = game.players[0];
            const p2 = game.players[1];
            
            if (game.chamber.length === 0) {
                return await interaction.reply({
                    content: "❌ Chamber kosong!",
                    flags: 64
                });
            }

            const bullet = game.chamber.shift();
            const shooter = game.players[game.currentPlayer];
            const victim = target === 'self' ? shooter : game.players[1 - game.currentPlayer];

            let logMsg = "";

            if (bullet === '🔴') {
                // LIVE ROUND
                victim.hp -= game.nextDmg;
                logMsg = `│ INFO │ 💥 **DOR!** <@${victim.id}> kena **${game.nextDmg}** DMG!`;
                
                // Reset modifiers
                game.nextDmg = 1;
                game.usedItemThisTurn = { handcuff: false, knife: false };
                
                // Switch turn (unless handcuffed)
                if (!game.handcuffed) {
                    game.currentPlayer = 1 - game.currentPlayer;
                } else {
                    game.handcuffed = false;
                }
            } else {
                // BLANK ROUND
                logMsg = `│ INFO │ 💨 **KLIK!** Peluru kosong.`;
                game.nextDmg = 1;
                game.usedItemThisTurn = { handcuff: false, knife: false };
                
                // Switch turn only if shoot enemy
                if (target !== 'self') {
                    if (!game.handcuffed) {
                        game.currentPlayer = 1 - game.currentPlayer;
                    } else {
                        game.handcuffed = false;
                    }
                }
                // If shoot self and blank, keep turn (Russian roulette rule)
            }

            this.addLog(game, logMsg);
            this.resetAFK(gameId, interaction);

            // Check win condition
            if (p1.hp <= 0 || p2.hp <= 0) {
                const winner = game.players.find(p => p.hp > 0);
                return await this.endGame(gameId, interaction, winner, 'kill');
            }

            // Check empty chamber
            if (game.chamber.length === 0) {
                // Show reload screen briefly
                await interaction.editReply({
                    flags: 32768,
                    components: [{
                        type: 17,
                        components: [
                            { type: 10, content: "# 🔄 Reloading..." },
                            { type: 14 },
                            { type: 10, content: "Chamber kosong! Memuat ulang..." },
                            { type: 14 },
                            { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${gameId}` }
                        ]
                    }]
                });
                await new Promise(r => setTimeout(r, 1500));
                return await this.startNewRound(gameId, interaction);
            }

            await this.renderMain(gameId, interaction);

        } catch (err) {
            console.error('🎮 handleShoot ERROR:', err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "❌ Error!", flags: 64 });
            }
        }
    }

    async handleItem(gameId, itemIdx, interaction) {
        try {
            const game = this.games.get(gameId);
            if (!game) {
                return await interaction.reply({ 
                    content: "❌ Game tidak ditemukan!", 
                    flags: 64 
                });
            }

            const player = game.players[game.currentPlayer];
            
            if (itemIdx >= player.items.length) {
                return await interaction.reply({ 
                    content: "❌ Item tidak valid!", 
                    flags: 64 
                });
            }

            const item = player.items[itemIdx];

            // Use item
            switch(item) {
                case '🔗': // Handcuff
                    if (game.usedItemThisTurn.handcuff) {
                        return await interaction.reply({ 
                            content: "❌ Borgol cuma 1x per turn!", 
                            flags: 64 
                        });
                    }
                    game.handcuffed = true;
                    game.usedItemThisTurn.handcuff = true;
                    player.items.splice(itemIdx, 1);
                    this.addLog(game, `│ INFO │ 🔗 <@${player.id}> pasang borgol!`);
                    break;
                    
                case '🔪': // Knife
                    if (game.usedItemThisTurn.knife) {
                        return await interaction.reply({ 
                            content: "❌ Pisau cuma 1x per turn!", 
                            flags: 64 
                        });
                    }
                    game.nextDmg = 2;
                    game.usedItemThisTurn.knife = true;
                    player.items.splice(itemIdx, 1);
                    this.addLog(game, `│ INFO │ 🔪 <@${player.id}> pasang pisau!`);
                    break;
                    
                case '🚬': // Cigarette
                    if (player.hp < 5) {
                        player.hp++;
                        player.items.splice(itemIdx, 1);
                        this.addLog(game, `│ INFO │ 🚬 <@${player.id}> heal 1 HP!`);
                    } else {
                        return await interaction.reply({
                            content: "❌ HP sudah penuh!",
                            flags: 64
                        });
                    }
                    break;
                    
                case '🍺': // Beer
                    if (game.chamber.length > 0) {
                        const removed = game.chamber.shift();
                        player.items.splice(itemIdx, 1);
                        this.addLog(game, `│ INFO │ 🍺 <@${player.id}> buang peluru (${removed === '🔴' ? '🔴 Live' : '⚪ Blank'})`);
                        return await interaction.reply({ 
                            content: `🍺 Peluru dibuang: ${removed === '🔴' ? '🔴 Live' : '⚪ Blank'}`, 
                            flags: 64 
                        });
                    } else {
                        return await interaction.reply({
                            content: "❌ Chamber kosong!",
                            flags: 64
                        });
                    }
                    
                case '🔎': // Magnifying glass
                    const next = game.chamber[0] || '⚪';
                    player.items.splice(itemIdx, 1);
                    this.addLog(game, `│ INFO │ 🔎 <@${player.id}> lihat peluru`);
                    return await interaction.reply({ 
                        content: `🔎 Peluru selanjutnya: ${next === '🔴' ? '🔴 **LIVE**' : '⚪ **BLANK**'}`, 
                        flags: 64 
                    });
            }
            
            await this.renderMain(gameId, interaction);

        } catch (err) {
            console.error('🎮 handleItem ERROR:', err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "❌ Error!", flags: 64 });
            }
        }
    }

    async handleSurrender(gameId, interaction) {
        try {
            const game = this.games.get(gameId);
            if (!game) {
                return await interaction.reply({ 
                    content: "❌ Game tidak ditemukan!", 
                    flags: 64 
                });
            }

            const surrenderPlayer = game.players.find(p => p.id === interaction.user.id);
            if (!surrenderPlayer) {
                return await interaction.reply({ 
                    content: "❌ Kamu bukan pemain!", 
                    flags: 64 
                });
            }

            const winner = game.players.find(p => p.id !== interaction.user.id);
            
            const content = `**🏆 <@${winner.id}> MENANG!**\n**🏳️ <@${surrenderPlayer.id}> menyerah**\n\n> *Keberanian adalah kunci kemenangan. Jangan menyerah, lain kali coba lagi!*`;
            
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

            this.cleanupGame(gameId);

        } catch (err) {
            console.error('🎮 handleSurrender ERROR:', err);
        }
    }

    // ===== HELPERS =====
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
        
        const afkPlayer = game.players[game.currentPlayer];
        const winner = game.players[1 - game.currentPlayer];
        
        const content = `**🏆 <@${winner.id}> MENANG!**\n**⏱️ <@${afkPlayer.id}> AFK 5 menit**\n\n> *Waktu adalah emas! Jangan kelamaan mikir, lain kali lebih cepat bertindak!*`;
        
        try {
            await interaction.editReply({
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
        } catch (err) {
            console.error('afkWin ERROR:', err);
        }
        
        this.cleanupGame(gameId);
    }

    async endGame(gameId, interaction, winner, type) {
        const game = this.games.get(gameId);
        if (!game) return;

        let content = "";
        if (type === 'kill') {
            content = `**🏆 <@${winner.id}> MENANG!**\n\n> *Kemenangan gemilang! Strategi dan keberanian membuahkan hasil! Selamat!*`;
        }

        try {
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
        } catch (err) {
            console.error('endGame ERROR:', err);
        }

        this.cleanupGame(gameId);
    }

    cleanupGame(gameId) {
        const game = this.games.get(gameId);
        if (game?.afkTimer) clearTimeout(game.afkTimer);
        this.games.delete(gameId);
        this.stats.activeGames--;
        console.log(`🎮 Game ${gameId} cleaned up. Active: ${this.stats.activeGames}`);
    }
}

module.exports = ShotgunLogic;
