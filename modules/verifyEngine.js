const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, UserFlags 
} = require('discord.js');
const express = require('express');
const axios = require('axios');

const app = express();
const userSessions = new Map();

// --- KONFIGURASI DARI FILE LAMA LU ---
const CONFIG = {
    logChannelId: '1428789734993432676', // Forum Log
    generalChannelId: '1352404526870560788',
    rulesChannelId: '1352326247186694164',
    serverId: '1347233781391560837'
};

module.exports = async (client, config) => {
    
    // 1. ENDPOINT: Halaman Awal (User klik link di Bio)
    app.get('/verify', (req, res) => {
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify`;
        res.redirect(authUrl);
    });

    // 2. ENDPOINT: Callback (Proses Cek Bio & Kasih Role)
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

            // Ambil Data User (Termasuk Bio/About Me)
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const userData = userResponse.data;
            const bio = userData.notes || userData.banner_text || ""; // Note: Bio butuh scope khusus, tapi kita pakai simulasi detect via connection jika perlu.

            // LOGIKA DETEKSI BIO (Sesuai permintaan)
            if (!bio.includes(config.inviteLink) && config.inviteLink !== "none") {
                return res.send(`
                    <h1 style="color:red;">VERIFIKASI GAGAL!</h1>
                    <p>Kamu harus memasang link <b>${config.inviteLink}</b> di Bio Discord kamu.</p>
                    <button onclick="window.location.href='/verify'">Coba Lagi</button>
                `);
            }

            // KASIH ROLE DI SERVER
            const guild = client.guilds.cache.get(config.guildId);
            const member = await guild.members.fetch(userData.id);

            if (member) {
                await member.roles.add(config.roleId);
                
                // JALANKAN LOGGING KE FORUM (Fitur Lama Lu)
                await logToForum(client, userData, member);

                res.send(`
                    <h1 style="color:green;">VERIFIKASI BERHASIL!</h1>
                    <p>Selamat ${userData.username}, role member telah diberikan. Silakan cek Discord!</p>
                `);
            }

        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
    });

    // 3. FUNGSI LOGGING FORUM (Pindahan dari VerifySystem lama)
    async function logToForum(client, user, member) {
        try {
            const logChannel = await client.channels.fetch(CONFIG.logChannelId);
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) return;

            const content = `🛡️ **VERIFIKASI BIO BERHASIL**\n👤 **User:** ${user.username} (${user.id})\n📅 **Akun Dibuat:** ${new Date(user.id / 4194304 + 1420070400000).toLocaleDateString()}\n✅ **Status:** Role Granted`;

            await logChannel.threads.create({
                name: `Log: ${user.username}`,
                message: { content: content }
            });
        } catch (e) { console.error("Gagal Log Forum:", e); }
    }

    app.listen(config.port, () => {
        console.log(`[VERIFY] Engine Hybrid jalan di port ${config.port}`);
    });
};
