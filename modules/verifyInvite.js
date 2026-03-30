const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    const config = {
        channelId: '1487876516971806730', // Channel verifikasi
        roleId: '1444248590305202247',    // Role reward
        inviteTrackerId: '409814402663448577' // ID Bot Invite Tracker
    };

    client.on('messageCreate', async (message) => {
        if (message.author.bot || message.channel.id !== config.channelId) return;

        if (message.content.toLowerCase() === 'bs!verify invite') {
            // 1. Trigger bot Invite Tracker untuk keluarin data
            // Gunakan command info invite (biasanya !invites atau /invites)
            await message.channel.send(`!invites <@${message.author.id}>`);

            // 2. Buat kolektor untuk baca jawaban dari Invite Tracker
            const filter = m => m.author.id === config.inviteTrackerId && m.content.includes(message.author.id);
            const collector = message.channel.createMessageCollector({ filter, time: 10000, max: 1 });

            collector.on('collect', async (inviteMsg) => {
                // Ambil data dari teks Invite Tracker menggunakan Regex
                const fakeMatch = inviteMsg.content.match(/Fake:\s*(\d+)/);
                const usesMatch = inviteMsg.content.match(/Uses:\s*(\d+)/);
                const totalMatch = inviteMsg.content.match(/Total:\s*(\d+)/);

                const fake = fakeMatch ? parseInt(fakeMatch[1]) : 0;
                const uses = usesMatch ? parseInt(usesMatch[1]) : 0;
                const total = totalMatch ? parseInt(totalMatch[1]) : 0;

                // 3. Buat Embed Jawaban
                const embed = new EmbedBuilder()
                    .setTitle("🔍 Hasil Pengecekan Invite")
                    .setColor(uses >= 1 && fake === 0 ? "#00FF00" : "#FF0000")
                    .setDescription(`Halo <@${message.author.id}>, berikut statistik invite kamu:`)
                    .addFields(
                        { name: '✅ Real Uses (Akun > 30 hari)', value: `${uses}`, inline: true },
                        { name: '⚠️ Fake (Akun Baru/Bot)', value: `${fake}`, inline: true },
                        { name: '📊 Total Join', value: `${total}`, inline: true }
                    )
                    .setFooter({ text: "Syarat: Minimal 1 Real Use & 0 Fake" });

                // 4. Logika Pemberian Role
                if (uses >= 1 && fake === 0) {
                    const role = message.guild.roles.cache.get(config.roleId);
                    if (message.member.roles.cache.has(config.roleId)) {
                        embed.addFields({ name: "Status", value: "✅ Kamu sudah punya role ini." });
                    } else {
                        await message.member.roles.add(role);
                        embed.addFields({ name: "Status", value: "✅ Verifikasi Berhasil! Role diberikan." });
                    }
                } else {
                    embed.addFields({ name: "Status", value: "❌ Verifikasi Gagal! Pastikan tidak ada akun Fake (baru) yang join lewat link kamu." });
                }

                message.reply({ embeds: [embed] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    message.reply("❌ Invite Tracker tidak merespon. Pastikan bot Invite Tracker online dan prefix-nya benar.");
                }
            });
        }
    });
};
