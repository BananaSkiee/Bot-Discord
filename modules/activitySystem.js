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

    // --- CORE DATA FETCH (NO PING) ---
    async function fetchLB(type, isSnap) {
        let raw;
        if (isSnap) {
            raw = await db.get(`snapshot_last_month`) || [];
        } else {
            const all = await db.all();
            raw = all.filter(i => i.id.startsWith('stats_')).map(u => ({
                id: u.id.split('_')[1],
                username: u.value.username || 'Unknown',
                messages: u.value.messages || 0,
                voiceTime: u.value.voiceTime || 0
            }));
        }

        return raw.map(u => ({
            id: u.id,
            name: u.username || 'None',
            val: type === 'message' ? (u.messages || 0) : (u.voiceTime || 0)
        })).sort((a, b) => b.val - a.val);
    }

    // --- UI RENDERER (RAW JSON FOR V2 SUPPORT) ---
    function renderV2(type, page, data, userId, isSnap) {
        const totalP = Math.ceil(data.length / 10) || 1;
        const start = page * 10;
        const current = data.slice(start, start + 10);
        const tagMode = isSnap ? "snapshot" : "live";
        
        let list = "";
        const emojis = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];
        
        // Render 10 user atau isi dengan None jika kosong
        for (let i = 0; i < 10; i++) {
            const u = current[i];
            const pos = start + i + 1;
            if (u && u.val > 0) {
                const score = type === 'message' ? `${u.val.toLocaleString()} Msg` : `${(u.val / 3600000).toFixed(1)}h`;
                // Pake @username (teks biasa), bukan <@id> supaya gak ngetag
                let line = `${pos <= 3 ? emojis[i] : `**${pos}.**`} @${u.name} — \`${score}\``;
                if (u.id === userId) line = `> **${line}** <`;
                list += line + "\n";
            } else {
                list += `${pos <= 3 ? emojis[i] : `**${pos}.**`} _None_\n`;
            }
        }

        // Return Raw Component Object (Bypass D.JS Limitations)
        return {
            flags: 64, 
            components: [{
                type: 17,
                components: [
                    {
                        type: 9,
                        components: [{ type: 10, content: `## ${type === 'message' ? 'Massage' : 'Voice'} Leaderboard\nUser: <@${userId}>\nStatus: **${isSnap ? 'Arsip Bulan Lalu' : 'Real-time'}**` }],
                        accessory: { style: 2, type: 2, label: "My Rank", custom_id: `lb_rank_${type}_${page}_${tagMode}` }
                    },
                    { type: 14 },
                    {
                        type: 9,
                        components: [{ type: 10, content: list }],
                        accessory: { style: 2, type: 2, label: "Top", custom_id: `lb_top_${type}_0_${tagMode}` }
                    },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { style: 2, type: 2, label: "◀◀", custom_id: `lb_p5_${type}_${page}_${tagMode}` },
                            { style: 2, type: 2, label: "◀", custom_id: `lb_p1_${type}_${page}_${tagMode}` },
                            { style: 2, type: 2, label: `${page + 1}/${totalP}`, custom_id: "none", disabled: true },
                            { style: 2, type: 2, label: "▶", custom_id: `lb_n1_${type}_${page}_${tagMode}` },
                            { style: 2, type: 2, label: "▶▶", custom_id: `lb_n5_${type}_${page}_${tagMode}` }
                        ]
                    },
                    { type: 14 },
                    { type: 10, content: "-# © BS Community by BananaSkiee" }
                ]
            }]
        };
    }

    // --- COMMAND HANDLER ---
    client.on('messageCreate', async (msg) => {
        if (msg.author.bot || !msg.content.startsWith('!lb')) return;
        const arg = msg.content.split(' ')[1]?.toLowerCase();
        if (arg === 'massage' || arg === 'voice') {
            const type = arg === 'massage' ? 'message' : 'voice';
            const data = await fetchLB(type, false);
            // Gunakan API mentah untuk mengirim komponen v2
            await client.rest.post(`/channels/${msg.channel.id}/messages`, {
                body: { 
                    ...renderV2(type, 0, data, msg.author.id, false),
                    message_reference: { message_id: msg.id }
                }
            }).catch(err => console.error("Gagal kirim LB V2:", err));
        }
    });

    // --- INTERACTION HANDLER ---
    client.on('interactionCreate', async (i) => {
        if (!i.isButton() || !i.customId.startsWith('lb_')) return;
        const [_, mode, type, pStr, tag] = i.customId.split('_');
        const isSnap = tag === 'snapshot';
        const data = await fetchLB(type, isSnap);
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

        // Update interaction menggunakan API mentah supaya v2 jalan
        await i.update(renderV2(type, p, data, i.user.id, isSnap)).catch(() => {});
    });

    // --- AUTO SEND (TANGGAL 1) ---
    cron.schedule('0 0 1 * *', async () => {
        const chan = client.channels.cache.get("1455791109446832240");
        if (!chan) return;

        const all = await db.all();
        const raw = all.filter(i => i.id.startsWith('stats_')).map(u => ({ id: u.id.split('_')[1], ...u.value }));
        await db.set(`snapshot_last_month`, raw);

        const topM = raw.sort((a,b) => (b.messages||0) - (a.messages||0))[0];
        const topV = raw.sort((a,b) => (b.voiceTime||0) - (a.voiceTime||0))[0];

        await client.rest.post(`/channels/${chan.id}/messages`, {
            body: {
                content: "@everyone",
                components: [{
                    type: 17,
                    components: [
                        { type: 10, content: `## Monthly Leaderboard Results\n>>> **Top Massage:** ${topM ? `@${topM.username}` : 'None'}\n**Top Voice:** ${topV ? `@${topV.username}` : 'None'}` },
                        { type: 14 },
                        { type: 1, components: [
                            { style: 2, type: 2, label: "Stats Massage", custom_id: "lb_top_message_0_snapshot" },
                            { style: 2, type: 2, label: "Stats Voice", custom_id: "lb_top_voice_0_snapshot" }
                        ]}
                    ]
                }]
            }
        });

        const keys = all.filter(i => i.id.startsWith('stats_')).map(i => i.id);
        for(const k of keys) await db.delete(k);
    });
};
