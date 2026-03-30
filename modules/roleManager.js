/**
 * @module RoleManager
 * @description Logic tier verification tingkat dewa untuk BS Community
 */

const IDS = {
    // Role Verify (Permanen)
    V1: "1352286235233620108", V2: "1444248605761470595", V3: "1444248590305202247",
    // Role Non-Verify (Sementara/Gantian)
    NV1: "1444248589051367435", NV2: "1444248606579097640", NV3: "1444248605245313156"
};

module.exports = (client) => {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const roles = newMember.roles.cache;

        // 1. AUTO NON-VERIFY 2: Jika punya V1 tapi belum punya V2 & NV2
        if (roles.has(IDS.V1) && !roles.has(IDS.V2) && !roles.has(IDS.NV2)) {
            await newMember.roles.add(IDS.NV2).catch(() => null);
        }

        // 2. AUTO NON-VERIFY 3: Jika punya V2 tapi belum punya V3 & NV3
        if (roles.has(IDS.V2) && !roles.has(IDS.V3) && !roles.has(IDS.NV3)) {
            await newMember.roles.add(IDS.NV3).catch(() => null);
        }

        // 3. CLEANUP LOGIC: Memastikan role Non-Verify dihapus jika Verify-nya sudah ada
        if (roles.has(IDS.V1) && roles.has(IDS.NV1)) await newMember.roles.remove(IDS.NV1);
        if (roles.has(IDS.V2) && roles.has(IDS.NV2)) await newMember.roles.remove(IDS.NV2);
        if (roles.has(IDS.V3) && roles.has(IDS.NV3)) await newMember.roles.remove(IDS.NV3);
    });

    // Cek saat bot Ready atau Member baru Join
    client.on('guildMemberAdd', async (member) => {
        await member.roles.add(IDS.NV1).catch(() => null);
    });
};
