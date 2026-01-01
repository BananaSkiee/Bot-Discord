const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

    // --- FETCH DATA ---
    async function fetchAllData(type) {
        const all = await db.all();
        let data = all.filter(i => i.id.startsWith('stats_')).map(u => ({
            id: u.id.split('_')[1],
            username: u.value.username || 'Unknown member',
            val: type === 'message' ? (u.value.messages || 0) : (u.value.voiceTime || 0)
        }));
        return data.sort((a, b) => b.val - a.val);
    }

    // --- UI RENDERER (Pake Embed biar support semua device/versi) ---
    function renderMain(topM, topV) {
        const embed = new EmbedBuilder()
            .setTitle('## BananaSkiee Activity Center')
            .setDescription(`**Pantau keaktifan warga BS di sini:**\n\n>>> **Stats Massage:** @${topM?.username || 'None'} — \`${topM?.val || 0} Msg\`\n**Stats Voice:** @${topV?.username || 'None'} — \`${((topV?.val || 0)/3600000).toFixed(1)}h\``)
            .setColor('#FEE75C')
            .setFooter({ text: '© BS Community by BananaSkiee' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('lb_show_message_0').setLabel('Stats Massage').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('lb_show_voice_0').setLabel('Stats Voice').setStyle(ButtonStyle.Secondary)
        );

        return { embeds: [embed], components: [row] };
    }

    function renderDetail(type, page, data, userId) {
        const totalP = Math.ceil(data.length / 10) || 1;
        const start = page * 10;
        const current = data.slice(start, start + 10);
        const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let list = "";
        const emj = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];
        
        for (let i = 0; i < 10; i++) {
            const u = current[i];
            const pos = start + i + 1;
            if (u) {
                const score = type === 'message' ? `${u.val} Msg` : `${(u.val / 3600000).toFixed(1)}h`;
                let line = `${pos <= 3 ? emj[i] : `**${pos}.**`} @${u.username} — \`${score}\``;
                if (u.id === userId) line = `> **${line}** <`;
                list += line + "\n";
            } else {
                list += `${pos <= 3 ? emj[i] : `**${pos}.**`} _None_\n`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`## Top ${type === 'message' ? 'Massage' : 'Voice'} Leaderboard`)
            .setDescription(`**User:** <@${userId}>\n**Tanggal:** ${now}\n\n${list}`)
            .setColor('#5865F2')
            .setFooter({ text: `Halaman ${page + 1}/${totalP} • © BS Community` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`lb_p1_${type}_${page}`).setLabel('<').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`lb_rank_${type}_${page}`).setLabel('My Rank').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`lb_top_${type}_0`).setLabel('Top').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`lb_n1_${type}_${page}`).setLabel('>').setStyle(ButtonStyle.Secondary)
        );

        return { embeds: [embed], components: [row] };
    }

    // --- COMMAND ---
    client.on('messageCreate', async (msg) => {
        if (msg.author.bot || msg.content.toLowerCase() !== '!lb') return;
        const dataM = await fetchAllData('message');
        const dataV = await fetchAllData('voice');
        await msg.reply(renderMain(dataM[0], dataV[0])).catch(() => {});
    });

    // --- BUTTONS ---
    client.on('interactionCreate', async (i) => {
        if (!i.isButton() || !i.customId.startsWith('lb_')) return;
        const [_, mode, type, pStr] = i.customId.split('_');
        const data = await fetchAllData(type);
        const totalP = Math.ceil(data.length / 10) || 1;
        let p = parseInt(pStr) || 0;

        if (mode === 'show') p = 0;
        else if (mode === 'rank') {
            const pos = data.findIndex(u => u.id === i.user.id);
            p = pos === -1 ? 0 : Math.floor(pos / 10);
        }
        else if (mode === 'p1') p = (p - 1 < 0) ? totalP - 1 : p - 1;
        else if (mode === 'n1') p = (p + 1 >= totalP) ? 0 : p + 1;
        else if (mode === 'top') p = 0;

        await i.update(renderDetail(type, p, data, i.user.id)).catch(() => {});
    });
};
