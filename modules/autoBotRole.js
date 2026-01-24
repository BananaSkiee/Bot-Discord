/**
 * File: modules/autoBotRole.js
 * Menangani Auto Role untuk Bot dan Member Baru (Non-Verify)
 */

const ROLE_BOT_ID = '1401061819195592785';
const ROLE_NON_VERIFY_ID = '1444248589051367435';
const ROLE_MEMBER_ID = '1352286235233620108';

/**
 * Fungsi utama untuk memberikan role saat member/bot masuk
 */
async function handleInitialRoles(member) {
    try {
        if (member.user.bot) {
            // JIKA BOT: Kasih role khusus Bot
            if (!member.roles.cache.has(ROLE_BOT_ID)) {
                await member.roles.add(ROLE_BOT_ID);
                console.log(`[BOT] ${member.user.tag} diberikan role Bot.`);
            }
        } else {
            // JIKA MEMBER: Kasih role Non-Verify
            if (!member.roles.cache.has(ROLE_NON_VERIFY_ID)) {
                await member.roles.add(ROLE_NON_VERIFY_ID);
                console.log(`[MEMBER] ${member.user.tag} diberikan role Non-Verify.`);
            }
        }
    } catch (error) {
        console.error(`[ERROR] Gagal memberikan role awal:`, error.message);
    }
}

/**
 * Fungsi untuk menghapus Non-Verify jika sudah punya role Member (Verifikasi Berhasil)
 */
async function handleVerificationUpdate(oldMember, newMember) {
    try {
        const hasMemberRole = newMember.roles.cache.has(ROLE_MEMBER_ID);
        const hasNonVerifyRole = newMember.roles.cache.has(ROLE_NON_VERIFY_ID);

        // Jika dia baru dapet role Member, hapus Non-Verify-nya
        if (hasMemberRole && hasNonVerifyRole) {
            await newMember.roles.remove(ROLE_NON_VERIFY_ID);
            console.log(`[VERIFY] ${newMember.user.tag} berhasil verifikasi. Role Non-Verify dihapus.`);
        }
    } catch (error) {
        console.error(`[ERROR] Gagal update role verifikasi:`, error.message);
    }
}

/**
 * Scan saat bot baru nyala (hanya jika diperlukan)
 */
async function setInitialBotRoles(client) {
    console.log('--- Menjalankan Sync Role Bot & Member ---');
    for (const [id, guild] of client.guilds.cache) {
        try {
            const members = await guild.members.fetch();
            for (const [mId, member] of members) {
                await handleInitialRoles(member);
            }
        } catch (e) { console.error(`Gagal sync di ${guild.name}`); }
    }
}

module.exports = {
    handleInitialRoles,
    handleVerificationUpdate,
    setInitialBotRoles
};
