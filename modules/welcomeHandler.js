module.exports = (client) => {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const ROLE_ID = '1444248605761470595';
        const CHAN_ID = '1487716960530862090';

        // Pastikan role benar-benar ditambahkan (bukan perubahan nickname/role lain)
        const hadRole = oldMember.roles.cache.has(ROLE_ID);
        const hasRole = newMember.roles.cache.has(ROLE_ID);

        if (!hadRole && hasRole) {
            try {
                // Gunakan fetch jika channel tidak ditemukan di cache
                const channel = client.channels.cache.get(CHAN_ID) || await client.channels.fetch(CHAN_ID);
                if (!channel) return console.error(`[Error] Channel ${CHAN_ID} tidak ditemukan.`);

                await channel.send({
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 10,
                                    content: `Hey ${newMember}, ketik disini \`hx!help\` untuk\ninformasi lebih lanjut tentang free hosting nya.`
                                },
                                {
                                    type: 14
                                },
                                {
                                    type: 10,
                                    content: "-# EmpireBS - Welcome To Create Hosting Free"
                                }
                            ]
                        }
                    ]
                });
                console.log(`✅ Welcome sent to ${newMember.user.tag}`);
            } catch (err) {
                console.error(`❌ Gagal mengirim welcome: ${err.message}`);
            }
        }
    });
};
