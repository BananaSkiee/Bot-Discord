// modules/shotgunDuels.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShotgunLogic {
    constructor() {
        this.games = new Map();
    }

    getGame(id) { 
        return this.games.get(id); 
    }

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
        await this.renderReadyScreen(gameId, interaction);
    }

    async renderReadyScreen(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            console.error(`❌ renderReadyScreen: Game ${gameId} not found`);
            return;
        }

        const [p1, p2] = game.players;
        const statusLine = `**${p1.username} ${p1.ready ? 'Ready' : 'Wait'} vs ${p2.username} ${p2.ready ? 'Ready' : 'Wait'}**`;
        
        const p1Button = p1.ready 
            ? { style: 4, type: 2, label: "Waiting", custom_id: `sg_wait_p1_${gameId}`, disabled: true }
            : { style: 3, type: 2, label: "Confirm", custom_id: `sg_ready_${gameId}_${p1.id}`, disabled: false };
            
        const p2Button = p2.ready
            ? { style: 4, type: 2, label: "Waiting", custom_id: `sg_wait_p2_${gameId}`, disabled: true }
            : { style: 3, type: 2, label: "Confirm", custom_id: `sg_ready_${gameId}_${p2.id}`, disabled: false };

        const payload = {
            flags: 32768,
            components: [{
                type: 17,
                components: [
                    { type: 10, content: "# Game Shotgun Duels" },
                    { type: 14 },
                    { 
                        type: 10, 
                        content: `**<@${p2.id}> menerima tantangan\nKamu, <@${p1.id}>**\n## Informasi\n> AFK 5 menit = Kalah\n> Main dengan Cerdik\n## Jenis Item\n> - Minum ( 🍺 ) Buang peluru\n> - Pisau ( 🔪 ) Double Damage\n> - Borgol ( 🔗 ) Jalan 2x\n> - Lup ( 🔎 ) Lihat isi peluru\n> - Rokok ( 🚬 ) Heal 1 HP\n\n${statusLine}` 
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
            await interaction.deferUpdate();
            await this.startNewRound(gameId, interaction);
        } else {
            await this.renderReadyScreen(gameId, interaction);
        }
    }

    async startNewRound(gameId, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            console.error(`❌ startNewRound: Game ${gameId} not found`);
            return;
        }

        game.reloadCount++;
        
        const total = 8;
        const realCount = Math.floor(Math.random() * 5) + 2;
        const emptyCount = total - realCount;
        
        game.chamber = Array(realCount).fill('🔴').concat(Array(emptyCount).fill('⚪'));
        this.shuffle(game.chamber);

        game.players.forEach(p => {
            const itemCount = Math.floor(Math.random() * 4) + 1;
            const pool = ['🍺', '🔪', '🔗', '🔎', '🚬'];
            p.items = [];
            for(let i = 0; i < itemCount; i++) {
                if(p.items.length < 4) {
                    p.items.push(pool[Math.floor(Math.random() * pool.length)]);
                }
            }
        });

        game.usedItemThisTurn = { handcuff: false, knife: false };
        game.nextDmg = 1;
        game.handcuffed = false;

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

        await interaction.editReply(this.renderChamberView(game));
        await new Promise(r => setTimeout(r, 5000));
        
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
        if (!game) {
            console.error(`❌ renderMain: Game ${gameId} not found`);
            return;
        }

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

        let statusContent = "";
        if (game.nextDmg > 1 || game.handcuffed) {
            statusContent = "### Status:\n";
            if (game.nextDmg > 1) statusContent += `> **Next DMG: 2x**\n`;
            if (game.handcuffed) statusContent += `> **${game.players[1 - game.currentPlayer].username} Terborgol**\n`;
        }

        const itemButtons = current.items.map((item, idx) => ({
            type: 2,
            style: 2,
            label: itemEmojis[item],
            custom_id: `sg_item_${gameId}_${idx}`
        }));

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

        await interaction.editReply(payload);
    }

    async handleShoot(gameId, target, interaction) {
        const game = this.games.get(gameId);
        if (!game) {
            console.error(`❌ handleShoot: Game ${gameId} not found`);
            return interaction.reply({ 
                content: "❌ Game tidak ditemukan!", 
                ephemeral: true 
            });
        }

        const bullet = game.chamber.shift();
        const shooter = game.players[game.currentPlayer];
        const victim = target === 'self' ? shooter : game.players[1 - game.currentPlayer];

        let logMsg = "";

        if (bullet === '🔴') {
            victim.hp -= game.nextDmg;
            logMsg = `│ INFO │ 💥 DOR! ${victim.username} kena ${game.nextDmg} DMG!`;
            
            game.nextDmg = 1;
            game.usedItemThisTurn = { handcuff: false, knife: false };
            
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

        if (game.players[0].hp <= 0 || game.players[1].hp <= 0) {
            const winner = game.players.find(p => p.hp > 0);
            const loser = game.players.find(p => p.hp <= 0);
            return this.endGame(gameId, interaction, winner, loser, 'kill');
        }

        if (game.chamber.length === 0) {
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
