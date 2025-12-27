const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const cron = require('node-cron');

module.exports = (client) => {
    
    // --- TRACKING SYSTEM ---
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;
        // Tambah poin chat (1 pesan = 1 poin atau hitung kata)
        await db.add(`stats_${message.author.id}.messages`, 1);
        await db.set(`stats_${message.author.id}.username`, message.author.username);
        // Track channel tersering
        await db.add(`channels_${message.author.id}.${message.channel.id}`, 1);
    });

    const voiceStatus = new Map();
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (newState.member.user.bot) return;

        // User Join Voice
        if (!oldState.channelId && newState.channelId) {
            voiceStatus.set(newState.id, Date.now());
        }
        // User Leave Voice
        if (oldState.channelId && !newState.channelId) {
            const joinTime = voiceStatus.get(newState.id);
            if (joinTime) {
                const duration = Date.now() - joinTime;
                await db.add(`stats_${newState.id}.voiceTime`, duration);
                await db.set(`stats_${newState.id}.username`, newState.member.user.username);
                // Track voice channel tersering
                await db.add(`v_channels_${newState.id}.${oldState.channelId}`, duration);
                voiceStatus.delete(newState.id);
            }
        }
    });

    // --- FUNCTION GEN LEADERBOARD ---
    async function getLeaderboard(type) {
        const allStats = await db.all();
        const userData = allStats.filter(i => i.id.startsWith('stats_'));
        
        let sorted = userData.map(u => ({
            id: u.id.split('_')[1],
            value: type === 'message' ? (u.value.messages || 0) : (u.value.voiceTime || 0),
            username: u.value.username || 'Unknown'
        })).sort((a, b) => b.value - a.value).slice(0, 10);

        return sorted;
    }

    // --- AUTO SEND BULANAN (Setiap Tanggal 1 Jam 00:00) ---
    cron.schedule('0 0 1 * *', async () => {
        const channelId = "1352800474914623608";
        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        const msgLB = await getLeaderboard('message');
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const lastMonth = monthNames[new Date().getMonth() - 1 === -1 ? 11 : new Date().getMonth() - 1];

        let description = `## Top Active Unions Leaderboard\n**Period:** ${lastMonth} 2025\n`;
        const emojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

        msgLB.forEach((user, index) => {
            description += `${emojis[index]}<:UC_blank:1014408826704908358>${user.username}\n<:UC_blank:1014408826704908358><:UC_blank:1014408826704908358><a:arrow:1040166758927052862>**${user.value.toLocaleString()}** Points\n`;
        });

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setDescription(description + `\nCongratulations to the Top Active Unions! 🎉`)
            .setImage('https://kh1ev.my.id/assets/img/banner_lb.png'); // Ganti link banner transparanmu

        await channel.send({ content: "@everyone", embeds: [embed] });
        // Reset DB setelah sebulan jika ingin fresh start
        // await db.clear(); 
    });

    // --- COMMAND HANDLER ---
    client.on('messageCreate', async (message) => {
        if (message.content.startsWith('!lb')) {
            const args = message.content.split(' ');
            const type = args[1] === 'voice' ? 'voice' : 'message';
            
            const data = await getLeaderboard(type);
            let desc = `## Top Active ${type === 'voice' ? 'Voice' : 'Chat'} Leaderboard\n`;
            
            data.forEach((u, i) => {
                const val = type === 'voice' ? `${(u.value / 3600000).toFixed(1)} Hours` : `${u.value} Messages`;
                desc += `**#${i+1}** | ${u.username} - \`${val}\` \n`;
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('check_stats')
                    .setLabel('Cek Statistik Saya')
                    .setStyle(ButtonStyle.Primary)
            );

            message.reply({ embeds: [new EmbedBuilder().setDescription(desc).setColor('Yellow')], components: [row] });
        }
    });

    // --- BUTTON INTERACTION (DETAIL AKUN) ---
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId === 'check_stats') {
            const stats = await db.get(`stats_${interaction.user.id}`);
            const channels = await db.get(`channels_${interaction.user.id}`) || {};
            const vChannels = await db.get(`v_channels_${interaction.user.id}`) || {};

            // Cari channel paling rame
            const topChan = Object.entries(channels).sort((a,b) => b[1]-a[1])[0];
            const topVoice = Object.entries(vChannels).sort((a,b) => b[1]-a[1])[0];

            const detailEmbed = new EmbedBuilder()
                .setTitle(`Statistik Pribadi - ${interaction.user.username}`)
                .addFields(
                    { name: '💬 Total Chat', value: `${stats?.messages || 0} pesan`, inline: true },
                    { name: '🎙️ Total Voice', value: `${((stats?.voiceTime || 0) / 3600000).toFixed(2)} jam`, inline: true },
                    { name: '📍 Channel Teraktif', value: topChan ? `<#${topChan[0]}>` : 'N/A', inline: false },
                    { name: '🔊 Voice Teraktif', value: topVoice ? `<#${topVoice[0]}>` : 'N/A', inline: false }
                )
                .setColor('Random')
                .setThumbnail(interaction.user.displayAvatarURL());

            await interaction.reply({ embeds: [detailEmbed], ephemeral: true });
        }
    });
};
