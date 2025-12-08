const { 
    ChannelType, 
    Collection, 
    time, 
    ButtonBuilder, 
    ButtonStyle, 
    // Komponen V2 yang baru diimpor
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    SectionBuilder,
    ActionRowBuilder 
} = require('discord.js');

// --- KONSTANTA KONFIGURASI BOT & ROLE ---
const FORUM_CHANNEL_ID = '1398947109461295236'; 
const ROLE_REENTRY_ID = '1354161955669147649'; 

// --- KONSTANTA MAPPING ROLE KE TAG FORUM BARU (DIBUTUHKAN OLEH client.on('guildMemberUpdate')) ---
// Map ID ROLE ke ID TAG FORUM yang sesuai
const FORUM_TAGS_MAP = {
    // Gender Roles -> Forum Tags
    '1352299166180577391': '1441800897557434429', // Role Cewek -> Tag Cewek
    '1352299166356996219': '1441801041594024016', // Role Cowok -> Tag Cowok
    
    // Verification Roles -> Forum Tags
    '1352286235233620108': '1441800976813261011', // Role Ter Verify -> Tag Ter Verify
    // Tidak perlu mapping Non Verify karena akan menjadi tag default jika tidak ada Tag Ter Verify
};

const NON_VERIFY_TAG_ID = '1441800946765008956'; // ID Tag Forum untuk Non Verify
// Warna dijadikan integer karena ContainerBuilder menggunakan integer untuk accentColor
const NEUTRAL_COLOR = 0x2C2F33; 
const JOIN_COLOR = 0x00FF7F; // Hijau terang untuk JOIN/First Message
const LEAVE_COLOR = 0xFF4500; // Oranye merah untuk LEAVE

// --- FUNGSI PEMBANTU ---

/**
 * Membuat kode audit unik yang pendek (simulasi Transaction ID).
 * @returns {string} Kode unik 6 digit.
 */
function generateUniqueAuditCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Mendapatkan status Role khusus (Hanya Re-entry yang tersisa).
 */
function getMemberTags(member) {
    let reEntryTag = member.roles.cache.has(ROLE_REENTRY_ID) 
        ? '⚠️ Re-entry Tag Aktif' 
        : '🟢 Tag Re-entry Nonaktif';

    return { reEntry: reEntryTag };
}

/**
 * Mendapatkan informasi kehadiran (Presence), klien (Device), dan AKTIVITAS member.
 */
function getMemberPresenceInfo(member) {
    const presence = member.presence;
    const status = presence ? presence.status : 'offline';
    const clientStatus = presence ? presence.clientStatus : {};
    const activities = presence ? presence.activities : [];

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

    // Ambil Aktivitas Utama
    let activityDisplay = '*Tidak ada aktivitas terdeteksi.*';
    let customStatus = null;

    if (activities.length > 0) {
        const customActivity = activities.find(a => a.type === 4); 
        if (customActivity && customActivity.state) {
            customStatus = `${customActivity.emoji ? customActivity.emoji.toString() + ' ' : ''}${customActivity.state}`;
        }
        
        const mainActivity = activities.find(a => a.type !== 4 && a.type !== 5); 
        if (mainActivity) {
            let typeLabel;
            switch(mainActivity.type) {
                case 0: typeLabel = '🎮 Bermain'; break; 
                case 1: typeLabel = '📹 Streaming'; break; 
                case 2: typeLabel = '🎧 Mendengarkan'; break; 
                case 3: typeLabel = '👀 Menonton'; break; 
                default: typeLabel = '💡 Aktivitas Lain';
            }
            activityDisplay = `${typeLabel}: ${mainActivity.name || 'Tidak Diketahui'}`;
        }
    }

    return { statusDisplay, clientDisplay, activityDisplay, customStatus };
}

/**
 * Mengubah Discord User Flags (Badges) menjadi string yang mudah dibaca.
 */
function getUserBadges(user) {
    if (!user.flags) return '❌ Tidak Ada Badge/Publik';

    const flagNames = user.flags.toArray();
    
    const badgeMap = {
        'ActiveDeveloper': '🛠️ Developer Aktif',
        'Staff': '👑 Staff Discord',
        'Partner': '🤝 Partner Discord',
        'HypeSquad': '🏠 HypeSquad Events',
        'HypeSquadOnlineHouse1': ' bravery',
        'HypeSquadOnlineHouse2': ' brilliance',
        'HypeSquadOnlineHouse3': ' balance',
        'BugHunterLevel1': '🐛 Bug Hunter Lvl 1',
        'BugHunterLevel2': '🌟 Bug Hunter Lvl 2',
        'PremiumEarlySupporter': '💖 Early Supporter',
        'VerifiedDeveloper': '🤖 Verified Bot Dev',
        'CertifiedModerator': '🛡️ Certified Mod',
        'Quarantined': '🔒 Akun Dikarantina', 
    };
    
    let badges = flagNames
        .filter(flag => badgeMap[flag])
        .map(flag => badgeMap[flag]);
        
    let finalBadges = badges.filter(badge => !badge.startsWith(' ')); 
    
    const hasBravery = badges.includes(' bravery');
    const hasBrilliance = badges.includes(' brilliance');
    const hasBalance = badges.includes(' balance');
    
    if (hasBravery || hasBrilliance || hasBalance) {
        let houseBadge = '🏠 HypeSquad:';
        if (hasBravery) houseBadge += ' Bravery';
        if (hasBrilliance) houseBadge += ' Brilliance';
        if (hasBalance) houseBadge += ' Balance';
        finalBadges.push(houseBadge);
    }

    return finalBadges.length > 0 ? finalBadges.join(' | ') : '❌ Tidak Ada Badge/Publik';
}


/**
 * Mencari atau membuat thread log untuk member tertentu DAN memastikan nama thread unik.
 */
async function findOrCreateMemberLogThread(guild, member) {
    const forumChannel = guild.channels.cache.get(FORUM_CHANNEL_ID);
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
        console.error(`❌ LOGGING: Forum Channel ID ${FORUM_CHANNEL_ID} tidak valid.`);
        return null;
    }
    
    const expectedThreadName = `${member.user.username} (${member.displayName || member.user.globalName}) [${member.id}]`;
    let thread = null;

    // Fetch semua thread untuk mencari thread berdasarkan ID member (unik)
    const [active, archived] = await Promise.all([
        forumChannel.threads.fetchActive().catch(() => ({ threads: new Collection() })),
        forumChannel.threads.fetchArchived().catch(() => ({ threads: new Collection() }))
    ]);

    const allThreads = new Collection().concat(active.threads, archived.threads);
    thread = allThreads.find(t => t.name.includes(`[${member.id}]`)); 

    if (thread) {
        // 1. Mengaktifkan jika terarsip
        if (thread.archived) {
            await thread.setArchived(false, `Member aktif kembali.`).catch(console.error);
        }
        
        // 2. Memastikan Nama Thread Sesuai dengan Nama Tampilan Terbaru
        if (thread.name !== expectedThreadName) {
            await thread.setName(expectedThreadName, `Memperbarui nama thread log setelah member change/join.`).catch(console.error);
        }
        
        // 3. Memastikan Tag Forum Terpasang
        await updateMemberThreadTags(member, thread).catch(console.error);

        return thread;
    }

    // Jika thread baru dibuat (Hanya terjadi pada JOIN nyata)
    try {
        const initialComponent = await createLogEntryComponent(member, 'JOIN'); 
        thread = await forumChannel.threads.create({
            name: expectedThreadName, 
            message: {
                content: `🔑 **Kunci Audit ID:** \`${member.id}\`. Thread log persisten untuk **${member.user.tag}** dimulai.`, 
                components: [initialComponent], // Menggunakan Components V2
                flags: 4096 // MessageFlags.IsComponentsV2
            },
            // Terapkan Tag Forum awal saat thread dibuat
            appliedTags: getAppliedTags(member),
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
 * Mengambil Role Gender/Verifikasi member dan mengembalikannya sebagai array ID Tag Forum.
 */
function getAppliedTags(member) {
    const roleIds = member.roles.cache.keys();
    const newTags = [];
    
    // 1. Tag Gender (Hanya ambil satu)
    for (const [roleId, tagId] of Object.entries(FORUM_TAGS_MAP)) {
        if (member.roles.cache.has(roleId)) {
            if (tagId === '1441800897557434429' || tagId === '1441801041594024016') {
                newTags.push(tagId);
                break; // Ambil hanya satu gender tag
            }
        }
    }
    
    // 2. Tag Verifikasi
    if (member.roles.cache.has(Object.keys(FORUM_TAGS_MAP).find(id => FORUM_TAGS_MAP[id] === '1441800976813261011'))) {
        newTags.push('1441800976813261011'); // Ter Verify
    } else {
        newTags.push(NON_VERIFY_TAG_ID); // Non Verify (Default jika tidak ada Ter Verify)
    }

    // Filter duplikat dan pastikan tag valid
    return [...new Set(newTags)];
}

/**
 * Memperbarui Tag Forum (appliedTags) pada thread log.
 */
async function updateMemberThreadTags(member, thread) {
    const currentTags = thread.appliedTags;
    const requiredTags = getAppliedTags(member);
    
    // Periksa apakah Tags saat ini sama dengan Tags yang dibutuhkan
    if (currentTags.length === requiredTags.length && currentTags.every(tag => requiredTags.includes(tag))) {
        return; // Tidak ada perubahan, keluar
    }

    try {
        await thread.setAppliedTags(requiredTags, 'Otomatis diperbarui berdasarkan Role Gender/Verifikasi member.').catch(console.error);
        console.log(`✅ LOGGING: Tag forum untuk ${member.user.tag} diperbarui.`);
    } catch (error) {
        console.error(`❌ LOGGING: Gagal memperbarui tag thread untuk ${member.user.tag}. ${error.message}`);
    }
}

/**
 * Membuat Component V2 profesional TINGKAT DEWA untuk entri log.
 * MENGGANTIKAN EMBED LAMA.
 * @returns {Promise<ContainerBuilder>} Komponen log yang sudah jadi.
 */
async function createLogEntryComponent(member, type, extraData = {}) {
    let title, emoji, descriptionText, color;
    
    // --- PENYEDERHANAAN TIPE LOG ---
    switch (type) {
        case 'JOIN': 
            title = 'MEMBER BERGABUNG (AUDIT AWAL)'; 
            emoji = '🚪'; 
            descriptionText = `Subjek terdeteksi memasuki server secara nyata.`; 
            color = JOIN_COLOR; 
            break;
        case 'LEAVE': 
            title = 'MEMBER KELUAR'; 
            emoji = '🚶'; 
            descriptionText = `Subjek meninggalkan server. Log diarsipkan.`; 
            color = LEAVE_COLOR; 
            break;
        case 'RE_ENTRY': 
            title = 'MEMBER MASUK KEMBALI (RE-ENTRY)'; 
            emoji = '♻️'; 
            descriptionText = `Subjek terdeteksi masuk kembali. Peran Re-entry ditambahkan.`; 
            color = 0xFFA500; // Orange
            break;
        case 'NICKNAME_CHANGE': 
            title = 'PERUBAHAN NAMA TAMPILAN'; 
            emoji = '📝'; 
            descriptionText = `Subjek mengganti nama tampilan (nickname) atau nama globalnya.`; 
            color = NEUTRAL_COLOR; 
            break;
        case 'CMD_SIM': 
            title = `SIMULASI LOG`; 
            emoji = '🧪'; 
            descriptionText = `Log ini dicatat melalui perintah simulasi oleh Administrator.`; 
            color = NEUTRAL_COLOR; 
            break;
        case 'FIRST_MESSAGE':
            title = 'PESAN PERTAMA DICATAT';
            emoji = '💬';
            descriptionText = `Subjek mengirim pesan pertamanya di server.`;
            color = JOIN_COLOR;
            break;
        case 'ROLE_UPDATE':
            title = 'PERUBAHAN ROLE';
            emoji = '🛡️';
            descriptionText = `Role member diperbarui.`;
            color = 0x1E90FF; // Dodger Blue
            break;
        default: 
            title = 'LOG UMUM'; 
            emoji = '📄'; 
            descriptionText = 'Aktivitas member dicatat.';
            color = NEUTRAL_COLOR;
    }

    // --- 1. AMBIL DATA DENGAN KECEPATAN MAKSIMAL ---
    const [user, membersCollection] = await Promise.all([
        member.user.fetch().catch(() => member.user), 
        member.guild.members.fetch().catch(() => new Collection()), 
        member.fetch().catch(() => member), 
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
    const userBadges = getUserBadges(user);
    const customStatusDisplay = presenceInfo.customStatus || 'Tidak Ada';

    // Data Invite Tracking
    const inviteInfo = extraData.invite ? 
        `**Link:** \`${extraData.invite.code}\` | **Pengundang:** ${extraData.invite.inviter || 'Sistem'}`
        : 'Tidak terdeteksi / Join Langsung';

    // Role List
    const roleList = rolesCount > 0 
        ? member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString()).join(' | ') 
        : '*Tidak ada role khusus.*';

    // Tentukan warna aksen dari user atau gunakan warna log
    const accentColor = user.hexAccentColor ? parseInt(user.hexAccentColor.replace('#', ''), 16) : color;

    // --- 3. BANGUN KOMPONEN V2 ---
    const container = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${emoji} LOG AUDIT | ${title}**`),
            new TextDisplayBuilder().setContent(`*${descriptionText}*`),
            new TextDisplayBuilder().setContent(`**Timestamp:** ${time(new Date(), 'R')}`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    // A. Bagian Identitas
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('👤 **DATA IDENTITAS & AKUN**'),
                new TextDisplayBuilder().setContent(`- **User Tag:** ${member.user.tag}`),
                new TextDisplayBuilder().setContent(`- **Nama Tampilan:** ${member.displayName || member.user.globalName || member.user.username}`),
                new TextDisplayBuilder().setContent(`- **Status Nitro:** ${nitroStatus} | **Bot Status:** ${user.bot ? '✅ Ya' : '❌ Tidak'}`),
            )
            .setThumbnailAccessory({ media: { url: member.user.displayAvatarURL() } })
    );
    
    // B. Bagian Metadata & Riwayat
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('⚙️ **METADATA AKUN & RIWAYAT**'),
                new TextDisplayBuilder().setContent(`> ${userBadges}`),
                new TextDisplayBuilder().setContent(`- **Dibuat pada:** ${time(new Date(createTimestamp), 'f')} (${accountAgeDays} Hari)`),
                new TextDisplayBuilder().setContent(`- **Gabung pada:** ${time(new Date(joinedTimestamp), 'f')}`),
                new TextDisplayBuilder().setContent(`- **Posisi Gabung:** #${joinPosition} dari ${member.guild.memberCount}`),
                new TextDisplayBuilder().setContent(`- **Invite Sumber:** ${inviteInfo}`),
            )
    );

    // C. Bagian Status & Role
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('📈 **STATUS AKTIVITAS & ROLE**'),
                new TextDisplayBuilder().setContent(`- **Status Aktif:** ${presenceInfo.statusDisplay} (${presenceInfo.clientDisplay})`),
                new DisplayBuilder().setContent(`- **Custom Status:** ${customStatusDisplay}`),
                new TextDisplayBuilder().setContent(`- **Aktivitas Utama:** ${presenceInfo.activityDisplay}`),
                new TextDisplayBuilder().setContent(`- **Tag Khusus:** ${tags.reEntry}`),
                new TextDisplayBuilder().setContent(`- **Semua Role (${rolesCount}):** ${roleList}`),
            )
    );
    
    // D. Data Khusus (Perubahan Nama / Role)
    if (type === 'NICKNAME_CHANGE' && extraData.nicknameChange) {
        const { oldName, newName } = extraData.nicknameChange;
        container.addTextDisplayComponents(
            new SeparatorBuilder().setDivider(true),
            new TextDisplayBuilder().setContent('📝 **DETAIL PERUBAHAN NAMA**'),
            new TextDisplayBuilder().setContent(`- Nama Lama: **${oldName}**`),
            new TextDisplayBuilder().setContent(`- Nama Baru: **${newName}**`),
        );
    }
    
    if (type === 'ROLE_UPDATE' && extraData.roleChanges) {
        const { added, removed } = extraData.roleChanges;
        container.addTextDisplayComponents(
            new SeparatorBuilder().setDivider(true),
            new TextDisplayBuilder().setContent('🛡️ **DETAIL PERUBAHAN ROLE**'),
            new TextDisplayBuilder().setContent(`- **Role Ditambahkan:** ${added.join(' | ') || '*Tidak ada*'}`),
            new TextDisplayBuilder().setContent(`- **Role Dicabut:** ${removed.join(' | ') || '*Tidak ada*'}`),
        );
    }
    
    // E. Data Kunci Audit
    container.addTextDisplayComponents(
        new SeparatorBuilder().setDivider(true),
        new TextDisplayBuilder().setContent('🔑 **KUNCI TRANSAKSI**'),
        new TextDisplayBuilder().setContent(`\`ID: ${member.id} | CODE: ${generateUniqueAuditCode()}\``)
    );
    
    return container;
}


/**
 * Fungsi utama untuk log aksi member.
 * Menggunakan Komponen V2.
 */
async function logMemberAction(member, type, extraData = {}) {
    if (!member || !member.guild) return;
    
    // Menambahkan ROLE_UPDATE ke tipe yang diizinkan
    const allowedTypes = ['JOIN', 'LEAVE', 'RE_ENTRY', 'NICKNAME_CHANGE', 'CMD_SIM', 'ROLE_UPDATE'];
    if (!allowedTypes.includes(type)) return;

    const thread = await findOrCreateMemberLogThread(member.guild, member);
    if (!thread) return;

    let logType = type;
    if (type === 'CMD_SIM' && extraData.command) {
        // Logika simulasi
        if (extraData.command === '!1') logType = 'JOIN'; 
        else if (extraData.command === '!2') logType = 'LEAVE'; 
        else if (extraData.command === '!3') logType = 'RE_ENTRY'; 
        else if (extraData.command === '!4') logType = 'NICKNAME_CHANGE';
        else logType = 'CMD_SIM';
    }

    if (logType === 'RE_ENTRY') {
        member.roles.add(ROLE_REENTRY_ID)
            .catch(err => console.error(`❌ ROLE: Gagal menambahkan role Re-entry: ${err.message}`));
    }
    
    // Otomatis update tag & name sudah dilakukan di findOrCreate, tapi kita update lagi untuk memastikan
    await updateMemberThreadTags(member, thread).catch(console.error);

    if (logType === 'LEAVE') {
        // Log LEAVE dikirim DULU sebelum diarsipkan
        const logComponent = await createLogEntryComponent(member, 'LEAVE', extraData);
        await thread.send({ 
            content: `**[LOG ENTRY]** ${member.user.tag} | LEAVE`,
            components: [logComponent],
            flags: 4096, // MessageFlags.IsComponentsV2
            actionRows: [ // ActionRowBuilder untuk tombol biasa (bukan V2 Component)
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('log_thread_archived')
                        .setLabel('Thread Log Diarsipkan')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                )
            ]
        }).catch(err => console.error(`❌ LOGGING: Gagal mengirim log LEAVE ke thread ${thread.name}: ${err.message}`));
        
        await thread.setArchived(true, `Member keluar server.`).catch(console.error);
        return; // Hentikan proses lebih lanjut setelah LEAVE
    }
    
    // Untuk log selain LEAVE
    const logComponent = await createLogEntryComponent(member, logType, extraData);
    await thread.send({ 
        content: `**[LOG ENTRY]** ${member.user.tag} | ${logType}`,
        components: [logComponent],
        flags: 4096, // MessageFlags.IsComponentsV2
        actionRows: [ // ActionRowBuilder untuk tombol biasa (bukan V2 Component)
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('log_entry_detail')
                    .setLabel('Lihat Detail Lengkap')
                    .setStyle(ButtonStyle.Primary)
            )
        ]
    }).catch(err => console.error(`❌ LOGGING: Gagal mengirim log ke thread ${thread.name}: ${err.message}`));
}

/**
 * Mencatat pesan pertama member ke thread log mereka.
 * Didesain untuk dipanggil dari event client.on('messageCreate').
 */
async function logFirstMessage(message) {
    if (!message || !message.guild || message.author.bot) return;

    const member = message.member;
    const thread = await findOrCreateMemberLogThread(member.guild, member);
    if (!thread) return;
    
    // Membangun Komponen V2 ringkas untuk mencatat pesan pertama
    const logComponent = new ContainerBuilder()
        .setAccentColor(JOIN_COLOR)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('💬 **PESAN PERTAMA DICATAT**'),
            new SeparatorBuilder().setDivider(true),
            new TextDisplayBuilder().setContent(`- **Member:** ${member.user.tag}`),
            new TextDisplayBuilder().setContent(`- **Channel:** ${message.channel}`),
            new TextDisplayBuilder().setContent(`- **Waktu:** ${time(message.createdAt, 'f')}`),
            new SeparatorBuilder().setDivider(true),
            new TextDisplayBuilder().setContent('**Isi Pesan:**'),
            new TextDisplayBuilder().setContent(`\`\`\`\n${message.content.substring(0, 1000)}\n\`\`\``)
        )
        .addTextDisplayComponents(
             new TextDisplayBuilder().setContent(`*ID Pesan: ${message.id}*`)
        );
        
    await thread.send({ 
        content: `**[LOG ENTRY]** ${member.user.tag} | FIRST_MESSAGE`,
        components: [logComponent],
        flags: 4096, // MessageFlags.IsComponentsV2
    }).catch(err => console.error(`❌ LOGGING: Gagal mengirim log pesan pertama ke thread ${thread.name}: ${err.message}`));
}

/**
 * Fungsi khusus untuk mencatat perubahan nama/nickname member.
 * Didesain untuk dipanggil dari event client.on('guildMemberUpdate').
 */
async function logMemberNicknameChange(oldMember, newMember) {
    // Cek apakah ada perubahan nama tampilan/nickname
    if (oldMember.displayName === newMember.displayName) {
        return; // Tidak ada perubahan nama
    }
    
    const thread = await findOrCreateMemberLogThread(newMember.guild, newMember);
    if (!thread) return;

    const extraData = {
        nicknameChange: {
            oldName: oldMember.displayName,
            newName: newMember.displayName
        }
    };
    
    // Pastikan thread name diupdate sebelum log dikirim
    const expectedThreadName = `${newMember.user.username} (${newMember.displayName || newMember.user.globalName}) [${newMember.id}]`;
    if (thread.name !== expectedThreadName) {
        await thread.setName(expectedThreadName, `Memperbarui nama thread log setelah member change.`).catch(console.error);
    }

    await logMemberAction(newMember, 'NICKNAME_CHANGE', extraData);
}

/**
 * Fungsi khusus untuk memproses Role Update (HANYA untuk update Tag Forum).
 * Didesain untuk dipanggil dari event client.on('guildMemberUpdate').
 */
async function processMemberRoleUpdateForTags(oldMember, newMember) {
    // Jika tidak ada perubahan roles, hentikan
    if (oldMember.roles.cache.size === newMember.roles.cache.size && 
        oldMember.roles.cache.every(role => newMember.roles.cache.has(role.id))) {
        return;
    }

    const thread = await findOrCreateMemberLogThread(newMember.guild, newMember);
    if (!thread) return;

    // Panggil fungsi pembaruan Tag Forum
    await updateMemberThreadTags(newMember, thread);
}


module.exports = {
    logMemberAction,
    logFirstMessage,
    logMemberNicknameChange,
    processMemberRoleUpdateForTags, 
    FORUM_CHANNEL_ID,
    createLogEntryComponent, // Nama diubah dari createLogEntryEmbed
};
