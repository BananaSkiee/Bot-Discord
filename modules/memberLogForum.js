const { ChannelType, EmbedBuilder, Collection } = require('discord.js');

// --- KONSTANTA KONFIGURASI ---
const FORUM_CHANNEL_ID = '1398947109461295236'; 
const ROLE_ID_KEMBALI = '1354161955669147649'; 
const THREAD_NAME_PREFIX = 'Log - ';

/**
 * Membuat Embed profesional untuk entri log tertentu.
 * @param {import('discord.js').GuildMember} member Objek member.
 * @param {('JOIN'|'LEAVE'|'RE_ENTRY'|'CMD')} type Tipe log event.
 * @param {string} [command] Perintah yang digunakan (jika type='CMD').
 * @returns {EmbedBuilder} Embed yang sudah jadi.
 */
function createLogEntryEmbed(member, type, command = null) {
    let title, color, emoji, description;
    
    switch (type) {
        case 'JOIN':
            title = '🟢 MEMBER BERGABUNG (JOIN)';
            color = 0x2ecc71; // Hijau
            emoji = '✅';
            description = `Subjek terdeteksi memasuki server. Log thread dibuat/diaktifkan.`;
            break;
        case 'LEAVE':
            title = '🔴 MEMBER KELUAR (LEAVE)';
            color = 0xe74c3c; // Merah
            emoji = '🛑';
            description = `Subjek meninggalkan server. Log aktivitas dihentikan sementara.`;
            break;
        case 'RE_ENTRY':
            title = '🚨 MEMBER MASUK KEMBALI (RE-ENTRY)';
            color = 0xf1c40f; // Kuning
            emoji = '♻️';
            description = `Subjek terdeteksi masuk kembali. Peran \`KEMBALI\` ditugaskan otomatis.`;
            break;
        case 'CMD':
            title = `⚙️ PERINTAH SIMULASI DIGUNAKAN (${command})`;
            color = 0x5865f2; // Biru Discord
            emoji = '💻';
            description = `Perintah simulasi \`${command}\` dieksekusi oleh Administrator.`;
            break;
        default:
            title = 'ℹ️ LOG UMUM';
            color = 0x95a5a6;
            emoji = '📄';
            description = 'Aktivitas server dicatat.';
    }

    const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${title}`)
        .setColor(color)
        .setAuthor({
            name: `LOG AUDIT PERSISTEN | ${member.user.tag}`,
            iconURL: member.user.displayAvatarURL(),
        })
        .setDescription(`**[CATATAN]** ${description}`)
        .addFields(
            { name: '👤 User ID', value: `\`${member.id}\``, inline: true },
            { name: '🤖 Aksi Logika', value: `\`${type}\``, inline: true },
            { name: '📅 Waktu Aksi', value: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: true },
            { name: '🗓 Akun Dibuat', value: member.user.createdAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }), inline: true },
        )
        .setFooter({ text: `Sistem Log Forum Persisten v1.1 | Diperbarui pada: ${new Date().toLocaleDateString()}` })
        .setTimestamp();
    
    return embed;
}

/**
 * Mencari atau membuat thread log untuk member tertentu.
 * @param {import('discord.js').Guild} guild Objek Guild.
 * @param {import('discord.js').GuildMember} member Objek member.
 * @returns {Promise<import('discord.js').ThreadChannel | null>} Thread log.
 */
async function findOrCreateMemberLogThread(guild, member) {
    const forumChannel = guild.channels.cache.get(FORUM_CHANNEL_ID);
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
        console.error(`❌ LOGGING: Forum Channel ID ${FORUM_CHANNEL_ID} tidak valid.`);
        return null;
    }
    
    const threadName = `${THREAD_NAME_PREFIX}${member.id}`;
    let thread = null;

    // 1. Cek thread aktif dan diarsipkan
    const [active, archived] = await Promise.all([
        forumChannel.threads.fetchActive().catch(() => ({ threads: new Collection() })),
        forumChannel.threads.fetchArchived().catch(() => ({ threads: new Collection() }))
    ]);

    const allThreads = new Collection().concat(active.threads, archived.threads);
    thread = allThreads.find(t => t.name === threadName);

    // 2. Jika ditemukan, pastikan tidak diarsipkan
    if (thread) {
        if (thread.archived) {
            await thread.setArchived(false, `Member aktif kembali atau log diakses.`);
        }
        return thread;
    }

    // 3. Jika tidak ditemukan, buat thread baru
    try {
        const initialEmbed = createLogEntryEmbed(member, 'JOIN'); // Gunakan Embed JOIN sebagai pesan pertama
        thread = await forumChannel.threads.create({
            name: threadName, 
            message: {
                content: `**[LOG INITIATED]** Thread log persisten untuk **${member.user.tag}** dimulai.`,
                embeds: [initialEmbed]
            },
            reason: `Log member baru bergabung: ${member.user.tag}`,
        });
        console.log(`✅ LOGGING: Thread log baru untuk ${member.user.tag} dibuat: ${thread.name}`);
        return thread;

    } catch (error) {
        console.error(`❌ LOGGING: Gagal membuat thread untuk ${member.user.tag}. Mungkin Rate Limit atau Permission: ${error.message}`);
        return null;
    }
}

/**
 * Fungsi utama yang dipanggil oleh event JOIN/LEAVE dan Command Simulasi (!1, !2, !3).
 * @param {import('discord.js').GuildMember} member Objek member yang terlibat.
 * @param {('JOIN'|'LEAVE'|'RE_ENTRY'|'CMD_SIM')} type Tipe event.
 * @param {string} [command] Perintah yang digunakan (jika type='CMD_SIM').
 */
async function logMemberAction(member, type, command = null) {
    if (!member || !member.guild) return;

    const guild = member.guild;
    
    // Perlakuan khusus untuk event JOIN (Membuat thread jika belum ada)
    if (type === 'JOIN') {
        await findOrCreateMemberLogThread(guild, member);
        return; // Pesan JOIN sudah terkirim di fungsi findOrCreate.
    }
    
    const thread = await findOrCreateMemberLogThread(guild, member);
    if (!thread) return;

    let logType = type;
    if (type === 'CMD_SIM' && command) {
        // Tentukan tipe log berdasarkan command simulasi
        if (command === '!1') logType = 'JOIN';
        else if (command === '!2') logType = 'LEAVE';
        else if (command === '!3') logType = 'RE_ENTRY';
        else logType = 'CMD';
    }

    // --- Penanganan Role dan Aksi Tambahan ---
    if (logType === 'RE_ENTRY') {
        // 1. Tambahkan Role
        member.roles.add(ROLE_ID_KEMBALI)
            .then(() => console.log(`✅ ROLE: Role ${ROLE_ID_KEMBALI} berhasil ditambahkan ke ${member.user.tag}.`))
            .catch(err => console.error(`❌ ROLE: Gagal menambahkan role ${ROLE_ID_KEMBALI} ke ${member.user.tag}: ${err.message}`));
    }
    
    if (logType === 'LEAVE') {
        // 2. Arsipkan thread saat member keluar (untuk memisahkan log aktif)
        await thread.setArchived(true, `Member keluar server.`).catch(console.error);
    }
    
    // 3. Kirim Log Entry ke Thread
    const logEmbed = createLogEntryEmbed(member, logType, command);
    await thread.send({ 
        content: `Log Aksi: ${logType}`,
        embeds: [logEmbed],
    }).catch(err => console.error(`❌ LOGGING: Gagal mengirim log ke thread ${thread.name}: ${err.message}`));
}


module.exports = {
    logMemberAction,
    FORUM_CHANNEL_ID,
    createLogEntryEmbed // Diekspor untuk penggunaan di index.js (balasan CMD)
};
