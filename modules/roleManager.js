const IDS = {
    V1: "1352286235233620108", V2: "1444248605761470595", V3: "1444248590305202247",
    NV1: "1444248589051367435", NV2: "1444248606579097640", NV3: "1444248586579097640"
};

module.exports = async (client) => {
    console.log("🔍 Menjalankan Startup Scan (1x Detect)...");

    // --- FITUR DETECT 1X SAAT RESTART ---
    const guild = client.guilds.cache.first(); // Ambil server pertama
    if (guild) {
        try {
            const members = await guild.members.fetch();
            let count = 0;

            members.forEach(member => {
                const roles = member.roles.cache;
                // Jika punya V1 tapi belum punya V2 dan belum punya NV2
                if (roles.has(IDS.V1) && !roles.has(IDS.V2) && !roles.has(IDS.NV2)) {
                    member.roles.add(IDS.NV2).catch(() => null);
                    count++;
                }
            });
            console.log(`✅ Startup Scan Selesai: ${count} member diperbarui.`);
        } catch (err) {
            console.error("❌ Gagal menjalankan Startup Scan:", err);
        }
    }

    // --- LOGIKA OTOMATIS (REAL-TIME) ---
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const roles = newMember.roles.cache;

        if (roles.has(IDS.V1) && !roles.has(IDS.V2) && !roles.has(IDS.NV2)) {
            await newMember.roles.add(IDS.NV2).catch(() => null);
        }
        
        if (roles.has(IDS.V2) && !roles.has(IDS.V3) && !roles.has(IDS.NV3)) {
            await newMember.roles.add(IDS.NV3).catch(() => null);
        }

        // Cleanup
        if (roles.has(IDS.V1) && roles.has(IDS.NV1)) await newMember.roles.remove(IDS.NV1).catch(() => null);
        if (roles.has(IDS.V2) && roles.has(IDS.NV2)) await newMember.roles.remove(IDS.NV2).catch(() => null);
        if (roles.has(IDS.V3) && roles.has(IDS.NV3)) await newMember.roles.remove(IDS.NV3).catch(() => null);
    });

    client.on('guildMemberAdd', async (member) => {
        await member.roles.add(IDS.NV1).catch(() => null);
    });
};
