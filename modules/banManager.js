const { PermissionFlagsBits } = require('discord.js');

module.exports = (client) => {
    // ID Server Target
    const targetGuildId = "1347233781391560837";

    client.on('messageCreate', async (message) => {
        if (!message.content.startsWith('!') || message.author.bot) return;

        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // --- 1. Command !chn (Hapus Channel) ---
        if (command === 'chn') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return message.reply("Lu nggak punya izin `Manage Channels`!");
            }

            const channelId = args[0] || message.channel.id;
            const channelToDelete = message.guild.channels.cache.get(channelId);

            if (!channelToDelete) {
                return message.reply("Channel nggak ketemu. Pastiin ID-nya bener.");
            }

            try {
                const name = channelToDelete.name;
                await channelToDelete.delete();
                if (channelId !== message.channel.id) {
                    message.channel.send(`✅ Channel **${name}** berhasil dihapus.`);
                }
            } catch (err) {
                message.reply("Gagal hapus channel. Cek role bot.");
            }
        }

        // --- 2. Command !unbanall (Unban Semua User) ---
        if (command === 'unbanall') {
            // Proteksi: Hanya Admin atau Owner yang bisa unban massal
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply("Hanya Admin yang bisa pakai command ini!");
            }

            try {
                const guild = await client.guilds.fetch(targetGuildId);
                const bans = await guild.bans.fetch();

                if (bans.size === 0) return message.reply("Nggak ada user yang kena ban di server itu.");

                message.channel.send(`⏳ Sedang memproses unban untuk **${bans.size}** user...`);

                let count = 0;
                for (const [userId, banInfo] of bans) {
                    await guild.members.unban(userId);
                    count++;
                }

                message.channel.send(`✅ Berhasil unban **${count}** user di server **${guild.name}**.`);
            } catch (err) {
                console.error(err);
                message.reply("Terjadi kesalahan saat mencoba unban massal.");
            }
        }

        // --- 3. Command !listban (Cek siapa saja yang kena ban) ---
        if (command === 'listban') {
            try {
                const guild = await client.guilds.fetch(targetGuildId);
                const bans = await guild.bans.fetch();
                
                const list = bans.map(ban => `• ${ban.user.tag}`).join('\n') || "Kosong.";
                message.channel.send(`**Daftar Ban:**\n${list.substring(0, 1900)}`);
            } catch (err) {
                message.reply("Gagal narik data ban.");
            }
        }
    });

    console.log("✅ BanManager & Channel Control Active");
};
