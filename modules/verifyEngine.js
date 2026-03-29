const { EmbedBuilder, ChannelType } = require('discord.js');
const axios = require('axios');
const app = require('../index'); 

module.exports = async (client, config) => {
    console.log("🛠️ [VERIFY] Bio Verify Engine Integrated (OAuth2)");

    app.get('/verify', (req, res) => {
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify`;
        res.redirect(authUrl);
    });

    app.get('/callback', async (req, res) => {
        const { code } = req.query;
        if (!code) return res.status(400).send('No code provided');

        try {
            const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.redirectUri,
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

            const accessToken = tokenResponse.data.access_token;

            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const userData = userResponse.data;
            
            // --- FIX AMBIL BIO ---
            // Kita ambil member dari server buat liat bionya
            const guild = client.guilds.cache.get(config.guildId);
            const member = await guild.members.fetch(userData.id);
            
            // Ambil bio dari user object (Pastikan SERVER MEMBERS INTENT ON di Dev Portal)
            const userFull = await member.user.fetch(true); 
            // Cek di banner_text atau di property profil (beberapa versi djs beda)
            const bio = userFull.aboutMe || ""; 

            console.log(`🔍 [DEBUG] User: ${userData.username} | Bio: ${bio}`);

            // Validasi: Cek apakah bio mengandung link (Case Insensitive)
            const inviteLink = config.inviteLink.toLowerCase();
            if (!bio || !bio.toLowerCase().includes(inviteLink)) {
                return res.send(`
                    <body style="background:#2c2f33; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:#f04747;">❌ VERIFIKASI GAGAL</h1>
                        <p>Link <b>${config.inviteLink}</b> tidak ditemukan di Bio (About Me) kamu.</p>
                        <p>Bio yang terdeteksi: <i>${bio || "(Kosong)"}</i></p>
                        <button onclick="window.location.href='/verify'" style="background:#7289da; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">Coba Lagi</button>
                    </body>
                `);
            }

            // KASIH ROLE
            await member.roles.add(config.roleId);
            await logToForum(client, userData, member, config.inviteLink);

            res.send(`
                <body style="background:#2c2f33; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                    <h1 style="color:#43b581;">✅ VERIFIKASI BERHASIL!</h1>
                    <p>Selamat <b>${userData.username}</b>, role Verified sudah diberikan.</p>
                </body>
            `);

        } catch (err) {
            // Error "Invalid Code" biasanya karena refresh halaman atau code expired
            if (err.response?.data?.error === "invalid_grant") {
                return res.redirect('/verify'); 
            }
            console.error("❌ OAuth Error:", err.message);
            res.status(500).send('Sistem Error. Coba klik verifikasi ulang.');
        }
    });

    async function logToForum(client, user, member, link) {
        try {
            const logChannelId = "1428789734993432676"; 
            const logChannel = await client.channels.fetch(logChannelId);
            if (logChannel) {
                await logChannel.threads.create({
                    name: `Log Bio: ${user.username}`,
                    message: { content: `✅ **${user.username}** berhasil verifikasi bio!\n🔗 Link: \`${link}\`` }
                });
            }
        } catch (e) { console.error("Gagal Log Forum:", e.message); }
    }
};
