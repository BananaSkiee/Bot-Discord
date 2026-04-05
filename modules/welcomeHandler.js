/**
 * @file welcomeHandler.js
 * @description World-Class Professional Component V2 Architecture
 * @style Symmetrical, Modern, Elite
 */

module.exports = (client) => {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const ROLE_ID = '1444248605761470595';
        const CHAN_ID = '1487716960530862090';

        const hadRole = oldMember.roles.cache.has(ROLE_ID);
        const hasRole = newMember.roles.cache.has(ROLE_ID);

        if (!hadRole && hasRole) {
            try {
                const channel = client.channels.cache.get(CHAN_ID) || await client.channels.fetch(CHAN_ID);
                if (!channel) return;

                // MENGGUNAKAN RAW DATA UNTUK MENGHINDARI VALIDASI LIBRARY YANG KETINGGALAN ZAMAN
                await channel.send({
                    components: [
                        {
                            type: 17, // Container (Component V2)
                            components: [
                                {
                                    type: 10, // Section
                                    content: `Hey ${newMember}, ketik disini \`hx!help\`, untuk\ninformasi lebih lanjut tentang free hosting nya.`
                                },
                                {
                                    type: 14 // Separator (Divider)
                                },
                                {
                                    type: 10, // Footer Section
                                    content: "-# EmpireBS - Welcome To Create Hosting Free"
                                }
                            ]
                        }
                    ]
                });

                console.log(`[SYSTEM] Component V2 Welcome delivered to ${newMember.user.tag}`);
            } catch (err) {
                console.error(`❌ Component V2 Error: ${err.message}`);
                
                // FALLBACK: Jika Discord API menolak Type 17 via .send(), 
                // ini adalah satu-satunya cara agar bot tidak crash.
            }
        }
    });
};
