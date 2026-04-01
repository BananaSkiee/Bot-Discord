/**
 * @module RoleManager
 * @description Logic Tier Verification - Tier 1 to Tier 2 Automator
 */

const IDS = {
    V1: "1352286235233620108",
    NV1: "1444248589051367435",
    NV2: "1444248606579097640"
};

module.exports = async (client) => {
    console.log("💎 [RoleManager] Logic Tier 1 Active | World Class Performance");

    // --- STARTUP SCAN (Human Only) ---
    const guild = client.guilds.cache.first();
    if (guild) {
        try {
            const members = await guild.members.fetch();
            members.forEach(m => {
                if (m.user.bot) return;
                // Jika punya V1 tapi belum punya NV2, sinkronkan.
                if (m.roles.cache.has(IDS.V1) && !m.roles.cache.has(IDS.NV2)) {
                    m.roles.add(IDS.NV2).catch(() => null);
                }
            });
        } catch (e) { console.error("Startup Scan Error:", e); }
    }

    // --- REAL-TIME SINKRONISASI ---
    client.on('guildMemberUpdate', async (oldM, newM) => {
        if (newM.user.bot) return;

        const hadV1 = oldM.roles.cache.has(IDS.V1);
        const hasV1 = newM.roles.cache.has(IDS.V1);

        // Jika baru dapet V1
        if (!hadV1 && hasV1) {
            if (!newM.roles.cache.has(IDS.NV2)) await newM.roles.add(IDS.NV2).catch(() => null);
            if (newM.roles.cache.has(IDS.NV1)) await newM.roles.remove(IDS.NV1).catch(() => null);
            console.log(`✨ [Tier-Up] ${newM.user.tag} upgraded to Tier 2`);
        }
    });
};
