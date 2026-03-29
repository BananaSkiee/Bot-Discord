const express = require('express');
const axios = require('axios');
const app = express();

/**
 * @param {Client} client - Discord Client Instance
 * @param {Object} config - { clientId, clientSecret, redirectUri, roleId, inviteLink, port }
 */
module.exports = (client, config) => {
    
    app.get('/verify', (req, res) => {
        const url = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify%20guilds.join`;
        res.redirect(url);
    });

    app.get('/callback', async (req, res) => {
        const { code } = req.query;
        if (!code) return res.status(400).send('❌ Auth Code Missing');

        try {
            // [STEP 1] EXCHANGE CODE FOR TOKEN
            const tokenParams = new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: config.redirectUri,
            });

            const tokenRes = await axios.post('https://discord.com/api/oauth2/token', tokenParams, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const access_token = tokenRes.data.access_token;

            // [STEP 2] FETCH PROFILE & CHECK BIO
            const userRes = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const { id, username, bio } = userRes.data;
            const hasLink = bio && bio.includes(config.inviteLink);

            if (hasLink) {
                // [STEP 3] GIVE ROLE (TOP TIER LOGIC)
                const guild = client.guilds.cache.first(); // Ambil server pertama atau tentukan ID
                const member = await guild.members.fetch(id).catch(() => null);

                if (member) {
                    await member.roles.add(config.roleId);
                    // LOG KE CONSOLE SECARA PROFESIONAL
                    console.log(`[VERIFY] ✅ ${username} (${id}) - Bio Valid & Role Added`);
                    res.send(`<h1>✅ Verifikasi Berhasil!</h1><p>Halo ${username}, link ditemukan di Bio. Role telah diberikan.</p>`);
                } else {
                    res.send(`<h1>⚠️ User Tidak Di Server</h1><p>Join dulu servernya baru verifikasi bos!</p>`);
                }
            } else {
                res.send(`<h1>❌ Verifikasi Gagal</h1><p>Link <b>${config.inviteLink}</b> tidak ditemukan di Bio profilmu!</p>`);
            }
        } catch (err) {
            console.error('[ERROR-OAUTH2]', err.response?.data || err.message);
            res.status(500).send('<h1>🔥 Internal Server Error</h1>');
        }
    });

    app.listen(config.port, () => {
        console.log(`[WEB-SERVER] 🚀 Gateway Active on Port ${config.port}`);
    });
};
