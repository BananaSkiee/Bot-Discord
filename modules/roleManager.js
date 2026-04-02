//modules/roleManager.js
/**
 * @module RoleManager
 * @description Logic Tier Verification - Real-time Only (No Scanner)
 * @author BananaSkiee Systems
 */

const IDS = {
    V1: "1352286235233620108",
    NV2: "1444248606579097640",
    TRIGGER_ROLE: "1444248605761470595", 
    V2_ROLE: "1444248590305202247",      // Role yang baru didapat
    OLD_V2_LOG: "1444248605245313156"    // Role yang wajib dihapus saat dapet V2_ROLE
};

module.exports = (client) => {
    console.log("💎 [RoleManager] Real-time Monitoring Active | Zero-Lag Mode");

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (newMember.user.bot) return;

        // Cache checks
        const hadV1 = oldMember.roles.cache.has(IDS.V1);
        const hasV1 = newMember.roles.cache.has(IDS.V1);
        
        const hadTrigger = oldMember.roles.cache.has(IDS.TRIGGER_ROLE);
        const hasTrigger = newMember.roles.cache.has(IDS.TRIGGER_ROLE);

        const hadV2 = oldMember.roles.cache.has(IDS.V2_ROLE);
        const hasV2 = newMember.roles.cache.has(IDS.V2_ROLE);

        // 1. Jika member BARU dapet V1 -> Kasih NV2
        if (!hadV1 && hasV1) {
            if (!newMember.roles.cache.has(IDS.NV2)) {
                await newMember.roles.add(IDS.NV2).catch(e => console.error(`[Error] V1-Add: ${e.message}`));
                console.log(`✨ [Tier-Up] ${newMember.user.tag} received NV2`);
            }
        }

        // 2. Jika member BARU dapet TRIGGER_ROLE -> Hapus NV2 & Tambah V2_ROLE
        if (!hadTrigger && hasTrigger) {
            try {
                await Promise.all([
                    newMember.roles.remove(IDS.NV2).catch(() => null),
                    newMember.roles.add(IDS.V2_ROLE)
                ]);
                console.log(`🚀 [Transition] ${newMember.user.tag}: NV2 Removed & V2_ROLE Added`);
            } catch (e) {
                console.error(`[Error] Transition Logic: ${e.message}`);
            }
        }

        // 3. LOGIKA BARU: Jika dapet V2_ROLE -> Wajib hapus OLD_V2_LOG (1444248605245313156)
        if (!hadV2 && hasV2) {
            if (newMember.roles.cache.has(IDS.OLD_V2_LOG)) {
                await newMember.roles.remove(IDS.OLD_V2_LOG).catch(e => 
                    console.error(`[Error] Gagal hapus role lama: ${e.message}`)
                );
                console.log(`🗑️ [Cleanup] ${newMember.user.tag}: Removed old role ${IDS.OLD_V2_LOG} because they got V2_ROLE`);
            }
        }
    });
};
