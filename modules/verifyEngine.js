const { EmbedBuilder, ChannelType } = require('discord.js');
const axios = require('axios');

// Kita ambil 'app' dari index.js supaya GAK BENTROK PORT
const app = require('../index'); 

module.exports = async (client, config) => {
    console.log("🛠️ [VERIFY] Registering OAuth2 Routes to Main Server...");

    // 1. Endpoint Awal (User klik link di Bio)
    app.get('/verify', (req, res) => {
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify`;
        res.redirect(authUrl);
    });

    // 2. Callback OAuth2 (Proses Cek Bio & Kasih Role)
    app.get('/callback', async (req, res) => {
        const { code } = req.query;
        if (!code) return res.status(400).send('No code provided');

        try {
            // Tukar code dengan Access Token
            const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.redirectUri,
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

            const accessToken = tokenResponse.data.access_token;

            // Ambil Data User
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const userData = userResponse.data;
            // Ambil Bio (About Me)
            const bio = userData.notes || userData.banner_text || ""; 

            // LOGIKA DETEKSI BIO (Ganti config.inviteLink di .env)
            if (config.inviteLink !== "none" && !bio.includes(config.inviteLink)) {
                return res.send(`
                    <body style="background:#2c2f33; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:#f04747;">❌ VERIFIKASI GAGAL</h1>
                        <p>Kamu belum memasang link: <b>${config.inviteLink}</b> di Bio Discord kamu.</p>
                        <p>Silakan pasang dulu, lalu klik tombol di bawah:</p>
                        <button onclick="window.location.href='/verify'" style="background:#7289da; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">Coba Lagi</button>
                    </body>
                `);
            }

            // KASIH ROLE
            const guild = client.guilds.cache.get(config.guildId);
            const member = await guild.members.fetch(userData.id);

            if (member) {
                await member.roles.add(config.roleId);
                
                // JALANKAN LOGGING KE FORUM (Fitur Sistem Lama)
                await logToForum(client, userData, member);

                res.send(`
                    <body style="background:#2c2f33; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:#43b581;">✅ VERIFIKASI BERHASIL!</h1>
                        <p>Selamat ${userData.username}, kamu sekarang adalah Verified Member.</p>
                        <p>Silakan kembali ke Discord dan cek channel baru!</p>
                    </body>
                `);
            }

        } catch (err) {
            console.error("❌ OAuth Error:", err.response?.data || err.message);
            res.status(500).send('Terjadi kesalahan sistem. Coba lagi nanti.');
        }
    });

    // 3. FUNGSI LOGGING (Pindahan dari sistem lama lu)
    async function logToForum(client, user, member) {
        try {
            const logChannelId = "1428789734993432676"; // ID Forum Log Lu
            const logChannel = await client.channels.fetch(logChannelId);
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) return;

            await logChannel.threads.create({
                name: `Log Bio: ${user.username}`,
                message: { content: `✅ **${user.username}** berhasil verifikasi bio!\n🆔 ID: ${user.id}\n🔗 Link Detect: ${config.inviteLink}` }
            });
        } catch (e) { console.error("Gagal Log Forum:", e); }
    }
};
