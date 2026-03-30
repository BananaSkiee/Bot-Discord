const { ChannelType } = require('discord.js');
const axios = require('axios');
const app = require('../index'); 

module.exports = async (client, config) => {
    console.log("🛠️ [VERIFY] Hosting 1: Bio Verify Engine Ready (No Welcome Message)");

    app.get('/verify', (req, res) => {
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify`;
        res.redirect(authUrl);
    });

    app.get('/callback', async (req, res) => {
        const { code } = req.query;
        if (!code) return res.status(400).send('Authentication code missing.');

        try {
            // Tukar Code ke Access Token
            const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.redirectUri,
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

            const accessToken = tokenResponse.data.access_token;

            // Ambil data user dasar
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const userData = userResponse.data;

            // AMBIL BIO (About Me)
            // Paksa fetch dari client bot agar data profil terbaru masuk
            const userFull = await client.users.fetch(userData.id, { force: true });
            
            // Di djs v14 terbaru, bio ada di banner_text (internal) atau presence (jika ada)
            // Tapi cara paling aman buat 'About Me' adalah cek banner_text / accent_color
            const bio = userFull.aboutMe || ""; 

            console.log(`🔍 [DEBUG] Host 1 - User: ${userData.username} | Bio: ${bio}`);

            const targetLink = config.inviteLink.toLowerCase();
            if (!bio.toLowerCase().includes(targetLink)) {
                return res.send(`
                    <body style="background:#2c2f33; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:#f04747;">❌ VERIFIKASI GAGAL</h1>
                        <p>Link <b>${config.inviteLink}</b> tidak ditemukan di About Me kamu.</p>
                        <p>Bio terdeteksi: <i>${bio || "(Kosong)"}</i></p>
                        <button onclick="window.location.href='/verify'" style="background:#7289da; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">Coba Lagi</button>
                    </body>
                `);
            }

            // KASIH ROLE
            const guild = client.guilds.cache.get(config.guildId);
            const member = await guild.members.fetch(userData.id);

            if (member) {
                await member.roles.add(config.roleId);
                
                // Log ke Forum
                await logToForum(client, userData, config.inviteLink);

                res.send(`
                    <body style="background:#2c2f33; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:#43b581;">✅ VERIFIKASI BERHASIL!</h1>
                        <p>Role Verified sudah diberikan ke akun <b>${userData.username}</b>.</p>
                    </body>
                `);
            }

        } catch (err) {
            console.error("❌ OAuth Error Host 1:", err.message);
            res.redirect('/verify');
        }
    });

    async function logToForum(client, user, link) {
        try {
            const forumId = "1428789734993432676";
            const channel = await client.channels.fetch(forumId);
            if (channel && channel.type === ChannelType.GuildForum) {
                await channel.threads.create({
                    name: `Log Bio: ${user.username}`,
                    message: { content: `✅ **${user.username}** berhasil verifikasi bio di Hosting 1.\n🔗 Link: \`${link}\`` }
                });
            }
        } catch (e) { /* ignore */ }
    }
};
    
