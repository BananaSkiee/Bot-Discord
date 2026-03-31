/**
 * @module AutoThread
 * @description Auto Thread, Media Protection, & Forum Response
 */

module.exports = (client) => {
    const CHANNELS = {
        MEDIA: "1477430329517277407",
        DISCORD_UPDATE: "1488059638074314832",
        QUEST: "1443255215460585563",
        FORUM: "1487704896055541870"
    };

    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // --- PROTEKSI & AUTO THREAD CHANNEL MEDIA ---
        if (message.channel.id === CHANNELS.MEDIA) {
            const hasMedia = message.attachments.size > 0;
            
            if (!hasMedia) {
                // Jika hanya teks, hapus dan beri peringatan
                await message.delete().catch(() => null);
                const warn = await message.channel.send(`⚠️ <@${message.author.id}>, di channel ini wajib mengirim gambar/video!`).catch(() => null);
                setTimeout(() => warn.delete().catch(() => null), 5000);
                return;
            }

            // Jika ada media, beri reaksi ❤️ dan buat thread
            await message.react('❤️').catch(() => null);
            const thread = await message.startThread({
                name: "Tulis Komentar Disini...",
                autoArchiveDuration: 1440
            }).catch(() => null);

            if (thread) {
                await thread.send({
                    content: "Anda dapat berkomentar di sini, komentar yang positif"
                }).catch(() => null);
            }
        }

        // --- AUTO THREAD CHANNEL UPDATE ---
        if (message.channel.id === CHANNELS.DISCORD_UPDATE) {
            const thread = await message.startThread({
                name: "Discord Update Thread",
                autoArchiveDuration: 1440
            }).catch(() => null);
            if (thread) {
                await thread.send({
                    content: "Anda dapat berdiskusi di sini tentang update tersebut."
                }).catch(() => null);
            }
        }

        // --- AUTO THREAD CHANNEL QUEST ---
        if (message.channel.id === CHANNELS.QUEST) {
            const thread = await message.startThread({
                name: "Discord Quest Discussion Thread",
                autoArchiveDuration: 1440
            }).catch(() => null);
            if (thread) {
                await thread.send({
                    content: "Anda dapat berdiskusi di sini tentang quest tersebut."
                }).catch(() => null);
            }
        }
    });

    // --- AUTO RESPONSE FORUM ---
    client.on('threadCreate', async (thread) => {
        if (thread.parentId === CHANNELS.FORUM) {
            // Tunggu sebentar agar thread benar-benar siap
            setTimeout(async () => {
                const ownerId = thread.ownerId;
                await thread.send({
                    content: `<@${ownerId}> harap tunggu, kami akan segera membantu Anda.`
                }).catch(() => null);
            }, 2000);
        }
    });

    console.log("✅ AutoThread & Forum Module Active");
};
