// modules/verifyInvite.js
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const DB_NAME = "akira_bot";
const COLLECTION_NAME = "invite_verifications";
const SUSPICIOUS_COLLECTION = "suspicious_accounts";
const JOIN_TRACKING = "join_tracking";

const CONFIG = {
    VERIFY_CHANNEL_ID: "1487876516971806730",
    VERIFIED_ROLE_ID: "1444248590305202247",
    REQUIRED_ROLE_ID: "1444248605761470595",
    MEMBER_ROLE_ID: "1352286235233620108",
    MIN_STAY_HOURS: 24,
    MIN_ACCOUNT_AGE_DAYS: 30,
    GUILD_ID: "1347233781391560837",
    ADMIN_IDS: ["1346964077309595658"]
};

// Emoji IDs
const EMOJI = {
    LOADING: "<a:loading:1002404585358491658>",
    SUCCESS: "<a:betul:728231880771764266>",
    FAILED: "<a:silang:1001076112534810624>"
};

class VerifyInviteSystem {
    constructor(client) {
        this.client = client;
        this.mongoClient = null;
        this.db = null;
        this.collection = null;
        this.suspiciousCollection = null;
        this.joinTracking = null;
    }

    async connect() {
        try {
            this.mongoClient = new MongoClient(MONGO_URI);
            await this.mongoClient.connect();
            this.db = this.mongoClient.db(DB_NAME);
            this.collection = this.db.collection(COLLECTION_NAME);
            this.suspiciousCollection = this.db.collection(SUSPICIOUS_COLLECTION);
            this.joinTracking = this.db.collection(JOIN_TRACKING);
            
            await this.collection.createIndex({ userId: 1 }, { unique: true });
            await this.suspiciousCollection.createIndex({ userId: 1 }, { unique: true });
            await this.joinTracking.createIndex({ userId: 1 });
            await this.joinTracking.createIndex({ inviterId: 1 });
            
            console.log("✅ MongoDB Connected untuk VerifyInvite System");
        } catch (error) {
            console.error("❌ MongoDB Connection Error:", error);
            throw error;
        }
    }

    isAdmin(userId) {
        return CONFIG.ADMIN_IDS.includes(userId);
    }

    detectTumbal(member) {
        const user = member.user;
        const createdAt = user.createdAt;
        const accountAgeDays = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
        
        const flags = [];
        let isTumbal = false;
        let score = 0;

        if (accountAgeDays < CONFIG.MIN_ACCOUNT_AGE_DAYS) {
            flags.push({
                type: "NEW_ACCOUNT",
                message: `Akun dibuat ${accountAgeDays} hari yang lalu`,
                severity: "HIGH"
            });
            isTumbal = true;
            score += 50;
        }

        const susPatterns = [/^\d{8,}$/, /^[a-z]{1,2}\d{6,}$/i, /^\d{4,}[a-z]{1,2}$/i, /(.)\1{4,}/i];
        for (const pattern of susPatterns) {
            if (pattern.test(user.username)) {
                flags.push({ type: "SUSPICIOUS_NAME", message: "Username pattern mencurigakan", severity: "MEDIUM" });
                score += 25;
                break;
            }
        }

        if (user.displayAvatarURL().includes('/embed/avatars/')) {
            flags.push({ type: "DEFAULT_AVATAR", message: "Avatar default Discord", severity: "LOW" });
            score += 10;
        }

        return { isTumbal: isTumbal || score >= 50, score, flags, accountAgeDays };
    }

    async trackJoin(member, inviteUsed) {
        try {
            if (!inviteUsed?.inviter) return;

            const inviterId = inviteUsed.inviter.id;
            const joinedId = member.id;
            const guildId = member.guild.id;

            const tumbalCheck = this.detectTumbal(member);
            
            await this.joinTracking.updateOne(
                { userId: joinedId },
                {
                    $set: {
                        userId: joinedId,
                        userTag: member.user.tag,
                        guildId: guildId,
                        joinedAt: new Date(),
                        inviterId: inviterId,
                        inviteCode: inviteUsed.code,
                        isTumbal: tumbalCheck.isTumbal,
                        tumbalScore: tumbalCheck.score
                    }
                },
                { upsert: true }
            );

            const updateOps = {
                $setOnInsert: {
                    userId: inviterId,
                    userTag: inviteUsed.inviter.tag,
                    guildId: guildId,
                    stats: { regular: 0, left: 0, fake: 0, bonus: 0, total: 0 },
                    createdAt: new Date()
                }
            };

            if (tumbalCheck.isTumbal) {
                updateOps.$inc = { "stats.fake": 1, "stats.total": 1 };
                await this.suspiciousCollection.updateOne(
                    { userId: joinedId },
                    { $set: { ...tumbalCheck, detectedAt: new Date(), inviterId } },
                    { upsert: true }
                );
            } else {
                updateOps.$inc = { "stats.regular": 1, "stats.total": 1 };
            }

            await this.collection.updateOne({ userId: inviterId }, updateOps, { upsert: true });

        } catch (err) {
            console.error("❌ Track join error:", err);
        }
    }

    async trackLeave(member) {
        try {
            const userId = member.id;
            const joinData = await this.joinTracking.findOne({ userId: userId });
            if (!joinData) return;

            const inviterId = joinData.inviterId;
            
            await this.collection.updateOne(
                { userId: inviterId },
                { $inc: { "stats.regular": -1, "stats.left": 1 } }
            );

            await this.joinTracking.deleteOne({ userId: userId });
        } catch (err) {
            console.error("❌ Track leave error:", err);
        }
    }

    // 🔥 FIX: Cek eligible invites termasuk yang ada bonus
    async getEligibleInvites(inviterId) {
        try {
            // Ambil data inviter
            const inviterData = await this.collection.findOne({ userId: inviterId });
            
            // Kalau ada bonus, langsung eligible (bonus = auto verify)
            if (inviterData && inviterData.stats && inviterData.stats.bonus > 0) {
                return [{
                    userId: "BONUS",
                    userTag: "Bonus Invite",
                    joinedAt: new Date(),
                    hoursStayed: 999,
                    hasMemberRole: true,
                    isBonus: true
                }];
            }

            // Kalau nggak ada bonus, cek invited users
            const invitedUsers = await this.joinTracking.find({ 
                inviterId: inviterId,
                isTumbal: false
            }).toArray();

            const eligible = [];

            for (const user of invitedUsers) {
                const member = await this.client.guilds.cache.get(CONFIG.GUILD_ID)?.members.fetch(user.userId).catch(() => null);
                if (!member) continue;

                const joinedAt = new Date(user.joinedAt);
                const hoursStayed = (Date.now() - joinedAt) / (1000 * 60 * 60);
                const hasMemberRole = member.roles.cache.has(CONFIG.MEMBER_ROLE_ID);

                if (hoursStayed >= CONFIG.MIN_STAY_HOURS && hasMemberRole) {
                    eligible.push({
                        userId: user.userId,
                        userTag: user.userTag,
                        joinedAt: user.joinedAt,
                        hoursStayed: Math.floor(hoursStayed),
                        hasMemberRole: true
                    });
                }
            }

            return eligible;
        } catch (err) {
            console.error("❌ Get eligible error:", err);
            return [];
        }
    }

    async handleVerifyCommand(message) {
        if (message.channel.id !== CONFIG.VERIFY_CHANNEL_ID) return;

        const member = message.member;

        if (!member.roles.cache.has(CONFIG.REQUIRED_ROLE_ID)) {
            await this.sendFailMessage(message, "Anda tidak memiliki role yang diperlukan");
            return;
        }

        if (member.roles.cache.has(CONFIG.VERIFIED_ROLE_ID)) {
            const reply = await message.reply({
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `### ${EMOJI.SUCCESS} **Anda sudah terverifikasi!**` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Verified Invite" }
                    ]
                }],
                flags: 32768
            });
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => reply.delete().catch(() => {}), 3000);
            return;
        }

        const loadingMsg = await message.reply({
            components: [{
                type: 17,
                components: [
                    { type: 14 },
                    { type: 10, content: `### ${EMOJI.LOADING} **Scanning invite for verification...**\n> **Target: \`${member.user.tag}\`**` },
                    { type: 14 },
                    { type: 10, content: "-# EmpireBS - Verified Invite" }
                ]
            }],
            flags: 32768
        });

        setTimeout(() => message.delete().catch(() => {}), 100);
        await new Promise(r => setTimeout(r, 2000));

        const eligible = await this.getEligibleInvites(member.id);

        if (eligible.length > 0) {
            const isBonus = eligible[0].isBonus;
            
            await loadingMsg.edit({
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `### ${EMOJI.SUCCESS} **Verification Successful!**\n> Anda telah diberikan peran **Verified Member**.\n> Target: \`${member.user.tag}\`\n\n> **Akses Terbuka!** Periksa catagory <#1487714895842644089>` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Verified Invite" }
                    ]
                }],
                flags: 32768
            });

            setTimeout(async () => {
                try {
                    const role = message.guild.roles.cache.get(CONFIG.VERIFIED_ROLE_ID);
                    if (role) await member.roles.add(role);
                    
                    // Kalau bonus, kurangi 1
                    if (isBonus) {
                        await this.collection.updateOne(
                            { userId: member.id },
                            { $inc: { "stats.bonus": -1 } }
                        );
                    }
                    
                    await this.cleanChannel(message.channel);
                } catch (err) {
                    console.error("Error giving role:", err);
                }
            }, 5000);
        } else {
            const invitedUsers = await this.joinTracking.find({ inviterId: member.id }).toArray();
            
            let failReason = "Invite Empty";
            let details = [];

            if (invitedUsers.length === 0) {
                details.push("Invite user ke server ini. Invite user asli bukan fake akun mu");
            } else {
                let hasFake = false, noRole = false, notStay = false;

                for (const user of invitedUsers) {
                    const memberCheck = await message.guild.members.fetch(user.userId).catch(() => null);
                    
                    if (user.isTumbal) hasFake = true;
                    else if (memberCheck) {
                        if (!memberCheck.roles.cache.has(CONFIG.MEMBER_ROLE_ID)) noRole = true;
                        else {
                            const hours = (Date.now() - new Date(user.joinedAt)) / (1000 * 60 * 60);
                            if (hours < CONFIG.MIN_STAY_HOURS) notStay = true;
                        }
                    }
                }

                if (hasFake) {
                    failReason = "Fake User";
                    details.push("Pastikan invite user asli bukan fake akun mu invit ke server");
                }
                if (noRole) {
                    failReason = "user must have role";
                    details.push("Pastikan user yang di invite sudah mempunyai role Member");
                }
                if (notStay) {
                    failReason = "user must stay on server for 1 day";
                    details.push("Pastikan user yang di invite, harus berada di server selama 1 hari");
                }
            }

            await loadingMsg.edit({
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `## ${EMOJI.FAILED} **Verification Failed.**\n> Tidak dapat mengkonfirmasi verified \`${failReason}\`.\n\n${details.map(d => `> ${d}`).join('\n')}` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Verified Invite" }
                    ]
                }],
                flags: 32768
            });

            setTimeout(async () => {
                await this.cleanChannel(message.channel);
            }, 60000);
        }
    }

    async sendFailMessage(message, title) {
        const msg = await message.reply({
            components: [{
                type: 17,
                components: [
                    { type: 14 },
                    { type: 10, content: `## ${EMOJI.FAILED} **Verification Failed.**\n> ${title}` },
                    { type: 14 },
                    { type: 10, content: "-# EmpireBS - Verified Invite" }
                ]
            }],
            flags: 32768
        });
        setTimeout(() => message.delete().catch(() => {}), 100);
        setTimeout(() => msg.delete().catch(() => {}), 60000);
    }

    async cleanChannel(channel) {
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const deletable = messages.filter(m => !m.pinned);
            if (deletable.size > 0) {
                await channel.bulkDelete(deletable, true).catch(async () => {
                    for (const [id, msg] of deletable) {
                        await msg.delete().catch(() => {});
                    }
                });
            }
        } catch (err) {
            console.error("Clean channel error:", err);
        }
    }

    // 🔥 FIX: Stats dengan default value
    async handleStatsCommand(message, args) {
        if (message.channel.id === CONFIG.VERIFY_CHANNEL_ID) {
            const msg = await message.reply({
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `## ${EMOJI.FAILED} **Wrong Channel**\n> Gunakan channel lain untuk cek stats.` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Invite System" }
                    ]
                }],
                flags: 32768
            });
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => msg.delete().catch(() => {}), 5000);
            return;
        }

        if (args[0] === 'leaderboard') {
            const board = await this.getLeaderboard(CONFIG.GUILD_ID, 10);
            const embed = {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `### 🏆 **Invite Leaderboard**\n\n${board}` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Invite System" }
                    ]
                }],
                flags: 32768
            };
            const msg = await message.reply(embed);
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => msg.delete().catch(() => {}), 30000);
            return;
        }

        let target = message.mentions.users.first() || message.author;
        const stats = await this.getUserInviteStats(target.id);

        // 🔥 FIX: Handle kalau stats null
        if (!stats) {
            const embed = {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `### 📊 **Invite Stats**\n> <@${target.id}> belum memiliki data invite.\n> Total: 0 invites. (0 regular, 0 left, 0 fake, 0 bonus)` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Invite System" }
                    ]
                }],
                flags: 32768
            };
            const msg = await message.reply(embed);
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => msg.delete().catch(() => {}), 10000);
            return;
        }

        const statsLine = `<@${stats.userId}> • **${stats.total}** invites. (**${stats.regular}** regular, **${stats.left}** left, **${stats.fake}** fake, **${stats.bonus}** bonus)`;
        
        const embed = {
            components: [{
                type: 17,
                components: [
                    { type: 14 },
                    { type: 10, content: `### 📊 **Invite Statistics**\n> ${statsLine}\n\n> **Active:** ${stats.currentActive} users still in server` },
                    { type: 14 },
                    { type: 10, content: "-# EmpireBS - Invite System" }
                ]
            }],
            flags: 32768
        };
        
        const msg = await message.reply(embed);
        setTimeout(() => message.delete().catch(() => {}), 100);
        setTimeout(() => msg.delete().catch(() => {}), 15000);
    }

    // 🔥 FIX: Default stats kalau null
    async getUserInviteStats(userId) {
        try {
            const data = await this.collection.findOne({ userId: userId });
            
            // Kalau belum ada data, return default
            if (!data) {
                return {
                    userId: userId,
                    userTag: null, // Akan diisi dari message
                    total: 0,
                    regular: 0,
                    left: 0,
                    fake: 0,
                    bonus: 0,
                    currentActive: 0
                };
            }
            
            const stats = data.stats || { regular: 0, left: 0, fake: 0, bonus: 0, total: 0 };
            
            return {
                userId: data.userId,
                userTag: data.userTag,
                total: stats.total || 0,
                regular: stats.regular || 0,
                left: stats.left || 0,
                fake: stats.fake || 0,
                bonus: stats.bonus || 0,
                currentActive: Math.max(0, (stats.regular || 0) - (stats.left || 0))
            };
        } catch (err) {
            console.error("❌ Get user stats error:", err);
            return null;
        }
    }

    formatStatsLine(rank, stats) {
        return `\`${rank}.\` <@${stats.userId}> • **${stats.total}** invites. (**${stats.regular}** regular, **${stats.left}** left, **${stats.fake}** fake, **${stats.bonus}** bonus)`;
    }

    async getLeaderboard(guildId, limit = 10) {
        try {
            const users = await this.collection
                .find({ guildId: guildId })
                .sort({ "stats.total": -1 })
                .limit(limit)
                .toArray();

            if (users.length === 0) return "Belum ada data invite.";

            return users.map((u, i) => this.formatStatsLine(i + 1, {
                userId: u.userId,
                userTag: u.userTag,
                total: u.stats?.total || 0,
                regular: u.stats?.regular || 0,
                left: u.stats?.left || 0,
                fake: u.stats?.fake || 0,
                bonus: u.stats?.bonus || 0
            })).join('\n');
        } catch (err) {
            console.error("❌ Leaderboard error:", err);
            return "Error loading leaderboard.";
        }
    }

    async handleBonusCommand(message, args) {
        if (message.channel.id === CONFIG.VERIFY_CHANNEL_ID) {
            const msg = await message.reply({
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `## ${EMOJI.FAILED} **Wrong Channel**\n> Command admin tidak bisa di channel verify.` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Admin Only" }
                    ]
                }],
                flags: 32768
            });
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => msg.delete().catch(() => {}), 5000);
            return;
        }

        if (!this.isAdmin(message.author.id)) {
            const msg = await message.reply({
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `## ${EMOJI.FAILED} **Access Denied**\n> Anda tidak memiliki izin mengelola bonus invite.` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Admin Only" }
                    ]
                }],
                flags: 32768
            });
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => msg.delete().catch(() => {}), 5000);
            return;
        }

        const subCmd = args[0]?.toLowerCase();
        const target = message.mentions.users.first();
        
        if (!subCmd || (target && !['remove', 'reset', 'log'].includes(subCmd))) {
            const amount = parseInt(args[1]);
            const reason = args.slice(2).join(" ") || "Bonus dari admin";
            
            if (!target || isNaN(amount) || amount <= 0) {
                const msg = await message.reply({
                    components: [{
                        type: 17,
                        components: [
                            { type: 14 },
                            { type: 10, content: `### ⚠️ **Usage**\n> bs!bonus @user <jumlah> [alasan]\n> bs!bonus remove @user <jumlah>\n> bs!bonus reset @user\n> bs!bonus log @user` },
                            { type: 14 },
                            { type: 10, content: "-# EmpireBS - Bonus System" }
                        ]
                    }],
                    flags: 32768
                });
                setTimeout(() => message.delete().catch(() => {}), 100);
                setTimeout(() => msg.delete().catch(() => {}), 10000);
                return;
            }
            
            const success = await this.addBonus(target.id, amount, message.author.id, reason);
            
            if (success) {
                const embed = {
                    components: [{
                        type: 17,
                        components: [
                            { type: 14 },
                            { type: 10, content: `### ${EMOJI.SUCCESS} **Bonus Added**\n> **Target:** <@${target.id}>\n> **Amount:** +${amount} invites\n> **Reason:** ${reason}\n> **By:** <@${message.author.id}>` },
                            { type: 14 },
                            { type: 10, content: "-# EmpireBS - Bonus System" }
                        ]
                    }],
                    flags: 32768
                };
                const msg = await message.reply(embed);
                setTimeout(() => message.delete().catch(() => {}), 100);
                setTimeout(() => msg.delete().catch(() => {}), 10000);
            }
            return;
        }
        
        if (subCmd === "remove") {
            const amount = parseInt(args[2]);
            if (!target || isNaN(amount)) {
                const msg = await message.reply({
                    components: [{
                        type: 17,
                        components: [
                            { type: 14 },
                            { type: 10, content: `### ⚠️ **Usage:** bs!bonus remove @user <jumlah>` },
                            { type: 14 },
                            { type: 10, content: "-# EmpireBS - Bonus System" }
                        ]
                    }],
                    flags: 32768
                });
                setTimeout(() => message.delete().catch(() => {}), 100);
                setTimeout(() => msg.delete().catch(() => {}), 5000);
                return;
            }
            
            const result = await this.removeBonus(target.id, amount, message.author.id);
            const embed = result.success ? {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `### ${EMOJI.SUCCESS} **Bonus Removed**\n> **Target:** <@${target.id}>\n> **Amount:** -${amount} invites` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Bonus System" }
                    ]
                }],
                flags: 32768
            } : {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `## ${EMOJI.FAILED} **Failed**\n> ${result.error}` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Bonus System" }
                    ]
                }],
                flags: 32768
            };
            
            const msg = await message.reply(embed);
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => msg.delete().catch(() => {}), result.success ? 10000 : 5000);
            return;
        }
        
        if (subCmd === "reset") {
            if (!target) {
                const msg = await message.reply({
                    components: [{
                        type: 17,
                        components: [
                            { type: 14 },
                            { type: 10, content: `### ⚠️ **Usage:** bs!bonus reset @user` },
                            { type: 14 },
                            { type: 10, content: "-# EmpireBS - Bonus System" }
                        ]
                    }],
                    flags: 32768
                });
                setTimeout(() => message.delete().catch(() => {}), 100);
                setTimeout(() => msg.delete().catch(() => {}), 5000);
                return;
            }
            
            const result = await this.resetBonus(target.id, message.author.id);
            const embed = result.success ? {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `### ${EMOJI.SUCCESS} **Bonus Reset**\n> **Target:** <@${target.id}>\n> **Reset Amount:** ${result.amount} invites` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Bonus System" }
                    ]
                }],
                flags: 32768
            } : {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `## ${EMOJI.FAILED} **Failed**\n> ${result.error}` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Bonus System" }
                    ]
                }],
                flags: 32768
            };
            
            const msg = await message.reply(embed);
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => msg.delete().catch(() => {}), result.success ? 10000 : 5000);
            return;
        }
        
        if (subCmd === "log") {
            const logTarget = target || message.author;
            const history = await this.getBonusHistory(logTarget.id, 10);
            
            if (history.length === 0) {
                const embed = {
                    components: [{
                        type: 17,
                        components: [
                            { type: 14 },
                            { type: 10, content: `### 📋 **Bonus History**\n> <@${logTarget.id}> tidak memiliki history bonus.` },
                            { type: 14 },
                            { type: 10, content: "-# EmpireBS - Bonus System" }
                    ]
                    }],
                    flags: 32768
                };
                const msg = await message.reply(embed);
                setTimeout(() => message.delete().catch(() => {}), 100);
                setTimeout(() => msg.delete().catch(() => {}), 5000);
                return;
            }
            
            const historyText = history.map(h => {
                const date = new Date(h.timestamp).toLocaleDateString('id-ID');
                const sign = h.amount > 0 ? "+" : "";
                return `> ${date} ${sign}${h.amount} • ${h.reason} • ${h.type}`;
            }).join('\n');
            
            const embed = {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `### 📋 **Bonus History - ${logTarget.username}**\n${historyText}` },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Bonus System" }
                    ]
                }],
                flags: 32768
            };
            
            const msg = await message.reply(embed);
            setTimeout(() => message.delete().catch(() => {}), 100);
            setTimeout(() => msg.delete().catch(() => {}), 30000);
            return;
        }
    }

    async addBonus(userId, amount, givenBy, reason) {
        try {
            await this.collection.updateOne(
                { userId: userId },
                {
                    $inc: { "stats.bonus": amount, "stats.total": amount },
                    $push: {
                        bonusHistory: {
                            amount: amount,
                            givenBy: givenBy,
                            reason: reason,
                            type: "ADD",
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true }
            );
            return true;
        } catch (err) {
            console.error("❌ Add bonus error:", err);
            return false;
        }
    }

    async removeBonus(userId, amount, givenBy) {
        try {
            const data = await this.collection.findOne({ userId: userId });
            const currentBonus = data?.stats?.bonus || 0;
            
            if (currentBonus < amount) {
                return { success: false, error: "Insufficient bonus balance" };
            }
            
            await this.collection.updateOne(
                { userId: userId },
                {
                    $inc: { "stats.bonus": -amount, "stats.total": -amount },
                    $push: {
                        bonusHistory: {
                            amount: -amount,
                            givenBy: givenBy,
                            reason: "Removed by admin",
                            type: "REMOVE",
                            timestamp: new Date()
                        }
                    }
                }
            );
            return { success: true };
        } catch (err) {
            console.error("❌ Remove bonus error:", err);
            return { success: false, error: "Database error" };
        }
    }

    async resetBonus(userId, resetBy) {
        try {
            const data = await this.collection.findOne({ userId: userId });
            const currentBonus = data?.stats?.bonus || 0;
            
            if (currentBonus === 0) {
                return { success: false, error: "User has no bonus" };
            }
            
            await this.collection.updateOne(
                { userId: userId },
                {
                    $inc: { "stats.bonus": -currentBonus, "stats.total": -currentBonus },
                    $push: {
                        bonusHistory: {
                            amount: -currentBonus,
                            givenBy: resetBy,
                            reason: "Reset by admin",
                            type: "RESET",
                            timestamp: new Date()
                        }
                    }
                }
            );
            return { success: true, amount: currentBonus };
        } catch (err) {
            console.error("❌ Reset bonus error:", err);
            return { success: false, error: "Database error" };
        }
    }

    async getBonusHistory(userId, limit = 10) {
        try {
            const data = await this.collection.findOne({ userId: userId });
            if (!data || !data.bonusHistory) return [];
            return data.bonusHistory.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        } catch (err) {
            console.error("❌ Get bonus history error:", err);
            return [];
        }
    }

    async close() {
        if (this.mongoClient) {
            await this.mongoClient.close();
            console.log("🔌 MongoDB Closed");
        }
    }
}

module.exports = VerifyInviteSystem;
