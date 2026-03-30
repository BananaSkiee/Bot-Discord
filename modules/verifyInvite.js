const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        channelId: '1487876516971806730', // Channel khusus verifikasi
        roleId: '1444248590305202247',    // Role yang didapat
        inviteTrackerId: '409814402663448577' // ID Bot Invite Tracker
    },

    async handleVerify(message) {
        const { channelId, roleId, inviteTrackerId } = this.config;

        // Cek apakah di channel & command yang benar
        if (message.channel.id !== channelId) return;
        if (message.content.toLowerCase() !== 'bs!verify invite') return;

        await message.reply("⏳ Sedang mengecek data invite kamu... Mohon tunggu balasan dari Invite Tracker.");

        // Collector untuk menangkap pesan dari Invite Tracker
        // Filter: Pengirim harus bot Invite Tracker & pesan mengandung mention user
        const filter = m => m.author.id === inviteTrackerId && m.mentions.users.has(message.author.id);
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async (inviteMsg) => {
            // Ambil angka dari teks "Uses: X" dan "Fake: X"
            const usesMatch = inviteMsg.content.match(/Uses:\s*(\d+)/);
            const fakeMatch = inviteMsg.content.match(/Fake:\s*(\d+)/);

            const uses = usesMatch ? parseInt(usesMatch[1]) : 0;
            const fake = fakeMatch ? parseInt(fakeMatch[1]) : 0;

            // LOGIKA VERIFIKASI
            if (uses >= 1 && fake === 0) {
                const role = message.guild.roles.cache.get(roleId);
                
                if (message.member.roles.cache.has(roleId)) {
                    return message.reply("Kamu sudah terverifikasi sebelumnya!");
                }

                try {
                    await message.member.roles.add(role);
                    const embedSuccess = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Verifikasi Berhasil')
                        .setDescription(`Akun kamu asli (umur > 30 hari). Kamu telah mengundang **${uses}** orang. Role diberikan!`)
                        .setTimestamp();
                    
                    message.reply({ embeds: [embedSuccess] });
                } catch (err) {
                    message.reply("Gagal memberikan role. Pastikan role bot saya lebih tinggi!");
                }
            } else if (fake > 0) {
                message.reply(`❌ **Verifikasi Gagal!** Terdeteksi **${fake} akun Fake** (akun baru < 30 hari). Gunakan akun asli!`);
            } else {
                message.reply("❌ **Gagal!** Kamu belum mengundang minimal 1 user asli ke server ini.");
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.reply("❌ Waktu habis! Invite Tracker tidak merespon. Pastikan bot tersebut online.");
            }
        });
    }
};
