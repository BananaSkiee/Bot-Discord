const axios = require('axios');

module.exports = async (client, config) => {
    const express = require('express');
    const app = express();

    console.log("🛠️ [VERIFY] Hosting 1: Bio Verify Engine Ready");

    // Store pending verifications
    const pendingVerifications = new Map();

    app.get('/verify', (req, res) => {
        const state = Math.random().toString(36).substring(7);
        const userId = req.query.userId; // Pass dari Discord button
        
        pendingVerifications.set(state, {
            userId: userId,
            timestamp: Date.now()
        });

        // Bersihin expired (5 menit)
        setTimeout(() => pendingVerifications.delete(state), 5 * 60 * 1000);

        const authUrl = `https://discord.com/oauth2/authorize?` +
            `client_id=${config.clientId}` +
            `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
            `&response_type=code` +
            `&scope=identify` +  // Scope identify untuk baca profile
            `&state=${state}`;

        res.redirect(authUrl);
    });

    app.get('/callback', async (req, res) => {
        const { code, state } = req.query;
        
        if (!code || !state) {
            return res.status(400).send('Missing parameters');
        }

        const pending = pendingVerifications.get(state);
        if (!pending) {
            return res.send('Session expired. Coba lagi dari Discord.');
        }

        try {
            // Step 1: Exchange code for access token
            const tokenRes = await axios.post('https://discord.com/api/v10/oauth2/token',
                new URLSearchParams({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: config.redirectUri
                }), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );

            const accessToken = tokenRes.data.access_token;

            // Step 2: Fetch user data dengan BIO (via User API, bukan Bot API!)
            const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
                headers: { 
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const userData = userRes.data;
            const bio = userData.bio || ''; // BIO ADA DI SINI!
            
            console.log(`🔍 [DEBUG] User: ${userData.username} | Bio: "${bio}"`);

            // Step 3: Validasi
            const target = config.inviteLink.toLowerCase();
            const hasInvite = bio.toLowerCase().includes(target) || 
                             bio.toLowerCase().includes(`discord.gg/${target}`);

            // Step 4: Grant/Revoke role
            const guild = await client.guilds.fetch(config.guildId);
            const member = await guild.members.fetch(pending.userId);

            if (!member) {
                return res.send('Kamu tidak ada di server.');
            }

            if (hasInvite) {
                // SUCCESS - Grant V2
                await member.roles.add(config.roleId);
                
                // Hapus NV2 jika ada
                const nv2Role = '1444248606579097640';
                if (member.roles.cache.has(nv2Role)) {
                    await member.roles.remove(nv2Role);
                }

                // Log
                const logCh = client.channels.cache.get('1352800131933802547');
                if (logCh) logCh.send(`✅ **Bio Verified**: ${member.user.tag}`);

                res.send(`
                    <html>
                    <head>
                        <meta http-equiv="refresh" content="3;url=https://discord.com/channels/${config.guildId}">
                        <style>
                            body { background: #36393f; color: white; font-family: sans-serif; text-align: center; padding: 50px; }
                            .success { color: #43b581; font-size: 48px; }
                        </style>
                    </head>
                    <body>
                        <div class="success">✅</div>
                        <h1>Verifikasi Berhasil!</h1>
                        <p>Bio terdeteksi: <code>${bio}</code></p>
                        <p>Role diberikan. Redirecting...</p>
                    </body>
                    </html>
                `);

            } else {
                // FAILED - Bio tidak valid
                res.send(`
                    <html>
                    <style>
                        body { background: #36393f; color: white; font-family: sans-serif; text-align: center; padding: 50px; }
                        .fail { color: #f04747; }
                        code { background: #2f3136; padding: 2px 6px; border-radius: 3px; }
                        button { background: #5865f2; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; margin-top: 20px; }
                    </style>
                    <body>
                        <h1 class="fail">❌ Verifikasi Gagal</h1>
                        <p>Bio kamu: <code>${bio || '(kosong)'}</code></p>
                        <p>Harus mengandung: <code>${config.inviteLink}</code></p>
                        <button onclick="location.href='/verify?userId=${pending.userId}'">Coba Lagi</button>
                    </body>
                    </html>
                `);
            }

            // Revoke token (cleanup)
            await axios.post('https://discord.com/api/v10/oauth2/token/revoke',
                new URLSearchParams({ token: accessToken }), {
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
                    }
                }
            ).catch(() => {});

        } catch (err) {
            console.error("❌ OAuth Error:", err.response?.data || err.message);
            res.send('Error: ' + (err.response?.data?.error_description || 'Unknown error'));
        }
    });

    // Mount ke server yang sudah ada di index.js
    const mainApp = require('../index');
    mainApp.use(app);
};
