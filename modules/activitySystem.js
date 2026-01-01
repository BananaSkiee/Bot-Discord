const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const cron = require('node-cron');

module.exports = (client) => {

    // --- TRACKING SYSTEM (CHAT) ---
    client.on('messageCreate', async (m) => {
        if (m.author.bot || !m.guild) return;
        await db.add(`stats_${m.author.id}.messages`, 1);
        await db.set(`stats_${m.author.id}.username`, m.author.username);
    });

    // --- TRACKING SYSTEM (VOICE) ---
    const voiceStatus = new Map();
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (newState.member?.user.bot) return;
        if (!oldState.channelId && newState.channelId) voiceStatus.set(newState.id, Date.now());
        if (oldState.channelId && !newState.channelId) {
            const joinTime = voiceStatus.get(newState.id);
            if (joinTime) {
                const duration = Date.now() - joinTime;
                await db.add(`stats_${newState.id}.voiceTime`, duration);
                await db.set(`stats_${newState.id}.username`, newState.member.user.username);
                voiceStatus.delete(newState.id);
            }
        }
    });

    // --- HELPER: AMBIL DATA ---
    async function getData(type, isSnapshot = false) {
        let all;
        if (isSnapshot) {
            all = await db.get(`snapshot_last_month`) || [];
            return all.map(u => ({
                id: u.id, username: u.username,
                value: type === 'message' ? (u.messages || 0) : (u.voiceTime || 0)
            })).sort((a, b) => b.value - a.value);
        } else {
            const raw = await db.all();
            return raw.filter(i => i.id.startsWith('stats_')).map(u => ({
                id: u.id.split('_')[1],
                username: u.value.username || 'Unknown',
                value: type === 'message' ? (u.value.messages || 0) : (u.value.voiceTime || 0)
            })).sort((a, b) => b.value - a.value);
        }
    }

    // --- RENDER LAYOUT V2 (PROFESIONAL) ---
    function renderLayout(type, page, data, userId, isSnapshot) {
        const totalPages = Math.ceil(data.length / 10) || 1;
        const start = page * 10;
        const currentData = data.slice(start, start + 10);
        const snapLabel = isSnapshot ? "snapshot" : "realtime";
        
        let lbList = "";
        const emojis = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];
        
        currentData.forEach((u, i) => {
            const pos = start + i + 1;
            const val = type === 'message' ? `${u.value.toLocaleString()} Msg` : `${(u.value / 3600000).toFixed(1)}h`;
            let line = `${pos <= 3 ? emojis[i] : `**${pos}.**`} ${u.username} — \`${val}\``;
            if (u.id === userId) line = `> **${line}** <`;
            lbList += line + "\n";
        });

        return [{
            type: 17,
            components: [
                {
                    type: 9,
                    components: [{ 
                        type: 10, 
                        content: `## Top ${type === 'message' ? 'Massage' : 'Voice'} Leaderboard\nUser: <@${userId}>\nHari: ${new Date().toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}` 
                    }],
                    accessory: { style: 2, type: 2, label: "My Rank", custom_id: `lb_rank_${type}_${page}_${snapLabel}` }
                },
                { type: 14 },
                {
                    type: 9,
                    components: [{ type: 10, content: lbList || "_No data found in this range._" }],
                    accessory: { style: 2, type: 2, label: "Top", custom_id: `lb_top_${type}_0_${snapLabel}` }
                },
                { type: 14 },
                {
                    type: 1,
                    components: [
                        { style: 2, type: 2, label: "◀◀", custom_id: `lb_prev5_${type}_${page}_${snapLabel}` },
                        { style: 2, type: 2, label: "◀", custom_id: `lb_prev1_${type}_${page}_${snapLabel}` },
                        { style: 2, type: 2, label: `${page + 1}/${totalPages}`, custom_id: "noop", disabled: true },
                        { style: 2, type: 2, label: "▶", custom_id: `lb_next1_${type}_${page}_${snapLabel}` },
                        { style: 2, type: 2, label: "▶▶", custom_id: `lb_next5_${type}_${page}_${snapLabel}` }
                    ]
                },
                { type: 14 },
                { type: 10, content: "-# © BS Community by BananaSkiee" }
            ]
        }];
    }

    // --- COMMANDS: !lb massage / !lb voice ---
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.content.startsWith('!lb')) return;
        const sub = message.content.split(' ')[1]?.toLowerCase();

        if (sub === 'massage' || sub === 'voice') {
            const type = sub === 'massage' ? 'message' : 'voice';
            const data = await getData(type, false);
            await message.reply({ components: renderLayout(type, 0, data, message.author.id, false) });
        }
    });

    // --- AUTO RESET & SNAPSHOT (Setiap Tanggal 1 Jam 00:00) ---
    cron.schedule('0 0 1 * *', async () => {
        const channel = client.channels.cache.get("1455791109446832240");
        if (!channel) return;

        const all = await db.all();
        const raw = all.filter(i => i.id.startsWith('stats_')).map(u => ({ id: u.id.split('_')[1], ...u.value }));
        await db.set(`snapshot_last_month`, raw);

        const topM = raw.sort((a,b) => (b.messages||0) - (a.messages||0))[0];
        const topV = raw.sort((a,b) => (b.voiceTime||0) - (a.voiceTime||0))[0];

        await channel.send({
            components: [{
                type: 17,
                components: [
                    {
                        type: 10,
                        content: `## Monthly Leaderboard\n**Statistik aktivitas bulan ini telah di-arsip.**\n>>> **Stats Massage:** ${topM ? `**${topM.username}** (${topM.messages} Pts)` : 'N/A'}\n**Stats Voice:** ${topV ? `**${topV.username}** (${(topV.voiceTime/3600000).toFixed(1)}h)` : 'N/A'}`
                    },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: 2, type: 2, label: "Stats Massage", custom_id: "lb_top_message_0_snapshot" },
                            { style: 2, type: 2, label: "Stats Voice", custom_id: "lb_top_voice_0_snapshot" }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: "-# © BS Community by BananaSkiee" }
                ]
            }]
        });

        for(const item of all.filter(i => i.id.startsWith('stats_'))) { await db.delete(item.id); }
    });

    // --- INTERACTION HANDLER (PAGINATION & MY RANK) ---
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() || !interaction.customId.startsWith('lb_')) return;
        
        const [_, mode, type, pageStr, snapLabel] = interaction.customId.split('_');
        const isSnapshot = snapLabel === 'snapshot';
        const data = await getData(type, isSnapshot);
        const totalPages = Math.ceil(data.length / 10) || 1;
        let page = parseInt(pageStr);

        if (mode === 'rank') {
            const pos = data.findIndex(u => u.id === interaction.user.id);
            page = pos === -1 ? 0 : Math.floor(pos / 10);
        } else if (mode === 'prev5') page = (page - 5 < 0) ? totalPages - 1 : page - 5;
        else if (mode === 'prev1') page = (page - 1 < 0) ? totalPages - 1 : page - 1;
        else if (mode === 'next1') page = (page + 1 >= totalPages) ? 0 : page + 1;
        else if (mode === 'next5') page = (page + 5 >= totalPages) ? 0 : page + 5;
        else if (mode === 'top') page = 0;

        await interaction.update({
            flags: 64, // Ephemeral
            components: renderLayout(type, page, data, interaction.user.id, isSnapshot)
        });
    });
};
