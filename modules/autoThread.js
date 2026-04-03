/**
 * @module AutoThread
 * @description Professional Thread & Media Protection - World Class Edition (Public Mode)
 * @author BananaSkiee Systems
 */

module.exports = function(client) {
    client.on("messageCreate", async (m) => {
        if (!m.guild || m.author.bot) return; // Tetap abaikan bot lain biar gak looping, tapi human bisa semua.

        const CH = {
            MEDIA: "1477430329517277407",
            UPDATE: "1488059638074314832",
            QUEST: "1443255215460585563"
        };

        // 🖼️ 1. GALLERY PROTECTION (Wajib Gambar/Video) - <#1477430329517277407>
        if (m.channel.id === CH.MEDIA) {
            const hasMedia = m.attachments.size > 0 || m.stickers.size > 0 || m.content.includes("https://");
            
            if (!hasMedia) {
                // Template Peringatan V2 (Sesuai Request Lo)
                const warnPayload = {
                    flags: 32768,
                    components: [{
                        type: 17, components: [
                            { type: 10, content: "## <a:merah:1361623714541604894> You can't send messages without pictures/videos" },
                            { type: 14 },
                            { type: 10, content: `**Hey <@${m.author.id}>, tidak boleh hanya mengirim pesan di <#1477430329517277407>**\n> Kamu harus tambahkan gambar, untuk mengirimnya` },
                            { type: 14 },
                            { type: 10, content: "-# ( EmpireBS - Auto Detect Messages" }
                        ]
                    }]
                };

                // Hapus pesan asli dan kirim peringatan
                await m.delete().catch(() => null);
                const warnMsg = await m.channel.send(warnPayload).catch(() => null);
                
                if (warnMsg) {
                    setTimeout(() => warnMsg.delete().catch(() => null), 6000);
                }
                return;
            }

            // Jika Ada Media: Reaction ❤️ & Auto Thread
            await m.react('❤️').catch(() => null);
            const thread = await m.startThread({ 
                name: "Tulis Komentar Disini...", 
                autoArchiveDuration: 1440,
                type: 11
            }).catch(() => null);

            if (thread) {
                await thread.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: "Anda dapat berkomentar di sini, komentar yang positif"
                        }]
                    }]
                }).catch(() => null);
            }
        }

        // 📢 2. DISCORD UPDATE THREAD - <#1488059638074314832> (Public Bisa Memicu)
        if (m.channel.id === CH.UPDATE) {
            const tUpdate = await m.startThread({ 
                name: "Discord Update Thread",
                autoArchiveDuration: 1440,
                type: 11
            }).catch(() => null);

            if (tUpdate) {
                await tUpdate.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: "Anda dapat berdiskusi di sini tentang update tersebut."
                        }]
                    }]
                }).catch(() => null);
            }
        }

        // 🎁 3. DISCORD QUEST THREAD - <#1443255215460585563> (Public Bisa Memicu)
        if (m.channel.id === CH.QUEST) {
            const tQuest = await m.startThread({ 
                name: "Discord Quest Discussion Thread",
                autoArchiveDuration: 1440,
                type: 11
            }).catch(() => null);

            if (tQuest) {
                await tQuest.send({
                    flags: 32768,
                    components: [{
                        type: 17, components: [{
                            type: 10, content: "Anda dapat berdiskusi di sini tentang quest tersebut."
                        }]
                    }]
                }).catch(() => null);
            }
        }
    });

    console.log("💎 [AutoThread] Public Mode & V2 Components Active!");
};
