const { ChannelType, EmbedBuilder, Collection, time } = require('discord.js');

// --- KONSTANTA KONFIGURASI BOT & ROLE ---
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
 * Mendapatkan informasi kehadiran (Presence) dan klien (Device) member.
 */
function getMemberPresenceInfo(member) {
    const presence = member.presence;
    const status = presence ? presence.status : 'offline';
    const clientStatus = presence ? presence.clientStatus : {};

    let statusDisplay;
    switch (status) {
        case 'online': statusDisplay = '🟢 Online'; break;
        case 'idle': statusDisplay = '🌙 Idle / Away'; break;
        case 'dnd': statusDisplay = '⛔ Do Not Disturb'; break;
        default: statusDisplay = '⚫ Offline / Tersembunyi'; break;
    }
    
    const devices = [];
    if (clientStatus.desktop) devices.push('🖥️ PC/Desktop');
    if (clientStatus.mobile) devices.push('📱 Mobile/HP');
    if (clientStatus.web) devices.push('🌐 Web Browser');
    
    const clientDisplay = devices.length > 0 ? devices.join(', ') : 'Tidak Terdeteksi';

    return { statusDisplay, clientDisplay };
}

/**
 * Membuat Embed profesional TINGKAT DEWA untuk entri log.
 * @param {import('discord.js').GuildMember} member - Objek member yang terlibat.
 * @param {('JOIN'|'LEAVE'|'RE_ENTRY'|'CMD_SIM'|'FIRST_MESSAGE'|'ROLE_UPDATE')} type - Tipe event.
 * @param {object} extraData - Data tambahan seperti invite, message, role changes, dll.
 * @returns {EmbedBuilder}
 */
async function createLogEntryEmbed(member, type, extraData = {}) {
    let title, emoji, description;
    
    // 1. Tentukan Judul Log
    switch (type) {
        case 'JOIN':
            title = '🟢 MEMBER BERGABUNG (AUDIT AWAL)';
            emoji = '🚪';
            description = `Subjek terdeteksi memasuki server secara nyata. Data Audit Log Dibuat.`;
            break;
        case 'LEAVE':
            title = '🔴 MEMBER KELUAR';
            emoji = '🚶';
            description = `Subjek meninggalkan server. Log diarsipkan.`;
            break;
        case 'RE_ENTRY':
            title = '🚨 MEMBER MASUK KEMBALI (RE-ENTRY)';
            emoji = '♻️';
            description = `Subjek terdeteksi masuk kembali. Peran Re-entry ditambahkan.`;
            break;
        case 'FIRST_MESSAGE':
            title = '💬 PESAN PERTAMA DICATAT';
            emoji = '📝';
            description = `Pesan pertama subjek di server ini telah dicatat.`;
            break;
        case 'ROLE_UPDATE':
            title = '💼 PERUBAHAN PERAN (ROLE UPDATE)';
            emoji = '🔄';
            description = `Peran (Role) member diubah oleh Moderator/Sistem.`;
            break;
        case 'CMD_SIM':
            title = `⚙️ SIMULASI LOG (Command: ${extraData.command})`;
            emoji = '🧪';
            description = `Log ini dicatat melalui perintah simulasi oleh Administrator.`;
            break;
        default:
            title = 'ℹ️ LOG UMUM';
            emoji = '📄';
            description = 'Aktivitas member dicatat.';
    }

    // 2. Ambil semua data
    const user = member.user;
    await user.fetch().catch(() => null); 
    await member.fetch().catch(() => null); 
    
    const tags = getMemberTags(member);
    const presenceInfo = getMemberPresenceInfo(member);
    const rolesCount = member.roles.cache.size - 1; 
    
    // Kalkulasi Waktu & Usia Akun
    const joinedTimestamp = member.joinedTimestamp;
    const createTimestamp = user.createdTimestamp;
    const accountAgeMs = Date.now() - createTimestamp;
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    // Posisi Bergabung (Perlu fetch member untuk sorting)
    const members = await member.guild.members.fetch().catch(() => new Collection());
    const sortedMembers = members.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
    const joinPosition = sortedMembers.map(m => m.id).indexOf(member.id) + 1;
    
    // Data Nitro & Profile Aesthetics
    const nitroStatus = user.premiumType > 0 ? `✨ Nitro Tipe ${user.premiumType}` : '❌ Non-Nitro';
    const accentColor = user.hexAccentColor ? user.hexAccentColor : NEUTRAL_COLOR;
    const bannerURL = user.bannerURL({ size: 1024, extension: 'png' });
    
    // Data First Message (Jika ada)
    const firstMessageInfo = extraData.firstMessage ? 
        `[Pesan Pertama](${extraData.firstMessage.url}) di ${extraData.firstMessage.channel.toString()}\n\`\`\`\n${extraData.firstMessage.content.substring(0, 150)}\n...\n\`\`\``
        : 'Belum terdeteksi atau ini bukan log pesan pertama.';

    // Data Invite Tracking (Jika ada)
    const inviteInfo = extraData.invite ? 
        `**Link Invite:** \`${extraData.invite.code}\`\n**Pengundang:** ${extraData.invite.inviter || 'Sistem'}`
        : 'Tidak terdeteksi (Join langsung / Fitur tidak aktif)';


    const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${title}`)
        .setColor(accentColor) 
        .setAuthor({
            name: `${member.user.tag} | Audit Code: ${generateUniqueAuditCode()}`,
            iconURL: member.user.displayAvatarURL(),
        })
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(`**[KONTEKS TRANSAKSI]** ${description}`)
        .setImage(bannerURL || null) 
        .addFields(
            // --- BAGIAN I: IDENTITAS & SERVER ---
            { name: '🔑 Kunci Audit ID', value: `\`${member.id}\``, inline: true },
            { name: '🌐 Keanggotaan Server', value: `Anggota ke-\`${joinPosition}\` dari \`${member.guild.memberCount}\`.`, inline: true },
            { name: '🤖 Status Bot', value: user.bot ? '✅ Ya' : '❌ Tidak', inline: true },

            // --- BAGIAN II: PROFILE & PRESENCE ---
            { name: '⚡ Status Nitro', value: nitroStatus, inline: true },
            { name: '💻 Status Aktif', value: presenceInfo.statusDisplay, inline: true },
            { name: '📱 Klien/Perangkat', value: presenceInfo.clientDisplay, inline: true },
            { name: '🖼️ Warna Border/Accent', value: user.hexAccentColor ? `\`${user.hexAccentColor}\`` : 'Default', inline: true },
            { name: 'Lokasi/IP (Fungsi Terlarang)', value: '[Tidak Dapat Diambil API Discord]', inline: true },
            { name: 'Deskripsi Custom', value: '[Tidak Dapat Diambil API Discord]', inline: true },

            // --- BAGIAN III: WAKTU & RIWAYAT ---
            { name: '🗓 Akun Dibuat (Usia)', value: `${time(new Date(createTimestamp), 'f')} (**${accountAgeDays} Hari**)`, inline: true },
            { name: '📥 Bergabung Server', value: time(new Date(joinedTimestamp), 'f'), inline: true },
            { name: '⏱ Waktu Aksi Log', value: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: true },

            // --- BAGIAN IV: ROLE & TAGGING ---
            { name: '⭐ Gender Tag', value: tags.gender, inline: true },
            { name: '✅ Verifikasi Status', value: tags.verification, inline: true },
            { name: '⚠️ Re-entry Tag', value: tags.reEntry, inline: true },
            { name: `🛡️ Role Diberikan (${rolesCount})`, value: rolesCount > 0 ? member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString()).join(' | ') : 'Tidak ada role selain @everyone.', inline: false },
        );
    
    // --- Tambahkan data khusus ROLE_UPDATE di bagian akhir ---
    if (type === 'ROLE_UPDATE' && extraData.roleChanges) {
        const { added, removed } = extraData.roleChanges;
        if (added.length > 0) {
            embed.addFields({ 
                name: `➕ Role Ditambahkan (${added.length})`, 
                value: added.join(', '), 
                inline: false 
            });
        }
        if (removed.length > 0) {
            embed.addFields({ 
                name: `➖ Role Dicabut (${removed.length})`, 
                value: removed.join(', '), 
                inline: false 
            });
        }
    } else {
        // --- BAGIAN V: LOG KHUSUS (Invite & Message) (Hanya jika bukan ROLE_UPDATE) ---
        embed.addFields(
            { name: '🔗 Sumber Undangan (Invite)', value: inviteInfo, inline: false },
            { name: '💬 Log Pesan Pertama', value: firstMessageInfo, inline: false },
        );
    }

    embed.setFooter({ text: `Audit Log Persisten V5 - Log Peran Ditambahkan.`, iconURL: member.guild.iconURL() })
    embed.setTimestamp();
    
    return embed;
}

/**
 * Mencari atau membuat thread log untuk member tertentu.
 */
async function findOrCreateMemberLogThread(guild, member) {
    const forumChannel = guild.channels.cache.get(FORUM_CHANNEL_ID);
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
        console.error(`❌ LOGGING: Forum Channel ID ${FORUM_CHANNEL_ID} tidak valid.`);
        return null;
    }
    
    // Gunakan Username [ID] saat ini sebagai kunci pencarian
    const threadKey = `${member.user.username} [${member.id}]`;
    let thread = null;

    const [active, archived] = await Promise.all([
        forumChannel.threads.fetchActive().catch(() => ({ threads: new Collection() })),
        forumChannel.threads.fetchArchived().catch(() => ({ threads: new Collection() }))
    ]);

    const allThreads = new Collection().concat(active.threads, archived.threads);
    thread = allThreads.find(t => t.name.includes(member.id)); 

    if (thread) {
        if (thread.archived) {
            await thread.setArchived(false, `Member aktif kembali.`).catch(console.error);
        }
        return thread;
    }

    // Jika thread baru dibuat (Hanya terjadi pada JOIN nyata)
    try {
        const initialEmbed = await createLogEntryEmbed(member, 'JOIN'); 
        thread = await forumChannel.threads.create({
            name: threadKey, 
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
 * Fungsi utama untuk log aksi member (JOIN, LEAVE, RE-ENTRY, CMD_SIM, ROLE_UPDATE).
 */
async function logMemberAction(member, type, extraData = {}) {
    if (!member || !member.guild) return;
    
    // Tentukan apakah ini log yang perlu dikirim (semua kecuali JOIN event nyata)
    const shouldSendNewLog = (type !== 'JOIN') || (type === 'CMD_SIM') || (type === 'ROLE_UPDATE');

    const thread = await findOrCreateMemberLogThread(member.guild, member);
    if (!thread) return;

    let logType = type;
    if (type === 'CMD_SIM' && extraData.command) {
        if (extraData.command === '!1') logType = 'JOIN'; 
        else if (extraData.command === '!2') logType = 'LEAVE'; 
        else if (extraData.command === '!3') logType = 'RE_ENTRY'; 
        else logType = 'CMD';
    }

    // --- Penanganan Aksi Role/Arsip ---
    if (logType === 'RE_ENTRY') {
        member.roles.add(ROLE_REENTRY_ID)
            .catch(err => console.error(`❌ ROLE: Gagal menambahkan role Re-entry: ${err.message}`));
    }
    
    if (logType === 'LEAVE') {
        await thread.setArchived(true, `Member keluar server.`).catch(console.error);
    }
    
    // Kirim Log Entry ke Thread jika diperlukan
    if (shouldSendNewLog) { 
        const logEmbed = await createLogEntryEmbed(member, logType, extraData);
        await thread.send({ 
            content: `**[LOG ENTRY]** ${member.user.tag} | ${logType}`,
            embeds: [logEmbed],
        }).catch(err => console.error(`❌ LOGGING: Gagal mengirim log ke thread ${thread.name}: ${err.message}`));
    }
}

/**
 * Fungsi khusus untuk mencatat pesan pertama member.
 */
async function logFirstMessage(message) {
    if (!message || message.author.bot) return;
    
    const member = message.member;
    if (!member) return;

    const thread = await findOrCreateMemberLogThread(member.guild, member);
    if (!thread) return;

    const extraData = {
        firstMessage: {
            url: message.url,
            content: message.content,
            channel: message.channel
        }
    };

    const logEmbed = await createLogEntryEmbed(member, 'FIRST_MESSAGE', extraData);
    await thread.send({ 
        content: `**[FIRST MESSAGE]** Log pesan pertama dicatat.`,
        embeds: [logEmbed],
    }).catch(err => console.error(`❌ LOGGING: Gagal mengirim log pesan pertama ke thread ${thread.name}: ${err.message}`));
}


module.exports = {
    logMemberAction,
    logFirstMessage, 
    FORUM_CHANNEL_ID,
    createLogEntryEmbed 
};
