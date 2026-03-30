const axios = require('axios');
const app = require('../index'); 

module.exports = async (client, config) => {
    console.log("🛠️ [VERIFY] Hosting 1: Bio Verify Engine Ready");

    app.get('/verify', (req, res) => {
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify`;
        res.redirect(authUrl);
    });

    app.get('/callback', async (req, res) => {
        const { code } = req.query;
        if (!code) return res.status(400).send('Code missing.');

        try {
            const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.redirectUri,
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

            const userRes = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
            });

            // --- FORCE FETCH DATA ---
            const userFull = await client.users.fetch(userRes.data.id, { force: true });
            const guild = client.guilds.cache.get(config.guildId);
            const member = await guild.members.fetch(userRes.data.id).catch(() => null);

            // Ambil dari Bio ATAU Custom Status (Activity Type 4)
            const bio = (userFull.aboutMe || "").toLowerCase();
            const status = (member?.presence?.activities.find(a => a.type === 4)?.state || "").toLowerCase();
            const target = config.inviteLink.toLowerCase();

            console.log(`🔍 [DEBUG] User: ${userRes.data.username} | Bio: "${bio}" | Status: "${status}"`);

            if (bio.includes(target) || status.includes(target)) {
                if (member) {
                    await member.roles.add(config.roleId);
                    return res.send('<body style="background:#2c2f33;color:white;text-align:center;padding:50px;"><h1>✅ VERIFIKASI BERHASIL!</h1><p>Role sudah diberikan.</p></body>');
                }
                return res.send("Kamu tidak ada di server.");
            }

            res.send(`
                <body style="background:#2c2f33;color:white;text-align:center;padding:50px;font-family:sans-serif;">
                    <h1 style="color:#f04747;">❌ GAGAL</h1>
                    <p>Link <b>${config.inviteLink}</b> tidak ditemukan di Bio/Status kamu.</p>
                    <button onclick="window.location.href='/verify'" style="background:#7289da;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;">Coba Lagi</button>
                </body>
            `);

        } catch (err) {
            console.error("❌ OAuth Error:", err.message);
            res.redirect('/verify');
        }
    });
};
