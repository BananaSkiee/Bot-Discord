const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const cron = require('node-cron');

module.exports = (client) => {
    
    // --- TRACKING SYSTEM ---
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;
        await db.add(`stats_${message.author.id}.messages`, 1);
        await db.set(`stats_${message.author.id}.username`, message.author.username);
        await db.add(`channels_${message.author.id}.${message.channel.id}`, 1);
    });

    const voiceStatus = new Map();
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (newState.member?.user.bot) return;
        if (!oldState.channelId && newState.channelId) {
            voiceStatus.set(newState.id, Date.now());
        }
        if (oldState.channelId && !newState.channelId) {
            const joinTime = voiceStatus.get(newState.id);
            if (joinTime) {
                const duration = Date.now() - joinTime;
                await db.add(`stats_${newState.id}.voiceTime`, duration);
                await db.set(`stats_${newState.id}.username`, newState.member.user.username);
                await db.add(`v_channels_${newState.id}.${oldState.channelId}`, duration);
                voiceStatus.delete(newState.id);
            }
        }
    });

    async function getSortedData(type) {
        const all = await db.all();
        return all
            .filter(i => i.id.startsWith('stats_'))
            .map(u => ({
                id: u.id.split('_')[1],
                value: type === 'message' ? (u.value.messages || 0) : (u.value.voiceTime || 0),
                username: u.value.username || 'Unknown'
            }))
            .sort((a, b) => b.value - a.value);
    }

    // --- AUTO SEND SETIAP TANGGAL 1 ---
    cron.schedule('0 0 1 * *', async () => {
        const channelId = "1352800474914623608";
        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        const topMessages = await getSortedData('message');
        const topVoice = await getSortedData('voice');

        const emojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const d = new Date();
        const period = `${months[d.getMonth() - 1 === -1 ? 11 : d.getMonth() - 1]} ${d.getFullYear()}`;

        // 1. Pesan Leaderboard (Format Mirip Gambar)
        let lbDesc = `## Top Active Unions Leaderboard\n**Period:** ${period}\n`;
        topMessages.slice(0, 10).forEach((u, i) => {
            lbDesc += `${emojis[i]}<:UC_blank:1014408826704908358>${u.username}\n<:UC_blank:1014408826704908358><:UC_blank:1014408826704908358><a:arrow:1040166758927052862>**${u.value.toLocaleString()}** Points\n`;
        });

        const lbEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(lbDesc + `\nCongratulations to the Top Active Unions! 🎉`)
            .setImage('https://kh1ev.my.id/assets/img/banner_lb.png'); // Pastikan link ini transparan

        // 2. Pesan Pengumuman (Mention Juara 1)
        const winnerChat = topMessages[0]?.id ? `<@${topMessages[0].id}>` : "None";
        const winnerVoice = topVoice[0]?.id ? `<@${topVoice[0].id}>` : "None";

        const announceText = `**Announcement TOP #1 Season #17**\n` +
        `\`[ ✦ ]\` ${d.toDateString()}\n\n` +
        `> Congratulations to ${winnerChat} for earning Top #1 on the Chat Leaderboard! Your consistency made an impact.\n\n` +
        `> Congratulations to ${winnerVoice} for achieving Top #1 on the Voice Leaderboard! Your energy made the server lively.\n\n` +
        `**Reward**\n` +
        `「 <@&1243865168941813760> 」 – **Duration Role : 1 Month**\n` +
        `「 <@&1334167347455332362> 」 – **Duration Role : 1 Month**\n\n` +
        `_https://kh1ev.my.id/_\n` +
        `**#Kh1evAlwaysWithYou.**\n@everyone`;

        await channel.send({ embeds: [lbEmbed] });
        await channel.send({ content: announceText });
        
        // Reset data untuk bulan baru
        await db.deleteAll();
    });

    // --- COMMAND !LB ---
    client.on('messageCreate', async (message) => {
        if (message.content.startsWith('!lb')) {
            const args = message.content.split(' ');
            const type = args[1] === 'voice' ? 'voice' : 'message';
            const data = await getSortedData(type);

            let desc = `## Top 10 ${type === 'voice' ? 'Voice' : 'Chat'}\n`;
            data.slice(0, 10).forEach((u, i) => {
                const val = type === 'voice' ? `${(u.value / 3600000).toFixed(1)}h` : `${u.value} msg`;
                desc += `**#${i+1}** | ${u.username} - \`${val}\` \n`;
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('check_self').setLabel('Detail Akun Saya').setStyle(ButtonStyle.Secondary)
            );

            message.reply({ embeds: [new EmbedBuilder().setDescription(desc).setColor('#2b2d31')], components: [row] });
        }
    });

    // --- INTERACTION HANDLER (DETAIL) ---
    client.on('interactionCreate', async (i) => {
        if (!i.isButton() || i.customId !== 'check_self') return;
        
        const stats = await db.get(`stats_${i.user.id}`);
        const chanData = await db.get(`channels_${i.user.id}`) || {};
        const voiceData = await db.get(`v_channels_${i.user.id}`) || {};

        const topC = Object.entries(chanData).sort((a,b) => b[1]-a[1])[0];
        const topV = Object.entries(voiceData).sort((a,b) => b[1]-a[1])[0];

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Stats: ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .addFields(
                { name: '💬 Chat', value: `\`${stats?.messages || 0}\` pesan`, inline: true },
                { name: '🎙️ Voice', value: `\`${((stats?.voiceTime || 0) / 3600000).toFixed(1)}\` jam`, inline: true },
                { name: '🏠 Base Chat', value: topC ? `<#${topC[0]}>` : 'None', inline: false },
                { name: '🔊 Base Voice', value: topV ? `<#${topV[0]}>` : 'None', inline: false }
            )
            .setColor('#2b2d31');

        await i.reply({ embeds: [embed], ephemeral: true });
    });
};
