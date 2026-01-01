const { QuickDB } = require("quick.db");
const db = new QuickDB();
const cron = require('node-cron');

module.exports = (client) => {

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

    // --- DATA FETCH ENGINE ---
    async function fetchAllData(type) {
        const guild = client.guilds.cache.first(); // Ambil server utama bot
        if (!guild) return [];
        
        await guild.members.fetch(); // Pastikan cache member terbaru
        const allStats = await db.all();
        
        return guild.members.cache.map(m => {
            const stat = allStats.find(s => s.id === `stats_${m.id}`)?.value || {};
            return {
                id: m.id,
                username: m.user.username,
                val: type === 'message' ? (stat.messages || 0) : (stat.voiceTime || 0)
            };
        }).sort((a, b) => b.val - a.val);
    }

    // --- UI BUILDER V2 ---
    function buildMainUI(topM, topV) {
        return {
            components: [{
                type: 17,
                components: [
                    {
                        type: 10,
                        content: `## BananaSkiee Activity Center\n**Pantau keaktifan warga BS di sini:**\n>>> **Stats Massage:** @${topM?.username || 'None'} — \`${topM?.val || 0} Msg\`\n**Stats Voice:** @${topV?.username || 'None'} — \`${((topV?.val || 0)/3600000).toFixed(1)}h\``
                    },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: 2, type: 2, label: "Stats Massage", custom_id: "lb_top_message_0_live" },
                            { style: 2, type: 2, label: "Stats Voice", custom_id: "lb_top_voice_0_live" }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: "-# © BS Community by BananaSkiee" }
                ]
            }]
        };
    }

    function buildDetailUI(type, page, data, userId) {
        const totalP = Math.ceil(data.length / 10) || 1;
        const current = data.slice(page * 10, (page * 10) + 10);
        const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let list = "";
        const emj = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];
        
        current.forEach((u, i) => {
            const pos = (page * 10) + i + 1;
            const score = type === 'message' ? `${u.val} Msg` : `${(u.val / 3600000).toFixed(1)}h`;
            let txt = `${pos <= 3 ? emj[i] : `**${pos}.**`} @${u.username} — \`${score}\``;
            if (u.id === userId) txt = `> **${txt}** <`;
            list += txt + "\n";
        });

        return {
            components: [{
                type: 17,
                components: [
                    {
                        type: 9,
                        components: [{ type: 10, content: `## Top ${type === 'message' ? 'Massage' : 'Voice'} Leaderboard\nUser: <@${userId}>\nTanggal: ${now}` }],
                        accessory: { style: 2, type: 2, label: "My Rank", custom_id: `lb_rank_${type}_${page}_live` }
                    },
                    { type: 14 },
                    {
                        type: 9,
                        components: [{ type: 10, content: list || "Kosong." }],
                        accessory: { style: 2, type: 2, label: "Top", custom_id: `lb_top_${type}_0_live` }
                    },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: 2, type: 2, label: "<<", custom_id: `lb_p5_${type}_${page}_live` },
                            { style: 2, type: 2, label: "<", custom_id: `lb_p1_${type}_${page}_live` },
                            { style: 2, type: 2, label: `${page + 1}/${totalP}`, custom_id: "none", disabled: true },
                            { style: 2, type: 2, label: ">", custom_id: `lb_n1_${type}_${page}_live` },
                            { style: 2, type: 2, label: ">>", custom_id: `lb_n5_${type}_${page}_live` }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: "-# © BS Community by BananaSkiee" }
                ]
            }]
        };
    }

    // --- HANDLER COMMAND !LB ---
    client.on('messageCreate', async (msg) => {
        if (msg.author.bot || msg.content !== '!lb') return;
        
        const dataM = await fetchAllData('message');
        const dataV = await fetchAllData('voice');

        // Pake REST post biar support Type 17
        await client.rest.post(`/channels/${msg.channel.id}/messages`, {
            body: buildMainUI(dataM[0], dataV[0])
        }).catch(e => console.error("ERR !lb:", e));
    });

    // --- INTERACTION HANDLER ---
    client.on('interactionCreate', async (i) => {
        if (!i.isButton() || !i.customId.startsWith('lb_')) return;
        
        const [_, mode, type, pStr] = i.customId.split('_');
        const data = await fetchAllData(type);
        const totalP = Math.ceil(data.length / 10) || 1;
        let p = parseInt(pStr);

        if (mode === 'rank') {
            const pos = data.findIndex(u => u.id === i.user.id);
            p = pos === -1 ? 0 : Math.floor(pos / 10);
        } else if (mode === 'p5') p = (p - 5 < 0) ? totalP - 1 : p - 5;
        else if (mode === 'p1') p = (p - 1 < 0) ? totalP - 1 : p - 1;
        else if (mode === 'n1') p = (p + 1 >= totalP) ? 0 : p + 1;
        else if (mode === 'n5') p = (p + 5 >= totalP) ? 0 : p + 5;
        else if (mode === 'top') p = 0;

        await i.update(buildDetailUI(type, p, data, i.user.id)).catch(() => {});
    });
};
