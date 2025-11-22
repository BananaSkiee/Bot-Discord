const { ChannelType } = require('discord.js');

// ID channel forum yang diminta: 1398947109461295236
const FORUM_CHANNEL_ID = '1398947109461295236'; 

/**
 * Membuat postingan log di channel Forum ketika member baru bergabung.
 * Postingan akan berisi detail member dan timestamp.
 * * @param {import('discord.js').Client} client Discord Client.
 * @param {import('discord.js').GuildMember} member Objek GuildMember yang bergabung.
 */
async function logMemberJoin(client, member) {
    // Pastikan member dan guild tersedia
    if (!member || !member.guild) return;

    // Dapatkan channel forum dari cache guild
    const forumChannel = member.guild.channels.cache.get(FORUM_CHANNEL_ID);

    // Cek ketersediaan channel dan tipe (GuildForum = 15)
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
        console.error(`❌ LOGGING: Channel Forum dengan ID ${FORUM_CHANNEL_ID} tidak ditemukan atau bukan channel Forum.`);
        return;
    }

    // Cek izin bot untuk menghindari kegagalan API
    if (!forumChannel.permissionsFor(member.guild.members.me).has('MANAGE_THREADS')) {
        console.error(`❌ LOGGING: Bot tidak memiliki izin 'MANAGE_THREADS' di channel ${forumChannel.name}.`);
        return;
    }

    const username = member.user.tag;
    
    // Format pesan log
    const initialMessage = `
**👤 Member Baru Bergabung ke Server**
\`\`\`
User ID: ${member.id}
Username: ${username}
Akun Dibuat: ${member.user.createdAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
Waktu Bergabung: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
\`\`\``;

    try {
        // Buat post/thread baru di channel Forum
        const thread = await forumChannel.threads.create({
            name: `Log - ${username}`, // Judul thread adalah nama user
            message: {
                content: initialMessage
            },
            // Atur autoArchiveDuration untuk membersihkan post log yang sudah lama
            autoArchiveDuration: 60 * 24, // Arsip otomatis setelah 24 jam (sesuaikan jika perlu)
            reason: `Log member baru bergabung: ${username}`,
        });

        console.log(`✅ LOGGING: Log member ${username} berhasil dibuat di Forum: ${thread.name}`);

    } catch (error) {
        // Tangani rate limit atau error pembuatan thread lainnya
        console.error(`❌ LOGGING: Error saat membuat log Forum untuk ${username}:`, error.message);
    }
}

module.exports = {
    logMemberJoin,
    FORUM_CHANNEL_ID
};
