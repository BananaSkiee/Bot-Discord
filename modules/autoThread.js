/**
 * @module AutoThread
 * @description Professional Thread & Media Protection with Advanced V2 Components
 */

module.exports = function(client) {
    client.on("messageCreate", async (m) => {
        if (m.author.bot || !m.guild) return;

        const CH_MEDIA = "1477430329517277407";
        const CH_UPDATE = "1488059638074314832";
        const CH_QUEST = "1443255215460585563";

        // 🖼️ 1. GALLERY PROTECTION (Wajib Gambar/Video)
        if (m.channel.id === CH_MEDIA) {
            const hasMedia = m.attachments.size > 0 || m.videos.size > 0;
            
            if (!hasMedia) {
                await m.delete().catch(() => null);
                
                // Kirim Peringatan V2 (Tanpa field 'content' di luar)
                const warn = await m.channel.send({
                    flags: 32768,
                    components: [{
                        type: 17, 
                        components: [
                            { type: 10, content: "## <a:merah:1361623714541604894> Access Denied: Media Required" },
                            { type: 14 },
                            { type: 10, content: `**Hey <@${m.author.id}>, dilarang mengirim pesan teks saja di <#1477430329517277407>**\n> Sertakan gambar atau video untuk berinteraksi di sini.` },
                            { type: 14 },
                            { type: 10, content: "-# ( EmpireBS - Auto Detect System )" }
                        ]
                    }]
                }).catch(console.error);
                
                return setTimeout(() => warn.delete().catch(() => null), 5000);
            }

            // Jika Valid -> Reaksi & Thread
            await m.react('❤️').catch(() => null);
            const t = await m.startThread({ 
                name: "Tulis Komentar Disini...", 
                autoArchiveDuration: 1440 
            }).catch(() => null);

            if (t) {
                await t.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: "Silahkan berikan komentar yang positif di thread ini."
                        }]
                    }]
                }).catch(() => null);
            }
        }

        // 📢 2. DISCORD UPDATE & QUEST (Auto Thread Only)
        if (m.channel.id === CH_UPDATE || m.channel.id === CH_QUEST) {
            const isUpdate = m.channel.id === CH_UPDATE;
            const tName = isUpdate ? "Discord Update Thread" : "Discord Quest Discussion Thread";
            const tContent = isUpdate ? "Diskusikan update terbaru Discord di thread ini." : "Gunakan thread ini untuk membahas quest yang sedang berlangsung.";
            
            const t = await m.startThread({ name: tName }).catch(() => null);
            if (t) {
                await t.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{ type: 10, content: tContent }]
                    }]
                }).catch(() => null);
            }
        }
    });

    // 📩 3. FORUM AUTO RESPONSE
    client.on("threadCreate", async (thread) => {
        const FORUM_ID = "1487704896055541870";
        if (thread.parentId === FORUM_ID) {
            setTimeout(async () => {
                await thread.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: `<@${thread.ownerId}>, laporan Anda telah diterima. Harap tunggu staff kami membantu Anda.`
                        }]
                    }]
                }).catch(() => null);
            }, 2000);
        }
    });
};
