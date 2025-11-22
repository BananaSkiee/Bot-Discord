const { ChannelType, EmbedBuilder, Collection } = require('discord.js');

// --- KONSTANTA KONFIGURASI BOT ---
const FORUM_CHANNEL_ID = '1398947109461295236'; 
const ROLE_REENTRY_ID = '1354161955669147649'; 

// --- KONSTANTA ROLE TAGGING SESUAI PERMINTAAN ---
const ROLE_TAGS_MAP = {
    '1352299166180577391': { tag: 'Wanita', emoji: '♀️' }, 
    '1352299166356996219': { tag: 'Cowok', emoji: '♂️' },  
};
const ROLE_VERIFY_ID = '1352286235233620108'; 
const NEUTRAL_COLOR = 0x2C2F33; 
const THREAD_NAME_PREFIX = 'Log - ';

// --- FUNGSI PEMBANTU ---

/**
 * Membuat kode audit unik yang pendek (simulasi Transaction ID).
 * @returns {string} Kode unik 6 digit.
 */
function generateUniqueAuditCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Mendapatkan status Role khusus (Gender, Verify) member.
 */
function getMemberTags(member) {
    let genderTag = '⚫ Belum Terset';
    let verifyTag = '❌ Non Verify';
    let reEntryTag = member.roles.cache.has(ROLE_REENTRY_ID) 
        ? '⚠️ Re-entry Tag Aktif' 
        : '🟢 Tag Re-entry Nonaktif';

    for (const [id, data] of Object.entries(ROLE_TAGS_MAP)) {
        if (member.roles.cache.has(id)) {
            genderTag = `${data.emoji} ${data.tag}`;
            break;
        }
    }

    if (member.roles.cache.has(ROLE_VERIFY_ID)) {
        verifyTag = '✅ Ter Verify';
    }

    return { gender: genderTag, verification: verifyTag, reEntry: reEntryTag };
}

/**
 * Membuat Embed profesional TINGKAT DEWA untuk entri log.
 * Mengambil SEMUA data yang relevan.
 */
function createLogEntryEmbed(member, type, command = null) {
    let title, emoji, description;
    
    switch (type) {
        case 'JOIN':
            title = '🟢 MEMBER BERGABUNG (REAL EVENT)';
            emoji = '🚪';
            description = `Subjek terdeteksi memasuki server secara nyata. Log baru dibuat.`;
            break;
        case 'LEAVE':
            title = '🔴 MEMBER KELUAR (REAL EVENT)';
            emoji = '🚶';
            description = `Subjek meninggalkan server. Log diarsipkan.`;
            break;
        case 'RE_ENTRY':
            title = '🚨 MEMBER MASUK KEMBALI (REAL EVENT)';
            emoji = '♻️';
            description = `Subjek terdeteksi masuk kembali. Peran Re-entry ditambahkan.`;
            break;
        case 'CMD_SIM':
            title = `⚙️ SIMULASI LOG (Command: ${command})`;
            emoji = '🧪';
            description = `Log ini dicatat melalui perintah simulasi oleh Administrator.`;
            break;
        default:
            title = 'ℹ️ LOG UMUM';
            emoji = '📄';
            description = 'Aktivitas member dicatat.';
    }
    
    const tags = getMemberTags(member);
    const rolesCount = member.roles.cache.size - 1; // Kurangi @everyone
    const joinedTimestamp = member.joinedTimestamp;
    const createTimestamp = member.user.createdTimestamp;

    // Hitung posisi bergabung (perlu fetch member)
    const sortedMembers = member.guild.members.cache.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
    const joinPosition = sortedMembers.map(m => m.id).indexOf(member.id) + 1;


    const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${title}`)
        .setColor(NEUTRAL_COLOR) 
        .setAuthor({
            name: `${member.user.tag} | Audit Code: ${generateUniqueAuditCode()}`,
            iconURL: member.user.displayAvatarURL(),
        })
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(`**[KONTEKS]** ${description}`)
        .addFields(
            // --- DATA IDENTITAS & STATUS ---
            { name: '👤 User ID (Kunci Audit)', value: `\`${member.id}\``, inline: true },
            { name: '🤖 Status Bot', value: member.user.bot ? '✅ Ya' : '❌ Tidak', inline: true },
            { name: '🌐 Keanggotaan Server', value: `Anggota ke-\`${joinPosition}\` dari \`${member.guild.memberCount}\` Total.`, inline: true },
            
            // --- DATA TANGGAL PENTING ---
            { name: '🗓 Akun Dibuat', value: `<t:${Math.floor(createTimestamp / 1000)}:f> (<t:${Math.floor(createTimestamp / 1000)}:R>)`, inline: true },
            { name: '📥 Bergabung Server', value: `<t:${Math.floor(joinedTimestamp / 1000)}:f> (<t:${Math.floor(joinedTimestamp / 1000)}:R>)`, inline: true },
            { name: '⏱ Waktu Aksi', value: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: true },

            // --- DATA ROLE & TAG ---
            { name: `🛡️ Role Diberikan (${rolesCount})`, value: rolesCount > 0 ? member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString()).join(', ') : 'Tidak ada role selain @everyone.', inline: false },
            { name: '⭐ Gender Tag', value: tags.gender, inline: true },
            { name: '✅ Verifikasi Status', value: tags.verification, inline: true },
            { name: '⚠️ Re-entry Tag', value: tags.reEntry, inline: true },
        )
        .setFooter({ text: `Audit Log Persisten V3 | Log ini bersifat rahasia.`, iconURL: member.guild.iconURL() })
        .setTimestamp();
    
    return embed;
}

/**
 * Mencari atau membuat thread log untuk member tertentu (otomatis saat JOIN nyata).
 */
async function findOrCreateMemberLogThread(guild, member) {
    const forumChannel = guild.channels.cache.get(FORUM_CHANNEL_ID);
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
        return null;
    }
    
    // Gunakan Username saat ini sebagai nama Thread
    const threadName = member.user.username; 
    let thread = null;

    // Cari thread berdasarkan ID (kunci unik) di antara semua thread
    const [active, archived] = await Promise.all([
        forumChannel.threads.fetchActive().catch(() => ({ threads: new Collection() })),
        forumChannel.threads.fetchArchived().catch(() => ({ threads: new Collection() }))
    ]);

    const allThreads = new Collection().concat(active.threads, archived.threads);
    thread = allThreads.find(t => t.name.includes(member.id) || t.name === threadName);

    if (thread) {
        if (thread.archived) {
            await thread.setArchived(false, `Member aktif kembali.`).catch(console.error);
        }
        return thread;
    }

    // Jika thread baru dibuat, gunakan Embed JOIN
    try {
        const initialEmbed = createLogEntryEmbed(member, 'JOIN'); 
        thread = await forumChannel.threads.create({
            name: `${threadName} [${member.id}]`, // Nama: Username [ID] (Agar unik)
            message: {
                content: `🔑 **Kunci Audit ID:** \`${member.id}\`. Thread log persisten untuk **${member.user.tag}** dimulai.`, 
                embeds: [initialEmbed]
            },
            reason: `Log member baru bergabung: ${member.user.tag}`,
        });
        console.log(`✅ LOGGING: Thread log baru untuk ${member.user.tag} dibuat: ${thread.name}`);
        return thread;

    } catch (error) {
        console.error(`❌ LOGGING: Gagal membuat thread untuk ${member.user.tag}. ${error.message}`);
        return null;
    }
}

/**
 * Fungsi utama untuk log aksi member.
 */
async function logMemberAction(member, type, command = null) {
    if (!member || !member.guild) return;
    
    // Tentukan apakah ini log yang perlu dikirim (semua kecuali JOIN event nyata, yang dikirim di findOrCreate)
    const shouldSendNewLog = (type !== 'JOIN') || (type === 'CMD_SIM');

    const thread = await findOrCreateMemberLogThread(member.guild, member);
    if (!thread) return;

    let logType = type;
    if (type === 'CMD_SIM' && command) {
        if (command === '!1') logType = 'JOIN'; // !1 = Simulasi Join
        else if (command === '!2') logType = 'LEAVE'; // !2 = Simulasi Leave
        else if (command === '!3') logType = 'RE_ENTRY'; // !3 = Simulasi Re-entry
        else logType = 'CMD';
    }

    // --- Penanganan Aksi Role/Arsip ---
    if (logType === 'RE_ENTRY') {
        // Tambahkan Role Re-entry
        member.roles.add(ROLE_REENTRY_ID)
            .then(() => console.log(`✅ ROLE: Role Re-entry ditambahkan ke ${member.user.tag}.`))
            .catch(err => console.error(`❌ ROLE: Gagal menambahkan role Re-entry: ${err.message}`));
    }
    
    if (logType === 'LEAVE') {
        // Arsipkan thread saat member keluar (event nyata atau simulasi !2)
        await thread.setArchived(true, `Member keluar server.`).catch(console.error);
    }
    
    // Kirim Log Entry ke Thread jika diperlukan
    if (shouldSendNewLog) { 
        const logEmbed = createLogEntryEmbed(member, logType, command);
        await thread.send({ 
            content: `**[LOG ENTRY]** ${member.user.tag} | ${logType}`,
            embeds: [logEmbed],
        }).catch(err => console.error(`❌ LOGGING: Gagal mengirim log ke thread ${thread.name}: ${err.message}`));
    }
}


module.exports = {
    logMemberAction,
    FORUM_CHANNEL_ID,
    createLogEntryEmbed 
};
