// File: modules/autoBotRole.js

/**
 * Fungsi untuk memberikan role tertentu kepada semua BOT di server yang sudah ada.
 * Juga berfungsi sebagai handler untuk BOT yang baru bergabung.
 */
async function handleBotRoles(member) {
    const targetRoleId = '1401061819195592785';

    // Pastikan ini adalah BOT
    if (!member.user.bot) {
        return;
    }
    
    // Pastikan BOT belum memiliki role tersebut (hanya untuk penghematan resource)
    if (member.roles.cache.has(targetRoleId)) {
        // console.log(`[SKIP] BOT ${member.user.tag} sudah memiliki role ${targetRoleId}.`);
        return;
    }

    const targetRole = member.guild.roles.cache.get(targetRoleId);

    if (!targetRole) {
        console.error(`Role dengan ID ${targetRoleId} tidak ditemukan di server ${member.guild.name}.`);
        return;
    }

    try {
        await member.roles.add(targetRole);
        console.log(`[SUKSES] Memberikan role ${targetRoleId} kepada BOT: ${member.user.tag} di server ${member.guild.name}.`);
    } catch (error) {
        // Ini sering terjadi jika role bot Anda tidak lebih tinggi dari role yang ingin diberikan
        console.error(`[GAGAL] Gagal memberikan role kepada BOT ${member.user.tag} di ${member.guild.name}. Pastikan hierarki role bot Anda lebih tinggi! Error:`, error.message);
    }
}

/**
 * Fungsi yang dijalankan saat bot READY untuk memberikan role kepada BOT yang sudah ada.
 */
async function setInitialBotRoles(client) {
    console.log('--- Memulai Pengecekan dan Pemberian Role BOT (ID: 1401061819195592785) ---');
    
    // Iterasi melalui semua guild (server) tempat bot berada
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            // Ambil semua anggota dari server
            const members = await guild.members.fetch();
            
            // Iterasi melalui semua anggota
            for (const [memberId, member] of members) {
                // Gunakan fungsi handleBotRoles untuk memproses setiap bot yang ditemukan
                if (member.user.bot) {
                    await handleBotRoles(member);
                }
            }
        } catch (error) {
            console.error(`Gagal memproses anggota di server ${guild.name} (ID: ${guildId}):`, error.message);
        }
    }
    console.log('--- Selesai Pengecekan dan Pemberian Role BOT ---');
}


module.exports = {
    handleBotRoles,
    setInitialBotRoles
};
