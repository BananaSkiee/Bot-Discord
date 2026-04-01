//events/forumHandler.js
/**
 * @event threadCreate
 * @description Professional Forum Response - Single Message Edition
 */

module.exports = {
    name: "threadCreate",
    async execute(thread) {
        const FORUM_ID = "1487704896055541870";
        
        if (thread.parentId === FORUM_ID) {
            // Berikan sedikit delay 2 detik agar thread terdaftar sempurna
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
                    console.error("❌ Forum Response Failure:", err.message);
                }
            }, 2000);
        }
    }
};
