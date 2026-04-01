/**
 * @module AutoThread
 * @description Professional Thread & Media Protection with Advanced V2 Components
 */

module.exports = {
    async handleAutoThread(m) {
        if (m.author.bot) return;

        const CH_MEDIA = "1477430329517277407";
        const CH_UPDATE = "1488059638074314832";
        const CH_QUEST = "1443255215460585563";

        // 🖼️ 1. GALLERY PROTECTION (Wajib Gambar/Video)
        if (m.channel.id === CH_MEDIA) {
            const hasMedia = m.attachments.size > 0 || m.content.includes("https://");
            
            if (!hasMedia) {
                await m.delete().catch(() => null);
                // Kirim Peringatan pake Template V2 lo
                const warn = await m.channel.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [
                            { type: 10, content: "## <a:merah:1361623714541604894> You can't send messages without pictures/videos" },
                            { type: 14 },
                            { type: 10, content: `**Hey <@${m.author.id}>, tidak boleh hanya mengirim pesan di <#1477430329517277407>**\n> Kamu harus tambahkan gambar untuk mengirimnya` },
                            { type: 14 },
                            { type: 10, content: "-# ( EmpireBS - Auto Detect Messages" }
                        ]
                    }]
                });
                return setTimeout(() => warn.delete().catch(() => null), 6000);
            }

            // Jika Valid (Ada Media)
            await m.react('❤️').catch(() => null);
            const t = await m.startThread({ name: "Tulis Komentar Disini...", autoArchiveDuration: 1440 });
            if (t) {
                await t.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: "Anda dapat berkomentar di sini, komentar yang positif"
                        }]
                    }]
                }).catch(() => null);
            }
        }

        // 📢 2. DISCORD UPDATE & QUEST
        if (m.channel.id === CH_UPDATE || m.channel.id === CH_QUEST) {
            const isUpdate = m.channel.id === CH_UPDATE;
            const tName = isUpdate ? "Discord Update Thread" : "Discord Quest Discussion Thread";
            const tContent = isUpdate ? "Anda dapat berdiskusi di sini tentang update tersebut." : "Anda dapat berdiskusi di sini tentang quest tersebut.";
            
            const t = await m.startThread({ name: tName });
            if (t) {
                await t.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{ type: 10, content: tContent }]
                    }]
                }).catch(() => null);
            }
        }
    }
};
