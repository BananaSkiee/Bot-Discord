/**
 * @module RoleManager
 * @description Logic Tier Verification - Massive Startup Scan & Real-time Auto-Role
 */

const IDS = {
    // Role Verify (Tetap)
    V1: "1352286235233620108", V2: "1444248605761470595", V3: "1444248590305202247",
    // Role Non-Verify (Sementara)
    NV1: "1444248589051367435", NV2: "1444248606579097640", NV3: "1444248605245313156"
};

module.exports = async (client) => {
    // --- 1. STARTUP SCAN (Jalan 1x Setiap Bot Reload) ---
    console.log("🔍 [Startup Scan] Mengecek status semua member...");

    const guild = client.guilds.cache.first(); 
    if (guild) {
        try {
            const members = await guild.members.fetch();
            let updateCount = 0;

            members.forEach(member => {
                if (member.user.bot) return; // ABAIKAN BOT

                const roles = member.roles.cache;

                // Cek V1 -> Harus punya NV2 (jika belum V2)
                if (roles.has(IDS.V1) && !roles.has(IDS.V2) && !roles.has(IDS.NV2)) {
                    member.roles.add(IDS.NV2).catch(() => null);
                    updateCount++;
                }

                // Cek V2 -> Harus punya NV3 (jika belum V3)
                if (roles.has(IDS.V2) && !roles.has(IDS.V3) && !roles.has(IDS.NV3)) {
                    member.roles.add(IDS.NV3).catch(() => null);
                    updateCount++;
                }

                // Cek Member Baru/Polos -> Kasih NV1
                if (roles.size === 1 && !roles.has(IDS.NV1)) { // size 1 artinya cuma punya role @everyone
                    member.roles.add(IDS.NV1).catch(() => null);
                    updateCount++;
                }
            });
            console.log(`✅ [Startup Scan] Selesai. ${updateCount} member diperbaiki.`);
        } catch (err) {
            console.error("❌ Gagal menjalankan Startup Scan:", err);
        }
    }

    // --- 2. REAL-TIME LOGIC (Deteksi Langsung) ---
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (newMember.user.bot) return;
        const roles = newMember.roles.cache;

        // Kalo dapet V1 -> Kasih NV2 & Hapus NV1
        if (roles.has(IDS.V1)) {
            if (!roles.has(IDS.V2) && !roles.has(IDS.NV2)) await newMember.roles.add(IDS.NV2).catch(() => null);
            if (roles.has(IDS.NV1)) await newMember.roles.remove(IDS.NV1).catch(() => null);
        }

        // Kalo dapet V2 -> Kasih NV3 & Hapus NV2 (OTOMATIS LANGSUNG!)
        if (roles.has(IDS.V2)) {
            if (!roles.has(IDS.V3) && !roles.has(IDS.NV3)) await newMember.roles.add(IDS.NV3).catch(() => null);
            if (roles.has(IDS.NV2)) await newMember.roles.remove(IDS.NV2).catch(() => null);
        }

        // Cleanup V3
        if (roles.has(IDS.V3) && roles.has(IDS.NV3)) {
            await newMember.roles.remove(IDS.NV3).catch(() => null);
        }
    });

    // Member Baru Join
    client.on('guildMemberAdd', async (member) => {
        if (member.user.bot) return;
        await member.roles.add(IDS.NV1).catch(() => null);
        console.log(`[JOIN] ${member.user.tag} diberikan NV1.`);
    });
};
