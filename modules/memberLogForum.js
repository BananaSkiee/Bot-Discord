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
        case 'online': statusDisplay = '🟢 ONLINE'; break;
        case 'idle': statusDisplay = '🌙 IDLE'; break;
        case 'dnd': statusDisplay = '⛔ DND'; break;
        default: statusDisplay = '⚫ OFFLINE'; break;
    }
    
    // Cek Client/Device
    const devices = [];
    if (clientStatus.desktop) devices.push('🖥️ PC');
    if (clientStatus.mobile) devices.push('📱 Mobile');
    if (clientStatus.web) devices.push('🌐 Web');
    
    const clientDisplay = devices.length > 0 ? devices.join(', ') : 'Tidak Terdeteksi';

    return { statusDisplay, clientDisplay };
}

/**
 * Membuat Embed profesional TINGKAT DEWA untuk entri log.
 * Menggunakan DESCRIPTION untuk layout KARTU SIMETRIS.
 */
async function createLogEntryEmbed(member, type, extraData = {}) {
    let title, emoji, descriptionText;
    
    switch (type) {
        case 'JOIN': title = '🟢 MEMBER BERGABUNG (AUDIT AWAL)'; emoji = '🚪'; descriptionText = `Subjek terdeteksi memasuki server secara nyata.`; break;
        case 'LEAVE': title = '🔴 MEMBER KELUAR'; emoji = '🚶'; descriptionText = `Subjek meninggalkan server. Log diarsipkan.`; break;
        case 'RE_ENTRY': title = '🚨 MEMBER MASUK KEMBALI (RE-ENTRY)'; emoji = '♻️'; descriptionText = `Subjek terdeteksi masuk kembali. Peran Re-entry ditambahkan.`; break;
        case 'FIRST_MESSAGE': title = '💬 PESAN PERTAMA DICATAT'; emoji = '📝'; descriptionText = `Pesan pertama subjek di server ini telah dicatat.`; break;
        case 'ROLE_UPDATE': title = '💼 PERUBAHAN PERAN (ROLE UPDATE)'; emoji = '🔄'; descriptionText = `Peran (Role) member diubah oleh Moderator/Sistem.`; break;
        case 'MESSAGE_DELETE': title = '🗑️ LOG PESAN DIHAPUS'; emoji = '❌'; descriptionText = `Pesan yang dikirim oleh member ini telah dihapus oleh pengirim atau moderator.`; break;
        case 'CMD_SIM': title = `⚙️ SIMULASI LOG`; emoji = '🧪'; descriptionText = `Log ini dicatat melalui perintah simulasi oleh Administrator.`; break;
        default: title = 'ℹ️ LOG UMUM'; emoji = '📄'; descriptionText = 'Aktivitas member dicatat.';
    }

    // --- 1. AMBIL DATA DENGAN KECEPATAN MAKSIMAL (Promise.all) ---
    const [user, membersCollection] = await Promise.all([
        member.user.fetch().catch(() => member.user), // Fetch user data (Nitro, Banner)
        member.guild.members.fetch().catch(() => new Collection()), // Fetch ALL members (for Join Position, THE BOTTLENECK)
        member.fetch().catch(() => member), // Fetch member data (ensure up-to-date presence/roles)
    ]);
    
    // --- 2. PRE-PROSES DATA ---
    const tags = getMemberTags(member);
    const presenceInfo = getMemberPresenceInfo(member);
    const rolesCount = member.roles.cache.size - 1; 
    
    const joinedTimestamp = member.joinedTimestamp;
    const createTimestamp = user.createdTimestamp;
    const accountAgeDays = Math.floor((Date.now() - createTimestamp) / (1000 * 60 * 60 * 24));

    const sortedMembers = membersCollection.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
    const joinPosition = sortedMembers.map(m => m.id).indexOf(member.id) + 1;
    
    const nitroStatus = user.premiumType > 0 ? `✨ Nitro Tipe ${user.premiumType}` : '❌ Non-Nitro';
    const accentColor = user.hexAccentColor ? user.hexAccentColor : NEUTRAL_COLOR;
    const bannerURL = user.bannerURL({ size: 1024, extension: 'png' });
    
    // Data Invite Tracking
    const inviteInfo = extraData.invite ? 
        `**Link:** \`${extraData.invite.code}\` | **Pengundang:** ${extraData.invite.inviter || 'Sistem'}`
        : 'Tidak terdeteksi / Join Langsung';

    // Role List (Filtered, separated by |)
    const roleList = rolesCount > 0 
        ? member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString()).join(' | ') 
        : '*Tidak ada role khusus.*';

    // --- 3. BUAT STRUKTUR DESCRIPTION (SIMETRIS & RAPI) ---
    let mainDescription = 
`**[LOG AUDIT]** ${descriptionText}
---
**🔑 KUNCI TRANSAKSI**
\`\`\`
ID: ${member.id}
CODE: ${generateUniqueAuditCode()}
\`\`\`

**👤 DATA IDENTITAS & AKUN**
\`\`\`
Nama Tampilan : ${member.user.globalName || member.user.username}
User Tag      : ${member.user.tag}
Status Nitro  : ${nitroStatus}
Usia Akun     : ${accountAgeDays} Hari (${time(new Date(createTimestamp), 'D')})
Bot Status    : ${user.bot ? '✅ Ya' : '❌ Tidak'}
Accent Color  : ${user.hexAccentColor || 'Default'}
\`\`\`

**📈 STATUS KEANGGOTAAN SERVER**
\`\`\`
Posisi Gabung : Anggota ke-${joinPosition} dari ${member.guild.memberCount} Total
Waktu Gabung  : ${time(new Date(joinedTimestamp), 'f')}
Invite Sumber : ${inviteInfo}
Status Aktif  : ${presenceInfo.statusDisplay} (${presenceInfo.clientDisplay})
Tag Khusus    : ${tags.gender} | ${tags.verification} | ${tags.reEntry}
\`\`\`

**💬 AKTIVITAS & RIWAYAT CHAT**
> **Semua Role (${rolesCount}):** ${roleList}
`;

    // --- 4. DATA KHUSUS BERDASARKAN TIPE LOG ---
    
    if (type === 'FIRST_MESSAGE' && extraData.firstMessage) {
        const { url, content, channel, timeSent } = extraData.firstMessage;
        
        mainDescription += `
**\n📝 DETAIL PESAN PERTAMA**
> **Dikirim:** ${time(new Date(timeSent), 'f')}
> **Channel:** ${channel.toString()}
> **Link:** [Lihat Pesan](${url})
> **Konten Pesan:**
\`\`\`
${content.substring(0, 500) || 'Konten Tidak Tersedia/Hanya Lampiran'}
\`\`\`
`;
    }

    if (type === 'ROLE_UPDATE' && extraData.roleChanges) {
        const { added, removed } = extraData.roleChanges;
        let roleChangesDetail = '';

        if (added.length > 0) {
            roleChangesDetail += `\n**➕ DITAMBAHKAN (${added.length})**\n> ${added.join('\n> ')}`;
        }
        if (removed.length > 0) {
            roleChangesDetail += `\n**➖ DICABUT (${removed.length})**\n> ${removed.join('\n> ')}`;
        }

        mainDescription += `\n**\n🔄 DETAIL PERUBAHAN PERAN**${roleChangesDetail}`;
    }

    if (type === 'MESSAGE_DELETE' && extraData.deletedMessage) {
        const { content, channel, timeDeleted } = extraData.deletedMessage;
        
        mainDescription += `
**\n🗑️ DETAIL PESAN DIHAPUS**
> **Channel:** ${channel.toString()}
> **Waktu Hapus Dicatat:** ${time(new Date(timeDeleted), 'f')}
> **Konten Pesan:**
\`\`\`
${content.substring(0, 1000) || 'Konten Tidak Tersedia/Hanya Lampiran'}
\`\`\`
`;
    }

    // --- 5. BANGUN EMBED AKHIR ---
    const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${title}`)
        .setColor(accentColor) 
        .setAuthor({
            name: `${member.user.tag} | ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB`,
            iconURL: member.user.displayAvatarURL(),
        })
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(mainDescription)
        .setImage(bannerURL || null) 
        .setFooter({ text: `Audit Log V7 | Menangkap Delete Message.`, iconURL: member.guild.iconURL() })
        .setTimestamp();
    
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
 * Fungsi utama untuk log aksi member.
 */
async function logMemberAction(member, type, extraData = {}) {
    if (!member || !member.guild) return;
    
    const shouldSendNewLog = (type !== 'JOIN') || (type === 'CMD_SIM') || (type === 'ROLE_UPDATE') || (type === 'MESSAGE_DELETE');

    const thread = await findOrCreateMemberLogThread(member.guild, member);
    if (!thread) return;

    let logType = type;
    if (type === 'CMD_SIM' && extraData.command) {
        if (extraData.command === '!1') logType = 'JOIN'; 
        else if (extraData.command === '!2') logType = 'LEAVE'; 
        else if (extraData.command === '!3') logType = 'RE_ENTRY'; 
        else logType = 'CMD';
    }

    if (logType === 'RE_ENTRY') {
        member.roles.add(ROLE_REENTRY_ID)
            .catch(err => console.error(`❌ ROLE: Gagal menambahkan role Re-entry: ${err.message}`));
    }
    
    if (logType === 'LEAVE') {
        await thread.setArchived(true, `Member keluar server.`).catch(console.error);
    }
    
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

    // Pastikan konten pesan tersedia
    const messageContent = message.content || '[Konten tidak tersedia atau hanya lampiran]';

    const extraData = {
        firstMessage: {
            url: message.url,
            content: messageContent,
            channel: message.channel,
            timeSent: message.createdTimestamp // Waktu pesan dikirim
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
