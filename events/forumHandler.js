/**
 * @event threadCreate
 * @description Handle Forum Auto-Response for ID 1487704896055541870
 */

module.exports = {
    name: "threadCreate",
    async execute(thread) {
        const FORUM_ID = "1487704896055541870";
        
        // Cek apakah thread dibuat di forum tujuan
        if (thread.parentId === FORUM_ID) {
            // Kasih delay biar thread bener-bener siap di API Discord
            setTimeout(async () => {
                try {
                    await thread.send({
                        flags: 32768,
                        components: [{
                            type: 17, components: [{
                                type: 10, content: `<@${thread.ownerId}> harap tunggu, kami akan segera membantu Anda.`
                            }]
                        }]
                    });
                } catch (err) {
                    console.error("❌ Forum Response Error:", err.message);
                }
            }, 3000);
        }
    }
};
