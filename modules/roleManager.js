/**
 * @module RoleManager
 * @description Logic Tier Verification - Hanya V1 ke NV2
 */

const IDS = {
    V1: "1352286235233620108",
    NV2: "1444248606579097640"
};

module.exports = async (client) => {
    console.log("🔍 [RoleManager] Monitoring V1 -> NV2 Active");

    // --- STARTUP SCAN (1x Saat Reload) ---
    const guild = client.guilds.cache.first();
    if (guild) {
        try {
            const members = await guild.members.fetch();
            members.forEach(member => {
                if (member.user.bot) return;
                // Jika punya V1 tapi belum punya NV2, langsung kasih
                if (member.roles.cache.has(IDS.V1) && !member.roles.cache.has(IDS.NV2)) {
                    member.roles.add(IDS.NV2).catch(() => null);
                }
            });
        } catch (err) { console.error("Error Startup Scan:", err); }
    }

    // --- REAL-TIME LOGIC ---
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (newMember.user.bot) return;
        
        // Logika Utama: Dapet V1 otomatis dapet NV2
        if (!oldMember.roles.cache.has(IDS.V1) && newMember.roles.cache.has(IDS.V1)) {
            if (!newMember.roles.cache.has(IDS.NV2)) {
                await newMember.roles.add(IDS.NV2).catch(() => null);
                console.log(`[V1-DETECT] ${newMember.user.tag} diberikan NV2.`);
            }
        }
    });
};
