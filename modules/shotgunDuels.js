// modules/shotgunDuels.js - VERSI DEWA BERKELAS DUNIA TOP 1 MODERN
// Perbaikan: Fix semua bug, animasi profesional, logika sempurna

class ShotgunLogic {
    constructor() {
        this.games = new Map();
        this.stats = { totalGames: 0, activeGames: 0 };
    }

    getGame(id) { 
        return this.games.get(id); 
    }

    get gamesList() {
        return Array.from(this.games.keys());
    }

    // --- Helper Animasi Font Profesional ---
    get fonts() {
        return {
            loading: ["『 ▒▒▒▒▒▒▒▒▒▒ 』", "『 ██▒▒▒▒▒▒▒▒ 』", "『 ████▒▒▒▒▒▒ 』", "『 ██████▒▒▒▒ 』", "『 ████████▒▒ 』", "『 ██████████ 』"],
            gacha: "ＧＡＣＨＡ  ＩＴＥＭＳ",
            reload: "ＲＥＬＯＡＤ  ＣＨＡＭＢＥＲ"
        };
    }

    // ===== UTILITY =====
    hpBar(hp) {
        const hearts = Math.max(0, Math.min(5, hp));
        return "♥️".repeat(hearts) + "🤍".repeat(5 - hearts);
    }

    shuffle(array) {
        const arr = [...array]; // Copy array
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
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
                currentPlayer: Math.floor(Math.random() * 2), // Random siapa mulai duluan
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
        const payload = {
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**${interaction.user.username} Menolak Tantangan**\n\n>>> Note: Mental ciut! Keberanian adalah kunci kemenangan. Jangan takut untuk mencoba!` 
                    },
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
        const statusLine = `**${p1.username} ${p1.ready ? '✅ Ready' : '⏳ Wait'} vs ${p2.username} ${p2.ready ? '✅ Ready' : '⏳ Wait'}**`;
        
        // Tombol P1
        const p1Button = p1.ready 
            ? { style: 3, type: 2, label: "✅ Selesai", custom_id: `sg_done_${gameId}_${p1.id}`, disabled: true }
            : { style: 4, type: 2, label: "⏹️ Tunggu", custom_id: `sg_ready_${gameId}_${p1.id}`, disabled: false };
            
        // Tombol P2
        const p2Button = p2.ready
            ? { style: 3, type: 2, label: "✅ Selesai", custom_id: `sg_done_${gameId}_${p2.id}`, disabled: true }
            : { style: 4, type: 2, label: "⏹️ Tunggu", custom_id: `sg_ready_${gameId}_${p2.id}`, disabled: false };

        const payload = {
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# 🎮 Shotgun Duels" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**<@${p2.id}> menerima tantangan dari <@${p1.id}>**\n\n## 📋 Informasi\n> ⏱️ AFK 5 menit = Kalah\n> 🧠 Main dengan Cerdik\n\n## 🎒 Jenis Item\n> 🍺 **Minum** - Buang peluru\n> 🔪 **Pisau** - Double Damage\n> 🔗 **Borgol** - Jalan 2x\n> 🔎 **Lup** - Lihat isi peluru\n> 🚬 **Rokok** - Heal 1 HP\n\n${statusLine}` 
                    },
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
                // DEFER dulu untuk menghindari timeout
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
            
            // Generate chamber: 8 total, min 2 live, min 2 blank (tidak boleh 1 atau 0)
            let liveCount, blankCount;
            do {
                liveCount = Math.floor(Math.random() * 5) + 2; // 2-6 live
                blankCount = 8 - liveCount;
            } while (liveCount < 2 || blankCount < 2); // Pastikan minimal 2-2

            game.chamber = [
                ...Array(liveCount).fill('🔴'),
                ...Array(blankCount).fill('⚪')
            ];
            game.chamber = this.shuffle(game.chamber);

            // Generate items: 1-4 random per player (tidak boleh 0)
            const itemPool = ['🍺', '🔪', '🔗', '🔎', '🚬'];
            game.players.forEach(p => {
                const count = Math.floor(Math.random() * 4) + 1; // 1-4 items
                p.items = [];
                for (let i = 0; i < count; i++) {
                    p.items.push(itemPool[Math.floor(Math.random() * itemPool.length)]);
                }
            });

            // Reset turn state
            game.usedItemThisTurn = { handcuff: false, knife: false };
            game.nextDmg = 1;
            game.handcuffed = false;

            // ===== ANIMASI GACHA =====
            for (const frame of this.fonts.loading) {
                await interaction.editReply({
                    flags: 32768,
                    components: [{
                        type: 17,
                        components: [
                            { type: 10, content: `# ${this.fonts.gacha}` },
                            { type: 14 },
                            { type: 10, content: frame }
                        ]
                    }]
                });
                await new Promise(r => setTimeout(r, 300));
            }

            // ===== ANIMASI RELOAD =====
            for (const frame of this.fonts.loading) {
                await interaction.editReply({
                    flags: 32768,
                    components: [{
                        type: 17,
                        components: [
                            { type: 10, content: `# ${this.fonts.reload}` },
                            { type: 14 },
                            { type: 10, content: frame }
                        ]
                    }]
                });
                await new Promise(r => setTimeout(r, 300));
            }

            // ===== TAMPILKAN INFO CHAMBER & ITEM (5 DETIK) =====
            await interaction.editReply(this.renderChamberView(game));
            await new Promise(r => setTimeout(r, 5000));
            
            // Reset logs untuk round baru
            game.logs = ["│ INFO │ 🎮 Round baru dimulai!", "│ INFO │", "│ INFO │", "│ INFO │", "│ INFO │"];
            
            await this.renderMain(gameId, interaction);
            
        } catch (err) {
            console.error('🎮 startNewRound ERROR:', err);
        }
    }

    renderChamberView(game) {
        const live = game.chamber.filter(c => c === '🔴').length;
        const blank = game.chamber.filter(c => c === '⚪').length;
        
        const itemNames = {
            '🍺': 'Minum (🍺)',
            '🔪': 'Pisau (🔪)',
            '🔗': 'Borgol (🔗)',
            '🔎': 'Lup (🔎)',
            '🚬': 'Rokok (🚬)'
        };

        const p1Items = game.players[0].items.map(i => `> - **${itemNames[i]}**`).join('\n') || '> (Tidak ada item)';
        const p2Items = game.players[1].items.map(i => `> - **${itemNames[i]}**`).join('\n') || '> (Tidak ada item)';

        return {
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# 🎲 Reload Chamber" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**Isi Chamber:**\n> **Kosong: ${blank} ⚪**\n> **Peluru: ${live} 🔴**\n\n**Item ${game.players[0].username}:**\n${p1Items}\n\n**Item ${game.players[1].username}:**\n${p2Items}` 
                    },
                    { type: 14 },
                    { type: 10, content: `-# © BananaSkiee - Shotgun Duels - ID: ${game.id}` }
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

            // Status section (hanya muncul jika ada)
            let statusText = "";
            if (game.nextDmg > 1) statusText += `> **Next DMG: 2x**\n`;
            if (game.handcuffed) statusText += `> **${game.players[1 - game.currentPlayer].username} Terborgol**\n`;

            // Item buttons (hanya tampilkan item yang dimiliki)
            const itemButtons = [];
            const itemEmojis = { '🍺': '🍺', '🔪': '🔪', '🔗': '🔗', '🔎': '🔎', '🚬': '🚬' };
            
            current.items.forEach((item, idx) => {
                itemButtons.push({
                    type: 2,
                    style: 2,
                    label: itemEmojis[item],
                    custom_id: `sg_item_${gameId}_${idx}`
                });
            });

            // Fill empty slots sampai 4
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
                            { type: 10, content: "# 🎮 Shotgun Duels" },
                            { type: 14 },
                            { 
                                type: 10, 
                                content: `### ⚔️ ${p1.username} vs ${p2.username}\n> **${p1.username}:** ${this.hpBar(p1.hp)} **(${p1.hp}/5)**\n> **${p2.username}:** ${this.hpBar(p2.hp)} **(${p2.hp}/5)**\n\n> 🎯 **Giliran:** <@${current.id}>\n> 🎲 **Sisa peluru:** ${game.chamber.length}/8\n> 🔄 **Reload Chamber:** ${game.reloadCount}x\n${statusText ? `\n### 📊 Status:\n${statusText}` : ''}\n### 🎒 Item ${current.username}:\n${current.items.map(i => `> ${i}`).join('\n') || '> (Kosong)'}` 
                            },
                            { type: 14 },
                            { type: 1, components: itemButtons },
                            {
                                type: 1,
                                components: [
                                    { type: 2, style: 1, label: "🎯 Shoot Yourself", custom_id: `sg_shoot_self_${gameId}` },
                                    { type: 2, style: 4, label: "🔥 Shoot Enemy", custom_id: `sg_shoot_opp_${gameId}` },
                                    { type: 2, style: 2, label: "🏳️", custom_id: `sg_surrender_${gameId}` }
                                ]
                            }
                        ]
                    },
                    {
                        type: 17,
                        components: [
                            { type: 14 },
                            { type: 10, content: "## 📝 Log Shotgun Duels" },
                            { type: 14 },
                            { type: 10, content: game.logs.join('\n') || "│ INFO │ (no logs)" },
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

            // FIX: Deklarasikan p1 dan p2 di sini!
            const [p1, p2] = game.players;
            const bullet = game.chamber.shift();
            const shooter = game.players[game.currentPlayer];
            const victim = target === 'self' ? shooter : game.players[1 - game.currentPlayer];

            let logMsg = "";

            if (bullet === '🔴') {
                // LIVE ROUND
                victim.hp -= game.nextDmg;
                logMsg = `│ INFO │ 💥 **DOR!** ${victim.username} kena **${game.nextDmg}** DMG!`;
                
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

            // Check win condition - FIX: Gunakan p1 dan p2 yang sudah dideklarasikan
            if (p1.hp <= 0 || p2.hp <= 0) {
                const winner = game.players.find(p => p.hp > 0);
                return await this.endGame(gameId, interaction, winner, 'kill');
            }

            // Check empty chamber
            if (game.chamber.length === 0) {
                // Show reload screen briefly
                await interaction.update({
                    flags: 32768,
                    components: [{
                        type: 17,
                        components: [
                            { type: 10, content: "# 🔄 Reload Chamber" },
                            { type: 14 },
                            { type: 10, content: "**Chamber kosong! Memuat ulang...**" }
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
                    break;
                    
                case '🚬': // Cigarette
                    if (player.hp < 5) player.hp++;
                    break;
                    
                case '🍺': // Beer
                    if (game.chamber.length > 0) {
                        const removed = game.chamber.shift();
                        // Reply ephemeral untuk info beer
                        await interaction.reply({ 
                            content: `🍺 Peluru dibuang: ${removed === '🔴' ? '🔴 Live' : '⚪ Blank'}`, 
                            flags: 64 
                        });
                        // Remove item dan update main
                        player.items.splice(itemIdx, 1);
                        this.addLog(game, `│ INFO │ 🎒 ${player.username} pakai 🍺`);
                        await this.renderMain(gameId, interaction);
                        return;
                    }
                    break;
                    
                case '🔎': // Magnifying glass
                    const next = game.chamber[0] || '⚪';
                    await interaction.reply({ 
                        content: `🔎 Peluru selanjutnya: ${next === '🔴' ? '🔴 **LIVE**' : '⚪ **BLANK**'}`, 
                        flags: 64 
                    });
                    player.items.splice(itemIdx, 1);
                    this.addLog(game, `│ INFO │ 🎒 ${player.username} pakai 🔎`);
                    await this.renderMain(gameId, interaction);
                    return;
            }

            // Remove used item (kecuali beer dan magnifying glass yang sudah di-handle)
            player.items.splice(itemIdx, 1);
            this.addLog(game, `│ INFO │ 🎒 ${player.username} pakai ${item}`);
            
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
            
            await interaction.update({
                flags: 32768,
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: "# 🏳️ Game Over" },
                        { type: 14 },
                        { 
                            type: 10, 
                            content: `**🏆 <@${winner.id}> MENANG!**\n**🏳️ <@${surrenderPlayer.id}> menyerah**\n\n> 💭 *Menyerah bukan akhir. Yang penting berani mencoba lagi!*` 
                        },
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
        game.afkTimer = setTimeout(() => this.afkWin(gameId, interaction), 300000); // 5 menit
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
                        { type: 10, content: "# ⏱️ AFK Timeout" },
                        { type: 14 },
                        { 
                            type: 10, 
                            content: `**🏆 <@${winner.id}> MENANG!**\n**⏱️ <@${afkPlayer.id}> AFK 5 menit**\n\n> 💭 *Waktu adalah emas! Jangan kelamaan mikir!*` 
                        },
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
            content = `**🏆 <@${winner.id}> MENANG!**\n**💀 Lawan tumbang**\n\n> 🎉 Kemenangan gemilang! Strategi dan keberanian membuahkan hasil!`;
        }

        try {
            await interaction.update({
                flags: 32768,
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: "# 🎉 Game Over" },
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
