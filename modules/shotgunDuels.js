const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    games: new Map(),

    async startGame(p1, p2, channel) {
        const gameId = `shotgun-${Date.now()}`;
        const randomizedPlayers = [p1, p2].sort(() => Math.random() - 0.5);
        
        const game = {
            id: gameId,
            players: randomizedPlayers,
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
            logs: ['➤ Menunggu kedua pemain SIAP...'],
            message: null,
            phase: 'WAITING',
            channel: channel
        };
        this.games.set(gameId, game);
        await this.render(gameId);
    },

    async render(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        const p1 = game.players[0];
        const p2 = game.players[1];
        const turnPlayer = game.players[game.currentPlayer];

        // --- CONTENT LOGIC ---
        let content = "## 🔫 SHOTGUN DUELS\n";
        if (game.phase === 'WAITING') {
            content += `> **${p1.username}** vs **${p2.username}**\n\n**STATUS:**\n${game.ready[p1.id] ? '✅' : '❌'} ${p1.username}\n${game.ready[p2.id] ? '✅' : '❌'} ${p2.username}`;
        } else if (game.phase === 'REVEAL') {
            content += `### 🔍 REVEAL CHAMBER\n# ${game.chambers.join(' ')}\n-# Ingat urutan ini dalam 5 detik!`;
        } else if (game.phase === 'BATTLE') {
            content += `### 🩸 ARENA\n**${p1.username}:** ${'❤️'.repeat(game.health[p1.id])}\n**${p2.username}:** ${'❤️'.repeat(game.health[p2.id])}\n\n**GILIRAN:** ${turnPlayer}\n\`\`\`md\n${game.logs.join('\n')}\n\`\`\``;
        } else {
            content += `### 🏆 GAME OVER\n${game.logs[0]}`;
        }

        // --- BUTTONS ---
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

        // --- V2 PAYLOAD (Sama kayak Intro Card lu) ---
        const payload = {
            components: [{
                type: 17,
                components: [
                    { type: 12, items: [{ media: { url: "https://r2.erweima.ai/i/6f90d1920807.png" } }] },
                    { type: 14, spacing: 1 },
                    { type: 10, content: content },
                    { type: 14, spacing: 1 },
                    ...rows.map(r => r.toJSON()), // Masukin tombol ke dalam Container V2
                    { type: 14, spacing: 1 },
                    { type: 10, content: `-# © BananaSkiee Duel Systems <t:${Math.floor(Date.now()/1000)}:R>` }
                ]
            }]
        };

        try {
            if (!game.message) {
                game.message = await game.channel.send({ ...payload, flags: MessageFlags.IsComponentsV2 });
            } else {
                await game.message.edit({ ...payload, flags: MessageFlags.IsComponentsV2 });
            }
        } catch (e) { console.error("SG Render Error:", e); }
    },

    async handleShotgunInteractions(interaction) {
        if (!interaction.isButton()) return;
        const [prefix, action, gameId, extra] = interaction.customId.split('_');
        if (prefix !== 'sg') return; // Memastikan ini tombol shotgun

        const game = this.games.get(gameId);
        if (!game) return interaction.reply({ content: "Game tidak ditemukan!", flags: 64 });
        if (!game.players.some(p => p.id === interaction.user.id)) return interaction.reply({ content: "Lu bukan pemain!", flags: 64 });

        await interaction.deferUpdate();
        
        // --- HANDLING LOGIC ---
        if (action === 'ready') {
            game.ready[interaction.user.id] = true;
            if (game.ready[game.players[0].id] && game.ready[game.players[1].id]) {
                game.phase = 'REVEAL';
                game.chambers = [...Array(Math.floor(Math.random()*3)+2).fill('💥'), ...Array(4).fill('⚪')].sort(() => Math.random()-0.5);
                game.currentIdx = 0;
                // Kasih item awal
                game.players.forEach(p => { for(let i=0; i<2; i++) game.items[p.id].push(['🚬','🍺','🔪','🔎','🔗'][Math.floor(Math.random()*5)]); });
                
                await this.render(gameId);
                setTimeout(async () => { 
                    if(this.games.has(gameId)) { game.phase = 'BATTLE'; await this.render(gameId); }
                }, 5000);
            } else { await this.render(gameId); }
        }
        
        // ... Tambahkan logic shoot/item di sini (Mirip handleAction sebelumnya)
    }
};
