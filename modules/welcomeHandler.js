/**
 * @file welcomeHandler.js
 * @description Professional Component V2 Welcome Handler
 * @style Minimalist, High-Class, Symmetrical
 */

module.exports = (client) => {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const ROLE_ID = '1444248605761470595';
        const CHAN_ID = '1487716960530862090';

        if (!oldMember.roles.cache.has(ROLE_ID) && newMember.roles.cache.has(ROLE_ID)) {
            const channel = newMember.guild.channels.cache.get(CHAN_ID);
            if (!channel) return;

            try {
                await channel.send({
                    components: [
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    type: 10, // Text Section
                                    content: `Hey ${newMember}, ketik disini \`hx!help\` untuk\ninformasi lebih lanjut tentang free hosting nya.`
                                },
                                {
                                    type: 14 // Separator/Divider
                                },
                                {
                                    type: 10, // Footer Section
                                    content: "-# EmpireBS - Welcome To Create Hosting Free"
                                }
                            ]
                        }
                    ]
                });
            } catch (error) {
                // Silent error handling untuk menjaga kebersihan log
            }
        }
    });
};
