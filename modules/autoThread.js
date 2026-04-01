//modules/autoThread.js
/**
 * @module AutoThread
 * @description Professional Thread & Media Protection - World Class Edition
 */

module.exports = function(client) {
    client.on("messageCreate", async (m) => {
        if (!m.guild) return;

        const CH_MEDIA = "1477430329517277407";
        const CH_UPDATE = "1488059638074314832";
        const CH_QUEST = "1443255215460585563";
        const BOT_QUEST_ID = "1379246675171999826";

        // 🖼️ 1. GALLERY PROTECTION (ID: 1477430329517277407)
        if (m.channel.id === CH_MEDIA && !m.author.bot) {
            const hasMedia = m.attachments.size > 0 || m.stickers.size > 0;
            
            if (!hasMedia) {
                // Template Peringatan V2 (Hapus setelah 5 detik)
                const warnPayload = {
                    flags: 32768,
                    components: [{
                        type: 17, components: [
                            { type: 10, content: "## <a:merah:1361623714541604894> You can't send messages without pictures/videos" },
                            { type: 14 },
                            { type: 10, content: `**Hey <@${m.author.id}>, tidak boleh hanya mengirim pesan di <#1477430329517277407>**\n> Kamu harus tambakan gambar, untuk mengirimmya` },
                            { type: 14 },
                            { type: 10, content: "-# ( EmpireBS - Auto Detact Masaages" }
                        ]
                    }]
                };

                await m.reply(warnPayload).then(msg => {
                    setTimeout(() => {
                        m.delete().catch(() => null);
                        msg.delete().catch(() => null);
                    }, 5000);
                }).catch(() => m.delete().catch(() => null));
                return;
            }

            // Jika ada media: Auto Reaction & Thread
            await m.react('❤️').catch(() => null);
            const thread = await m.startThread({ 
                name: "Tulis Komentar Disini...", 
                autoArchiveDuration: 1440 
            }).catch(() => null);

            if (thread) {
                await thread.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: "Silahkan berikan komentar yang positif di thread ini."
                        }]
                    }]
                }).catch(() => null);
            }
        }

        // 📢 2. DISCORD UPDATE (ID: 1488059638074314832) - Khusus Bot Pengumuman (Webhook/Followed)
        if (m.channel.id === CH_UPDATE && m.author.bot) {
            const tUpdate = await m.startThread({ name: "Discord Update Discussion" }).catch(() => null);
            if (tUpdate) {
                await tUpdate.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: "Diskusikan update terbaru Discord di thread ini."
                        }]
                    }]
                }).catch(() => null);
            }
        }

        // 🎁 3. DISCORD QUEST (ID: 1443255215460585563) - Cuma untuk Bot ID Tertentu
        if (m.channel.id === CH_QUEST && m.author.id === BOT_QUEST_ID) {
            const tQuest = await m.startThread({ name: "Discord Quest Discussion" }).catch(() => null);
            if (tQuest) {
                await tQuest.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: "Gunakan thread ini untuk membahas quest yang sedang berlangsung."
                        }]
                    }]
                }).catch(() => null);
            }
        }
    });
};
