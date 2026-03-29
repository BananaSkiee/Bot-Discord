const express = require('express');
const axios = require('axios');
const app = express();

/**
 * 🛡️ VERIFY ENGINE - ELITE EDITION
 * @param {Client} client - Discord.js Client Instance
 * @param {Object} config - { clientId, clientSecret, redirectUri, roleId, guildId, port }
 */
module.exports = (client, config) => {

    // [ENDPOINT] GATEWAY AWAL (User klik link ini)
    app.get('/verify', (req, res) => {
        const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify%20guilds.join`;
        res.redirect(oauthUrl);
    });

    // [ENDPOINT] CALLBACK (Proses setelah User klik Authorize)
    app.get('/callback', async (req, res) => {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).send('<h1>❌ Error</h1><p>Authorization code missing. Silakan coba lagi.</p>');
        }

        try {
            // [STEP 1] EXCHANGE CODE -> ACCESS TOKEN
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

            const accessToken = tokenRes.data.access_token;

            // [STEP 2] FETCH PROFILE & SCAN BIO
            const userRes = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const { id, username, bio, global_name } = userRes.data;
            const displayName = global_name || username;
            
            // LOGIC: Detect any Discord Invite Link in Bio
            const inviteRegex = /(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9-]+)/g;
            const matches = bio ? [...bio.matchAll(inviteRegex)] : [];
            let isVerified = false;

            console.log(`[AUTH] 🔍 Scanning Bio for: ${username} (${id})`);

            if (matches.length > 0) {
                for (const match of matches) {
                    const inviteCode = match[1];
                    try {
                        // VALIDASI KE API DISCORD: Apakah link invite ini milik Server kita?
                        const inviteInfo = await axios.get(`https://discord.com/api/v10/invites/${inviteCode}`);
                        
                        if (inviteInfo.data.guild && inviteInfo.data.guild.id === config.guildId) {
                            isVerified = true;
                            console.log(`[AUTH] ✅ Link Valid: ${inviteCode} belongs to Target Guild.`);
                            break; 
                        }
                    } catch (e) {
                        // Link mungkin typo atau sudah expired, lanjut scan berikutnya
                        continue;
                    }
                }
            }

            // [STEP 3] EKSEKUSI ROLE & RESPON
            if (isVerified) {
                const guild = client.guilds.cache.get(config.guildId);
                if (!guild) return res.send('<h1>❌ Bot Error</h1><p>Bot tidak ada di server target.</p>');

                const member = await guild.members.fetch(id).catch(() => null);

                if (member) {
                    await member.roles.add(config.roleId).catch(console.error);
                    
                    // RESPONSE SUKSES (TAMPILAN PROFESIONAL)
                    res.send(`
                        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                            <h1 style="color: #2ecc71;">✅ VERIFIKASI BERHASIL!</h1>
                            <p>Halo <b>${displayName}</b>, Link Invite ditemukan di Bio profilmu.</p>
                            <p>Role Member telah diberikan secara otomatis. Silakan kembali ke Discord!</p>
                        </div>
                    `);
                    console.log(`[VERIFY] 🌟 Success: ${username} has been verified.`);
                } else {
                    res.send('<h1>⚠️ Join Dulu!</h1><p>Kamu harus masuk ke server terlebih dahulu sebelum verifikasi.</p>');
                }
            } else {
                // RESPONSE GAGAL
                res.send(`
                    <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                        <h1 style="color: #e74c3c;">❌ VERIFIKASI GAGAL</h1>
                        <p>Kami tidak menemukan Link Invite Server kami di Bio profilmu.</p>
                        <p style="background: #f8f9fa; display: inline-block; padding: 10px; border-radius: 5px;">
                            Pastikan ada link seperti <b>discord.gg/BSCommunity</b> di Bio profil Discord-mu!
                        </p>
                        <br><br>
                        <a href="/verify" style="text-decoration: none; background: #5865F2; color: white; padding: 10px 20px; border-radius: 5px;">Coba Lagi</a>
                    </div>
                `);
            }

        } catch (error) {
            console.error('[CRITICAL-ERROR]', error.response?.data || error.message);
            res.status(500).send('<h1>🔥 500 - Internal Server Error</h1><p>Terjadi kesalahan pada sistem verifikasi.</p>');
        }
    });

    // START WEB SERVER
    app.listen(config.port, () => {
        console.log(`[GATEWAY] 🚀 High-End Verification Web Server Live on Port ${config.port}`);
    });
};
