const axios = require('axios');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Store pending verifications (in-memory, bisa pindah ke Redis/DB untuk production)
const pendingVerifications = new Map();

module.exports = async (client, config) => {
    const express = require('express');
    const app = express();

    console.log("🛠️ [VERIFY] Hosting 1: Bio Verify Engine Ready");

    // ═══════════════════════════════════════════════════════════════
    // ROUTE 1: /verify - Generate OAuth URL dengan state
    // ═══════════════════════════════════════════════════════════════
    app.get('/verify', (req, res) => {
        const { userId, guildId } = req.query;
        
        if (!userId || !guildId) {
            return res.status(400).send('Missing userId or guildId');
        }

        // Generate random state
        const state = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
        
        // Simpan ke map (expire 5 menit)
        pendingVerifications.set(state, {
            userId: userId,
            guildId: guildId,
            timestamp: Date.now()
        });

        // Cleanup expired (5 menit)
        setTimeout(() => {
            pendingVerifications.delete(state);
        }, 5 * 60 * 1000);

        // Build OAuth URL
        const authUrl = 'https://discord.com/oauth2/authorize?' + 
            `client_id=${config.clientId}` +
            `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
            `&response_type=code` +
            `&scope=identify` +
            `&state=${state}`;

        res.redirect(authUrl);
    });

    // ═══════════════════════════════════════════════════════════════
    // ROUTE 2: /callback - Handle OAuth callback
    // ═══════════════════════════════════════════════════════════════
    app.get('/callback', async (req, res) => {
        const { code, state } = req.query;
        
        if (!code || !state) {
            return res.status(400).send('❌ Missing code or state parameter');
        }

        const pending = pendingVerifications.get(state);
        if (!pending) {
            return res.send(`
                <html>
                <body style="background:#2c2f33;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
                    <h1 style="color:#f04747;">❌ Session Expired</h1>
                    <p>Silakan coba verifikasi lagi dari Discord.</p>
                    <button onclick="window.close()" style="background:#5865f2;color:#fff;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;">Tutup</button>
                </body>
                </html>
            `);
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

            // Step 2: Fetch user data dengan BIO
            const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
                headers: { 
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const userData = userRes.data;
            const bio = userData.bio || '';
            
            console.log(`🔍 [VERIFY] User: ${userData.username} | Bio: "${bio}"`);

            // Step 3: Validasi bio
            const targetLink = (config.inviteLink || 'bananaskiee').toLowerCase();
            const bioLower = bio.toLowerCase();
            
            const hasInvite = bioLower.includes(targetLink) || 
                             bioLower.includes(targetLink.replace('https://', '')) ||
                             bioLower.includes(targetLink.replace('http://', '')) ||
                             bioLower.includes('discord.gg/' + targetLink.replace('https://discord.gg/', '').replace('http://discord.gg/', ''));

            // Step 4: Proses role
            const guild = await client.guilds.fetch(pending.guildId);
            const member = await guild.members.fetch(pending.userId);

            if (!member) {
                return res.send('❌ Kamu tidak ada di server.');
            }

            // Cek V1 (prasyarat)
            const V1_ROLE = '1352286235233620108';
            const V2_ROLE = config.roleId || '1444248605761470595';
            const NV2_ROLE = '1444248606579097640';

            if (!member.roles.cache.has(V1_ROLE)) {
                return res.send(`
                    <html>
                    <body style="background:#2c2f33;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
                        <h1 style="color:#f04747;">❌ Belum Verifikasi Tahap 1</h1>
                        <p>Kamu harus verifikasi tahap 1 dulu sebelum verifikasi bio!</p>
                    </body>
                    </html>
                `);
            }

            if (hasInvite) {
                // SUCCESS - Grant V2
                await member.roles.add(V2_ROLE);
                
                // Hapus NV2 jika ada
                if (member.roles.cache.has(NV2_ROLE)) {
                    await member.roles.remove(NV2_ROLE);
                }

                // Log
                const logCh = client.channels.cache.get('1352800131933802547');
                if (logCh) {
                    logCh.send(`✅ **Bio Verified**: ${member.user.tag} | Bio: \`${bio}\``);
                }

                // Success HTML
                res.send(`
                    <html>
                    <head>
                        <meta http-equiv="refresh" content="3;url=https://discord.com/channels/${pending.guildId}">
                        <style>
                            body { background: #36393f; color: #fff; font-family: 'Whitney', sans-serif; text-align: center; padding: 50px; }
                            .success { color: #43b581; font-size: 72px; margin-bottom: 20px; }
                            h1 { color: #43b581; }
                            .bio-box { background: #2f3136; padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; word-break: break-all; }
                            code { background: #202225; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                        </style>
                    </head>
                    <body>
                        <div class="success">✅</div>
                        <h1>Verifikasi Berhasil!</h1>
                        <p>Bio terdeteksi:</p>
                        <div class="bio-box"><code>${bio || '(kosong)'}</code></div>
                        <p>Role <b>Verified Stage 2</b> diberikan!</p>
                        <p>Redirecting ke Discord...</p>
                    </body>
                    </html>
                `);

            } else {
                // FAILED - Bio tidak valid
                res.send(`
                    <html>
                    <style>
                        body { background: #36393f; color: #fff; font-family: 'Whitney', sans-serif; text-align: center; padding: 50px; }
                        .fail { color: #f04747; font-size: 72px; margin-bottom: 20px; }
                        h1 { color: #f04747; }
                        .bio-box { background: #2f3136; padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; color: #b9bbbe; }
                        button { background: #5865f2; color: #fff; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px; }
                        button:hover { background: #4752c4; }
                        .hint { color: #faa61a; margin-top: 20px; }
                    </style>
                    <body>
                        <div class="fail">❌</div>
                        <h1>Verifikasi Gagal</h1>
                        <p>Bio kamu saat ini:</p>
                        <div class="bio-box"><code>${bio || '(kosong)'}</code></div>
                        <p>Harus mengandung: <code>${config.inviteLink}</code></p>
                        <p class="hint">💡 Tips: Edit bio di Discord → Settings → Profile → About Me</p>
                        <button onclick="location.href='/verify?userId=${pending.userId}&guildId=${pending.guildId}'">🔄 Coba Lagi</button>
                    </body>
                    </html>
                `);
            }

            // Revoke token (cleanup)
            try {
                await axios.post('https://discord.com/api/v10/oauth2/token/revoke',
                    new URLSearchParams({ token: accessToken }), {
                        headers: { 
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
                        }
                    }
                );
            } catch (e) {
                // Ignore revoke error
            }

            // Hapus dari pending
            pendingVerifications.delete(state);

        } catch (error) {
            console.error("❌ [VERIFY] OAuth Error:", error.response?.data || error.message);
            res.send(`
                <html>
                <body style="background:#2c2f33;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
                    <h1 style="color:#f04747;">❌ Error</h1>
                    <p>${error.response?.data?.error_description || 'Terjadi kesalahan. Coba lagi.'}</p>
                    <button onclick="location.href='/verify?userId=${pending?.userId}&guildId=${pending?.guildId}'" style="background:#5865f2;color:#fff;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;">Coba Lagi</button>
                </body>
                </html>
            `);
        }
    });

    // Mount ke express app utama
    const mainApp = require('../index');
    mainApp.use(app);
    
    console.log(`🔗 Verify URL: ${config.redirectUri.replace('/callback', '/verify')}`);
};
