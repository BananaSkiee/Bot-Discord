// modules/verifyEngine.js
const { EmbedBuilder, ChannelType } = require('discord.js');
const axios = require('axios');

// Ambil 'app' dari index.js supaya satu port (3000)
const app = require('../index'); 

module.exports = async (client, config) => {
    console.log("🛠️ [VERIFY] Bio Verify Engine Integrated (OAuth2)");

    // 1. Endpoint Awal (Redirect ke Discord)
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

            // Ambil Data User Dasar dari OAuth
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const userData = userResponse.data;
            
            // --- LOGIKA CEK BIO (ABOUT ME) ---
            // Kita fetch ulang user lewat Client Bot biar bisa akses About Me / Profile
            const userFull = await client.users.fetch(userData.id, { force: true });
            
            // Ambil bio dari banner_text atau about_me (Discord API terkadang beda penamaan)
            const bio = userFull.bannerText || userFull.accentColor || ""; 
            
            // Debug Log: Liat apa yang dibaca bot
            console.log(`🔍 [DEBUG] User: ${userData.username} | Bio Detected: ${bio}`);

            // Cek apakah link ada di bio
            const isVerified = bio.toLowerCase().includes(config.inviteLink.toLowerCase());

            if (!isVerified) {
                return res.send(`
                    <body style="background:#2c2f33; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:#f04747;">❌ VERIFIKASI GAGAL</h1>
                        <p>Link <b>${config.inviteLink}</b> tidak ditemukan di About Me kamu.</p>
                        <p>Pastikan kamu sudah memasangnya di profil Discord, lalu klik tombol di bawah.</p>
                        <button onclick="window.location.href='/verify'" style="background:#7289da; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Coba Lagi</button>
                    </body>
                `);
            }

            // KASIH ROLE JIKA LOLOS
            const guild = client.guilds.cache.get(config.guildId);
            const member = await guild.members.fetch(userData.id);

            if (member) {
                await member.roles.add(config.roleId);
                
                // Kirim log ke Forum
                await logToForum(client, userData, member, config.inviteLink);

                res.send(`
                    <body style="background:#2c2f33; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:#43b581;">✅ VERIFIKASI BERHASIL!</h1>
                        <p>Selamat <b>${userData.username}</b>, role Verified sudah diberikan.</p>
                        <p>Silakan kembali ke Discord Community!</p>
                    </body>
                `);
            }

        } catch (err) {
            const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            console.error("❌ OAuth Error:", errorDetail);
            res.status(500).send('Sistem Error. Pastikan Bot sudah di-restart dan Client Secret benar.');
        }
    });

    // 3. FUNGSI LOGGING FORUM
    async function logToForum(client, user, member, link) {
        try {
            const logChannelId = "1428789734993432676"; 
            const logChannel = await client.channels.fetch(logChannelId);
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) return;

            await logChannel.threads.create({
                name: `Log Bio: ${user.username}`,
                message: { 
                    content: `✅ **${user.username}** (ID: ${user.id}) berhasil verifikasi!\n🔗 Link Detect: \`${link}\`\n📅 Tanggal: <t:${Math.floor(Date.now() / 1000)}:F>` 
                }
            });
        } catch (e) { 
            console.error("⚠️ Gagal Log Forum:", e.message); 
        }
    }
};
