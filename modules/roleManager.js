//modules/roleManager.js
/**
 * @module RoleManager
 * @description Logic Tier Verification - Real-time Only (No Scanner)
 * @author BananaSkiee Systems
 */

const IDS = {
    V1: "1352286235233620108",           // Role Awal
    NV2: "1444248606579097640",          // Role Bonus V1
    TRIGGER_ROLE: "1444248605761470595", // Role Pemicu
    OLD_V2_LOG: "1444248605245313156",   // Role yang didapat dari Trigger
    V2_ROLE: "1444248590305202247"       // Role Final (Hapus Log)
};

module.exports = (client) => {
    console.log("💎 [RoleManager] Logic Updated | Zero-Lag Mode Active");

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (newMember.user.bot) return;

        // Cache checks
        const hadV1 = oldMember.roles.cache.has(IDS.V1);
        const hasV1 = newMember.roles.cache.has(IDS.V1);
        
        const hadTrigger = oldMember.roles.cache.has(IDS.TRIGGER_ROLE);
        const hasTrigger = newMember.roles.cache.has(IDS.TRIGGER_ROLE);

        const hadV2Final = oldMember.roles.cache.has(IDS.V2_ROLE);
        const hasV2Final = newMember.roles.cache.has(IDS.V2_ROLE);

        // 1. Dapet V1 (108) -> Kasih NV2 (640)
        if (!hadV1 && hasV1) {
            await newMember.roles.add(IDS.NV2).catch(e => console.error(`[Error] V1-Add: ${e.message}`));
            console.log(`✨ [V1] ${newMember.user.tag} received NV2`);
        }

        // 2. Dapet Trigger (595) -> Hapus NV2 (640) & Kasih OLD_V2_LOG (3156)
        if (!hadTrigger && hasTrigger) {
            try {
                await Promise.all([
                    newMember.roles.remove(IDS.NV2).catch(() => null),
                    newMember.roles.add(IDS.OLD_V2_LOG)
                ]);
                console.log(`🚀 [Trigger] ${newMember.user.tag}: Received Log ${IDS.OLD_V2_LOG} & Removed NV2`);
            } catch (e) {
                console.error(`[Error] Trigger Transition: ${e.message}`);
            }
        }

        // 3. Dapet V2_ROLE (247) -> Hapus OLD_V2_LOG (3156)
        if (!hadV2Final && hasV2Final) {
            if (newMember.roles.cache.has(IDS.OLD_V2_LOG)) {
                await newMember.roles.remove(IDS.OLD_V2_LOG).catch(e => 
                    console.error(`[Error] Cleanup Failed: ${e.message}`)
                );
                console.log(`🗑️ [Cleanup] ${newMember.user.tag}: Removed Log because V2 Final attained`);
            }
        }
    });
};
