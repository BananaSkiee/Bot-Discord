//modules/roleManager.js
/**
 * @module RoleManager
 * @description Logic Tier Verification - Real-time Only (No Scanner)
 * @author BananaSkiee Systems
 */

const IDS = {
    V1: "1352286235233620108",
    NV2: "1444248606579097640",
    TRIGGER_ROLE: "1444248605761470595", // Role pemicu
    NEW_ROLE: "1444248605245313156"      // Role yang akan ditambah
};

module.exports = (client) => {
    console.log("💎 [RoleManager] Real-time Monitoring Active | Zero-Lag Mode");

    // --- LOGIKA REAL-TIME (Hanya jalan saat role berubah) ---
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        // Abaikan Bot agar hemat resource
        if (newMember.user.bot) return;

        const hadV1 = oldMember.roles.cache.has(IDS.V1);
        const hasV1 = newMember.roles.cache.has(IDS.V1);
        const hasNV2 = newMember.roles.cache.has(IDS.NV2);

        // Check kondisi untuk TRIGGER_ROLE baru
        const hadTrigger = oldMember.roles.cache.has(IDS.TRIGGER_ROLE);
        const hasTrigger = newMember.roles.cache.has(IDS.TRIGGER_ROLE);

        // 1. LOGIKA UTAMA: Jika member BARU dapet V1
        if (!hadV1 && hasV1) {
            if (!hasNV2) {
                await newMember.roles.add(IDS.NV2).catch(err => {
                    console.error(`[Error] Gagal tambah NV2 ke ${newMember.user.tag}:`, err.message);
                });
                console.log(`✨ [Tier-Up] ${newMember.user.tag} automatically received NV2`);
            }
        }

        // 2. LOGIKA TAMBAHAN: Jika member BARU dapet TRIGGER_ROLE
        if (!hadTrigger && hasTrigger) {
            try {
                // Hapus NV2 dan Tambah NEW_ROLE secara bersamaan
                await Promise.all([
                    newMember.roles.remove(IDS.NV2).catch(() => null), // Gunakan catch null jika role memang tidak ada
                    newMember.roles.add(IDS.NEW_ROLE)
                ]);
                
                console.log(`🚀 [Transition] ${newMember.user.tag}: Removed NV2 & Added New Role`);
            } catch (err) {
                console.error(`[Error] Gagal update transition role untuk ${newMember.user.tag}:`, err.message);
            }
        }
    });

    // Info: Scanner dihapus untuk menghindari Gateway Rate Limit
};
