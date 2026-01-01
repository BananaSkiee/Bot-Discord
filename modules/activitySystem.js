const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

    // --- UI RENDERER (PROFESSIONAL EMBED) ---
    function renderLB(type, page, data, userId, isSnap) {
        const totalP = Math.ceil(data.length / 10) || 1;
        const start = page * 10;
        const current = data.slice(start, start + 10);
        const tagMode = isSnap ? "snapshot" : "live";
        
        let list = "";
        const emojis = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];
        
        for (let i = 0; i < 10; i++) {
            const u = current[i];
            const pos = start + i + 1;
            if (u && u.val > 0) {
                const score = type === 'message' ? `${u.val.toLocaleString()} Msg` : `${(u.val / 3600000).toFixed(1)}h`;
                let line = `${pos <= 3 ? emojis[i] : `**${pos}.**`} **@${u.name}** — \`${score}\``;
                if (u.id === userId) line = `> ${line} <`;
                list += line + "\n";
            } else {
                list += `${pos <= 3 ? emojis[i] : `**${pos}.**`} _None_\n`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 ${type === 'message' ? 'Massage' : 'Voice'} Leaderboard`)
            .setDescription(`**Status:** ${isSnap ? '📁 Arsip Bulan Lalu' : '🟢 Real-time'}\n\n${list}`)
            .setColor(isSnap ? '#5865F2' : '#FEE75C')
            .setFooter({ text: `Halaman ${page + 1}/${totalP} • © BS Community` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`lb_p5_${type}_${page}_${tagMode}`).setLabel('◀◀').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`lb_p1_${type}_${page}_${tagMode}`).setLabel('◀').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`lb_rank_${type}_${page}_${tagMode}`).setLabel('My Rank').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`lb_n1_${type}_${page}_${tagMode}`).setLabel('▶').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`lb_n5_${type}_${page}_${tagMode}`).setLabel('▶▶').setStyle(ButtonStyle.Secondary)
        );

        return { embeds: [embed], components: [row], fetchReply: true };
    }

    // --- COMMAND HANDLER ---
    client.on('messageCreate', async (msg) => {
        if (msg.author.bot || !msg.content.startsWith('!lb')) return;
        const arg = msg.content.split(' ')[1]?.toLowerCase();
        
        if (arg === 'massage' || arg === 'voice') {
            const type = arg === 'massage' ? 'message' : 'voice';
            const data = await fetchLB(type, false);
            await msg.reply(renderLB(type, 0, data, msg.author.id, false));
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

        await i.update(renderLB(type, p, data, i.user.id, isSnap)).catch(() => {});
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

        const embed = new EmbedBuilder()
            .setTitle('📅 Rekap Leaderboard Bulanan')
            .setDescription(`Aktivitas bulan ini telah direset! Berikut adalah juaranya:\n\n🏆 **Top Massage:** @${topM?.username || 'None'}\n🏆 **Top Voice:** @${topV?.username || 'None'}`)
            .setColor('#2F3136')
            .setFooter({ text: 'Klik tombol di bawah untuk detail arsip' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`lb_top_message_0_snapshot`).setLabel('Detail Massage').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`lb_top_voice_0_snapshot`).setLabel('Detail Voice').setStyle(ButtonStyle.Success)
        );

        await chan.send({ content: "@everyone", embeds: [embed], components: [row] });

        const keys = all.filter(i => i.id.startsWith('stats_')).map(i => i.id);
        for(const k of keys) await db.delete(k);
    });
};
