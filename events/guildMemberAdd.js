const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const generateWelcomeCard = require('../modules/welcomeCard.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {

        console.log(`\n👋 [JOIN] ${member.user.tag} (${member.user.bot ? 'BOT' : 'HUMAN'})`);
        
        // ========== FITUR UNTUK BOT & HUMAN ==========
        if (member.user.bot) {
            try {
                const botRoleId = "1401061819195592785";
                await member.roles.add(botRoleId);
                await member.setNickname("BS");
                console.log(`✅ [BOT] Role & Nickname diproses`);
            } catch (err) {
                console.error(`❌ [BOT] Gagal memproses bot: ${err.message}`);
            }
        } else {
            const ROLE_NON_VERIFY = "1444248589051367435";
            try {
                await member.roles.add(ROLE_NON_VERIFY);
                console.log(`✅ [HUMAN] Role Non-Verify diberikan`);
            } catch (err) {
                console.error(`❌ [HUMAN] Gagal memberi role: ${err.message}`);
            }
        }
        
        // --- PENGATURAN ID DARI JSON BARU ---
        const welcomeChannelId = '1352404526870560788';
        const rulesChannelId   = '1363352240638918689';
        const rolesChannelId   = '1352823970054803509';
        const introChannelId   = '1430930313382461460';
        const bannerUrl        = "https://cdn.discordapp.com/attachments/1443915399124226140/1446058830998933596/Teks_paragraf_Anda_20251024_194308_0000.png?ex=69d2c8fb&is=69d1777b&hm=2c6874e0c6c4689c956a136f1f89d82812775471be18a1c9563a2a1bc219926f&";

        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        if (!welcomeChannel) return;

        try {
            // Mengambil buffer welcome card (jika masih ingin pakai canvas)
            const imageBuffer = await generateWelcomeCard(member);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome-card.png' });

            // Deskripsi sesuai permintaan JSON
            const descriptionText = 
                `**__Welcome To EmpireBS__**\n\n` +
                `<:arrow:1415310592800981022> **___**[Rules](https://discord.com/channels/${member.guild.id}/${rulesChannelId})**___**\n` +
                `<:arrow:1415310592800981022> **___**[Verified](https://discord.com/channels/${member.guild.id}/${rolesChannelId})**___**\n` +
                `<:arrow:1415310592800981022> **___**[Intro Card](https://discord.com/channels/${member.guild.id}/${introChannelId})**___**\n\n` +
                `Sekarang kami memiliki ${member.guild.memberCount} anggota`;

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#2b2d31') // Warna gelap agar mirip UI Discord baru
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(descriptionText)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setImage(bannerUrl) // Menggunakan banner dari JSON kamu
                // Jika ingin tetap pakai welcome card buatan sendiri, ganti baris di atas jadi: .setImage('attachment://welcome-card.png')
                .setFooter({ text: '© EmpireBS Community', iconURL: member.guild.iconURL() })
                .setTimestamp();
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Rules')
                        .setEmoji('📖')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${member.guild.id}/${rulesChannelId}`),
                    
                    new ButtonBuilder()
                        .setLabel('Verified')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${member.guild.id}/${rolesChannelId}`),

                    new ButtonBuilder()
                        .setLabel('Intro Card')
                        .setEmoji('🪪')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${member.guild.id}/${introChannelId}`)
                );

            await welcomeChannel.send({
                content: `<@${member.id}>`, // Tag user di luar embed
                embeds: [welcomeEmbed], 
                // files: [attachment], // Aktifkan jika .setImage pakai attachment
                components: [row] 
            });

            console.log(`✅ Welcome Message (EmpireBS Style) terkirim!`);

        } catch (error) {
            console.error(`❌ ERROR: ${error.message}`);
        }
    },
};
