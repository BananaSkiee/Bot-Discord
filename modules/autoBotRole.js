/**
 * File: modules/autoBotRole.js
 */
const ROLE_NON_VERIFY = "1444248589051367435";
const ROLE_MEMBER = "1352286235233620108";
const ROLE_BOT = "1401061819195592785";

// 1. Fungsi saat member/bot baru masuk (JOIN)
async function handleInitialRoles(member) {
    try {
        if (member.user.bot) {
            // Kalau bot, kasih role bot
            await member.roles.add(ROLE_BOT);
            console.log(`🤖 [BOT] ${member.user.tag} join, dikasih role Bot.`);
        } else {
            // Kalau manusia, kasih role Non-Verify
            await member.roles.add(ROLE_NON_VERIFY);
            console.log(`👤 [MEMBER] ${member.user.tag} join, dikasih role Non-Verify.`);
        }
    } catch (err) {
        console.error(`❌ Gagal kasih role awal ke ${member.user.tag}:`, err.message);
    }
}

// 2. Fungsi saat ada perubahan role (VERIFY)
async function handleVerificationUpdate(oldMember, newMember) {
    try {
        // Cek apakah sekarang dia punya role Member, tapi sebelumnya nggak punya
        const hadMemberRole = oldMember.roles.cache.has(ROLE_MEMBER);
        const hasMemberRole = newMember.roles.cache.has(ROLE_MEMBER);
        const hasNonVerify = newMember.roles.cache.has(ROLE_NON_VERIFY);

        if (!hadMemberRole && hasMemberRole && hasNonVerify) {
            // Dia baru verify! Hapus role Non-Verify-nya
            await newMember.roles.remove(ROLE_NON_VERIFY);
            console.log(`✅ [VERIFIED] ${newMember.user.tag} sudah verify, role Non-Verify dicabut.`);
        }
    } catch (err) {
        console.error(`❌ Gagal update role verify ${newMember.user.tag}:`, err.message);
    }
}

// 3. HAPUS FUNGSI SCANNING LAMA (setInitialBotRoles)
// Kita bikin fungsi kosong aja biar index.js lo nggak error saat manggil
async function setInitialBotRoles(client) {
    console.log("🚀 AutoRole System Ready (Event-Based). No scanning performed.");
}

module.exports = { handleInitialRoles, handleVerificationUpdate, setInitialBotRoles };
