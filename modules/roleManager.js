/**
 * @module RoleManager
 * @description Logic Tier Verification - Real-time Only (No Scanner)
 * @author BananaSkiee Systems
 */

const IDS = {
    V1: "1352286235233620108",
    NV2: "1444248606579097640"
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

        // LOGIKA UTAMA: Jika member BARU dapet V1
        if (!hadV1 && hasV1) {
            // Pastikan dia belum punya NV2 sebelum ditambahin
            if (!hasNV2) {
                await newMember.roles.add(IDS.NV2).catch(err => {
                    console.error(`[Error] Gagal tambah NV2 ke ${newMember.user.tag}:`, err.message);
                });
                console.log(`✨ [Tier-Up] ${newMember.user.tag} automatically received NV2`);
            }
        }
    });

    // Info: Scanner dihapus untuk menghindari Gateway Rate Limit
};
