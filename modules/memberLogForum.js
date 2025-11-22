const { ChannelType, EmbedBuilder } = require('discord.js');
const { createPOVEmbed, ROLE_ID_KEMBALI } = require('./storyPOV'); // Import logika POV

// ID channel forum yang diminta: 1398947109461295236
const FORUM_CHANNEL_ID = '1398947109461295236'; 

/**
 * Format string yang digunakan untuk mencari thread log member.
 * Kami menggunakan ID untuk memastikan thread unik per member.
 */
const THREAD_NAME_PREFIX = 'Log - ';

/**
 * Mencari thread log yang sudah ada berdasarkan member ID.
 * @param {import('discord.js').GuildChannel} forumChannel Channel Forum.
 * @param {string} memberId ID member yang dicari.
 * @returns {Promise<import('discord.js').ThreadChannel | null>} Thread log yang ditemukan.
 */
async function findMemberLogThread(forumChannel, memberId) {
    // 1. Cek thread aktif dan diarsipkan (untuk log yang sudah lama)
    const activeThreads = await forumChannel.threads.fetchActive().catch(() => ({ threads: new Map() }));
    const archivedThreads = await forumChannel.threads.fetchArchived().catch(() => ({ threads: new Map() }));

    const allThreads = new Collection()
        .concat(activeThreads.threads, archivedThreads.threads);
    
    // 2. Cari thread dengan nama yang cocok (Log - <memberId>)
    const targetThread = allThreads.find(t => t.name === `${THREAD_NAME_PREFIX}${memberId}`);
    
    return targetThread || null;
}

/**
 * Membuat post log baru atau memperbarui yang sudah ada ketika member bergabung/keluar/menggunakan CMD.
 * @param {import('discord.js').Client} client Discord Client.
 * @param {import('discord.js').GuildMember} member Objek GuildMember.
 * @param {('JOIN'|'LEAVE'|'POV')} type Tipe log.
 * @param {string} [povCommand] Perintah POV jika type adalah 'POV'.
 */
async function updateMemberLog(client, member, type, povCommand = null) {
    if (!member || !member.guild) return;

    const forumChannel = member.guild.channels.cache.get(FORUM_CHANNEL_ID);
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
        console.error(`❌ LOGGING: Channel Forum ID ${FORUM_CHANNEL_ID} tidak ditemukan atau salah tipe.`);
        return;
    }

    const threadName = `${THREAD_NAME_PREFIX}${member.id}`;
    
    try {
        let thread = await findMemberLogThread(forumChannel, member.id);

        // --- 1. Jika thread belum ada dan ini adalah log JOIN, buat thread baru ---
        if (!thread && type === 'JOIN') {
            const username = member.user.tag;
            
            // CATATAN PENTING: Permission Overwrites pada thread tidak diterapkan 
            // di sini. Privacy mengandalkan pengaturan Channel Forum.
            thread = await forumChannel.threads.create({
                name: threadName, 
                message: {
                    content: `**[SYSTEM LOG]** Member **${username}** (${member.id}) log thread created.`,
                    embeds: [createJoinLogEmbed(member, 'JOIN')] // Pesan awal JOIN
                },
                reason: `Log member ${username} bergabung.`,
            });
            console.log(`✅ LOGGING: Thread log baru untuk ${username} dibuat: ${thread.name}`);
        } 
        
        // --- 2. Jika thread ditemukan atau baru dibuat, post update ---
        if (thread) {
            let messageContent = '';
            let embedsToSend = [];

            if (type === 'JOIN') {
                // Jangan kirim lagi jika ini adalah log join awal (sudah dikirim di langkah 1)
                return;
            } else if (type === 'LEAVE') {
                embedsToSend.push(createJoinLogEmbed(member, 'LEAVE'));
                messageContent = `**[SYSTEM LOG]** Member meninggalkan server.`;
            } else if (type === 'POV' && povCommand) {
                const povId = povCommand.substring(1);
                const povEmbed = createPOVEmbed(povId);
                
                if (povEmbed) {
                    embedsToSend.push(povEmbed);
                    messageContent = `**[COMMAND LOG]** User menggunakan \`${povCommand}\` untuk mengubah POV.`;
                    
                    // --- Penugasan Role (Hanya pada CMD !3) ---
                    if (povId === '3') {
                        messageContent += `\n**[AKSI BOT]** Mencoba menambahkan Role ID \`${ROLE_ID_KEMBALI}\`.`;
                        await member.roles.add(ROLE_ID_KEMBALI)
                            .then(() => console.log(`✅ ROLE: Role ${ROLE_ID_KEMBALI} berhasil ditambahkan ke ${member.user.tag}.`))
                            .catch(err => console.error(`❌ ROLE: Gagal menambahkan role ${ROLE_ID_KEMBALI} ke ${member.user.tag}: ${err.message}`));
                    }
                }
            }

            // Kirim pesan ke thread log
            if (embedsToSend.length > 0) {
                await thread.send({ 
                    content: messageContent,
                    embeds: embedsToSend,
                });
                console.log(`✅ LOGGING: Log ${type} untuk ${member.user.tag} berhasil diperbarui di thread.`);
            }

            // Aktifkan kembali thread jika diarsipkan (untuk member yang kembali)
            if (thread.archived) {
                 await thread.setArchived(false, `Member kembali atau menggunakan CMD.`).catch(console.error);
            }
        }
    } catch (error) {
        // Tangani rate limit atau error lainnya
        console.error(`❌ LOGGING ERROR: Gagal memperbarui/membuat log Forum untuk ${member.user.tag}: ${error.message}`);
    }
}

/**
 * Membuat Embed untuk event Join/Leave.
 */
function createJoinLogEmbed(member, type) {
    const isJoin = type === 'JOIN';
    return new EmbedBuilder()
        .setTitle(isJoin ? '🟢 Member Bergabung (JOIN)' : '🔴 Member Keluar (LEAVE)')
        .setColor(isJoin ? 0x2ecc71 : 0xff0000)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
            { name: '👤 User', value: `${member.user.tag} (\`${member.id}\`)`, inline: false },
            { name: '📅 Akun Dibuat', value: member.user.createdAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), inline: true },
            { name: '⏱ Waktu Aksi', value: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), inline: true }
        )
        .setFooter({ text: `Log Persisten: ${type} event tercatat.` });
}

module.exports = {
    updateMemberLog,
    FORUM_CHANNEL_ID
};
