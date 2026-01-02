const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = (client) => {
    client.setMaxListeners(25);

    // --- TRACKING ENGINE ---
    client.on('messageCreate', async (m) => {
        if (m.author.bot || !m.guild) return;
        await db.set(`stats_${m.author.id}.username`, m.author.username);
        await db.add(`stats_${m.author.id}.messages`, 1);
    });

    const vStates = new Map();
    client.on('voiceStateUpdate', async (oldS, newS) => {
        if (newS.member?.user.bot) return;
        if (!oldS.channelId && newS.channelId) vStates.set(newS.id, Date.now());
        if (oldS.channelId && !newS.channelId) {
            const start = vStates.get(newS.id);
            if (start) {
                const diff = Date.now() - start;
                await db.set(`stats_${newS.id}.username`, newS.member.user.username);
                await db.add(`stats_${newS.id}.voiceTime`, diff);
                vStates.delete(newS.id);
            }
        }
    });

    // --- DATA FETCH ---
    async function fetchAllData(type) {
        const all = await db.all();
        let data = all.filter(i => i.id.startsWith('stats_')).map(u => ({
            id: u.id.split('_')[1],
            username: u.value.username || 'Unknown',
            val: type === 'message' ? (u.value.messages || 0) : (u.value.voiceTime || 0)
        }));
        return data.sort((a, b) => b.val - a.val);
    }

    // --- UI BUILDER (COMPONENT V2 WITH EMBED) ---
    function buildMainUI(topM, topV) {
        return {
            body: {
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 10, // Section text
                            content: `## BananaSkiee Activity Center\n**Pantau keaktifan warga BS di sini:**\n>>> **Stats Massage:** @${topM?.username || 'None'} — \`${topM?.val || 0} Msg\`\n**Stats Voice:** @${topV?.username || 'None'} — \`${((topV?.val || 0)/3600000).toFixed(1)}h\``
                        },
                        { type: 14 }, // Divider
                        {
                            type: 1, // Action Row (Wajib type 1 di dalam type 17)
                            components: [
                                { style: 2, type: 2, label: "Stats Massage", custom_id: "lb_show_message" },
                                { style: 2, type: 2, label: "Stats Voice", custom_id: "lb_show_voice" }
                            ]
                        },
                        { type: 14 },
                        { type: 10, content: "-# © BS Community by BananaSkiee" }
                    ]
                }]
            }
        };
    }

    function buildDetailUI(type, page, data, userId) {
        const totalP = Math.ceil(data.length / 10) || 1;
        const startIdx = page * 10;
        const current = data.slice(startIdx, startIdx + 10);
        const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let list = "";
        const emj = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];
        
        for(let i=0; i<10; i++) {
            const u = current[i];
            const pos = startIdx + i + 1;
            if (u) {
                const score = type === 'message' ? `${u.val} Msg` : `${(u.val / 3600000).toFixed(1)}h`;
                let line = `${pos <= 3 ? emj[i] : `**${pos}.**`} @${u.username} — \`${score}\``;
                if (u.id === userId) line = `> **${line}** <`;
                list += line + "\n";
            } else {
                list += `${pos <= 3 ? emj[i] : `**${pos}.**`} _None_\n`;
            }
        }

        return {
            components: [{
                type: 17,
                components: [
                    {
                        type: 1, // Embed Section (Menggunakan Action Row sebagai container)
                        components: [{
                            type: 10,
                            content: `## Top ${type === 'message' ? 'Massage' : 'Voice'} Leaderboard\nUser: <@${userId}>\nTanggal: ${now}`
                        }],
                        accessory: { style: 2, type: 2, label: "My Rank", custom_id: `lb_rank_${type}_${page}` }
                    },
                    { type: 14 },
                    {
                        type: 1, // List Section
                        components: [{ type: 10, content: list }],
                        accessory: { style: 2, type: 2, label: "Top", custom_id: `lb_top_${type}_0` }
                    },
                    { type: 14 },
                    {
                        type: 1, // Navigation Section
                        components: [
                            { style: 2, type: 2, label: "<<", custom_id: `lb_p5_${type}_${page}` },
                            { style: 2, type: 2, label: "<", custom_id: `lb_p1_${type}_${page}` },
                            { style: 2, type: 2, label: `${page + 1}/${totalP}`, custom_id: "none", disabled: true },
                            { style: 2, type: 2, label: ">", custom_id: `lb_n1_${type}_${page}` },
                            { style: 2, type: 2, label: ">>", custom_id: `lb_n5_${type}_${page}` }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: "-# © BS Community by BananaSkiee" }
                ]
            }]
        };
    }

    // --- HANDLER ---
    client.on('messageCreate', async (msg) => {
        if (msg.author.bot || msg.content.toLowerCase() !== '!lb') return;
        try {
            const dataM = await fetchAllData('message');
            const dataV = await fetchAllData('voice');
            await client.rest.post(`/channels/${msg.channel.id}/messages`, buildMainUI(dataM[0], dataV[0]));
        } catch (e) { console.error("ERR !lb:", e); }
    });

    client.on('interactionCreate', async (i) => {
        if (!i.isButton() || !i.customId.startsWith('lb_')) return;
        try {
            const parts = i.customId.split('_');
            const mode = parts[1];
            const type = parts[2] || (mode === 'show' ? (parts[3] || 'message') : 'message');
            const data = await fetchAllData(type);
            const totalP = Math.ceil(data.length / 10) || 1;
            let p = parseInt(parts[3]) || 0;

            if (mode === 'show') {
                const newType = parts[2]; // lb_show_message -> parts[2] = message
                const newData = await fetchAllData(newType);
                return await i.update(buildDetailUI(newType, 0, newData, i.user.id));
            }

            if (mode === 'rank') {
                const pos = data.findIndex(u => u.id === i.user.id);
                p = pos === -1 ? 0 : Math.floor(pos / 10);
            } 
            else if (mode === 'p5') p = Math.max(0, p - 5);
            else if (mode === 'p1') p = Math.max(0, p - 1);
            else if (mode === 'n1') p = Math.min(totalP - 1, p + 1);
            else if (mode === 'n5') p = Math.min(totalP - 1, p + 5);
            else if (mode === 'top') p = 0;

            await i.update(buildDetailUI(type, p, data, i.user.id));
        } catch (e) { console.error("ERR interaction:", e); }
    });
};
