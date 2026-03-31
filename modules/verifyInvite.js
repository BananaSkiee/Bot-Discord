// modules/verifyInvite.js
const { MongoClient } = require('mongodb');
const { EmbedBuilder } = require('discord.js');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const DB_NAME = "akira_bot";
const COLLECTION_NAME = "invite_verifications";
const SUSPICIOUS_COLLECTION = "suspicious_accounts";

class VerifyInviteSystem {
    constructor(client) {
        this.discordClient = client; // Simpan discord client
        this.mongoClient = null;
        this.db = null;
        this.collection = null;
        this.suspiciousCollection = null;
        
        // ⚙️ KONFIGURASI DETEKSI AKUN TUMBAL
        this.detectionConfig = {
            minAccountAgeDays: 30,
            suspiciousUsernamePatterns: [
                /^\d{8,}$/,                    
                /^[a-z]{1,2}\d{6,}$/i,         
                /^\d{4,}[a-z]{1,2}$/i,         
                /(.)\1{4,}/i,                  
            ],
            checkDefaultAvatar: true,
        };
    }

    async connect() {
        try {
            this.mongoClient = new MongoClient(MONGO_URI);
            await this.mongoClient.connect();
            this.db = this.mongoClient.db(DB_NAME);
            this.collection = this.db.collection(COLLECTION_NAME);
            this.suspiciousCollection = this.db.collection(SUSPICIOUS_COLLECTION);
            
            await this.collection.createIndex({ userId: 1 }, { unique: true });
            await this.collection.createIndex({ inviterId: 1 });
            await this.suspiciousCollection.createIndex({ userId: 1 }, { unique: true });
            await this.suspiciousCollection.createIndex({ detectedAt: -1 });
            
            console.log("✅ MongoDB Connected untuk VerifyInvite System (with Anti-Tumbal)");
        } catch (error) {
            console.error("❌ MongoDB Connection Error:", error);
            throw error;
        }
    }

    // 🔍 DETEKSI AKUN TUMBAL/FAKE
    detectSuspiciousAccount(member) {
        const user = member.user;
        const createdAt = user.createdAt;
        const now = new Date();
        const accountAgeMs = now - createdAt;
        const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
        
        const flags = [];
        let isTumbal = false;
        let suspicionScore = 0;

        if (accountAgeDays < this.detectionConfig.minAccountAgeDays) {
            flags.push({
                type: "NEW_ACCOUNT",
                severity: "HIGH",
                message: `Akun dibuat ${accountAgeDays} hari yang lalu (< ${this.detectionConfig.minAccountAgeDays} hari)`,
                details: `Created: ${createdAt.toLocaleDateString('id-ID')}`
            });
            isTumbal = true;
            suspicionScore += 50;
        }

        for (const pattern of this.detectionConfig.suspiciousUsernamePatterns) {
            if (pattern.test(user.username)) {
                flags.push({
                    type: "SUSPICIOUS_USERNAME",
                    severity: "MEDIUM",
                    message: `Username pattern mencurigakan: ${user.username}`,
                    pattern: pattern.toString()
                });
                suspicionScore += 25;
                break;
            }
        }

        if (this.detectionConfig.checkDefaultAvatar) {
            const isDefaultAvatar = user.displayAvatarURL().includes('/embed/avatars/');
            if (isDefaultAvatar) {
                flags.push({
                    type: "DEFAULT_AVATAR",
                    severity: "LOW",
                    message: "Menggunakan avatar default Discord"
                });
                suspicionScore += 10;
            }
        }

        if (user.username.length <= 6 && /\d{3,}/.test(user.username)) {
            flags.push({
                type: "SHORT_RANDOM_NAME",
                severity: "MEDIUM",
                message: "Username pendek dengan angka random"
            });
            suspicionScore += 15;
        }

        let status = "CLEAN";
        if (isTumbal || suspicionScore >= 50) {
            status = "TUMBAL";
        } else if (suspicionScore >= 25) {
            status = "SUSPICIOUS";
        }

        return {
            userId: user.id,
            userTag: user.tag,
            status: status,
            suspicionScore: suspicionScore,
            accountAgeDays: accountAgeDays,
            createdAt: createdAt,
            flags: flags,
            detectedAt: new Date()
        };
    }

    async trackInvite(member, inviteUsed) {
        try {
            if (!inviteUsed || !inviteUsed.inviter) return;

            const inviterId = inviteUsed.inviter.id;
            const joinedUserId = member.id;
            const guildId = member.guild.id;

            const detectionResult = this.detectSuspiciousAccount(member);
            
            if (detectionResult.status !== "CLEAN") {
                await this.suspiciousCollection.updateOne(
                    { userId: joinedUserId },
                    { 
                        $set: detectionResult,
                        $push: {
                            joinHistory: {
                                guildId: guildId,
                                joinedAt: new Date(),
                                inviteCode: inviteUsed.code,
                                inviterId: inviterId
                            }
                        }
                    },
                    { upsert: true }
                );
                
                console.log(`🚨 DETECTED ${detectionResult.status}: ${member.user.tag} - Score: ${detectionResult.suspicionScore}`);
            }

            const isValidInvite = detectionResult.status !== "TUMBAL";
            
            const updateData = {
                $setOnInsert: { 
                    userId: inviterId,
                    userTag: inviteUsed.inviter.tag,
                    verifiedAt: null,
                    isVerified: false,
                    guildId: guildId,
                    createdAt: new Date()
                }
            };

            if (isValidInvite) {
                updateData.$push = { 
                    successfulInvites: {
                        invitedUserId: joinedUserId,
                        invitedUserTag: member.user.tag,
                        joinedAt: new Date(),
                        inviteCode: inviteUsed.code,
                        isValid: true,
                        accountAgeDays: detectionResult.accountAgeDays
                    }
                };
                updateData.$inc = { validInviteCount: 1 };
                
                console.log(`✅ VALID INVITE: ${inviteUsed.inviter.tag} invited ${member.user.tag}`);
            } else {
                updateData.$push = { 
                    successfulInvites: {
                        invitedUserId: joinedUserId,
                        invitedUserTag: member.user.tag,
                        joinedAt: new Date(),
                        inviteCode: inviteUsed.code,
                        isValid: false,
                        isTumbal: true,
                        rejectionReason: detectionResult.flags.map(f => f.type).join(', '),
                        accountAgeDays: detectionResult.accountAgeDays
                    },
                    rejectedInvites: {
                        invitedUserId: joinedUserId,
                        reason: detectionResult.flags.map(f => f.message).join('; '),
                        detectedAt: new Date()
                    }
                };
                updateData.$inc = { tumbalInviteCount: 1 };
                
                console.log(`❌ REJECTED (TUMBAL): ${inviteUsed.inviter.tag} invited ${member.user.tag}`);
            }

            await this.collection.updateOne(
                { userId: inviterId },
                updateData,
                { upsert: true }
            );

            if (!isValidInvite) {
                await this.notifyInviterAboutTumbal(inviteUsed.inviter, member, detectionResult);
            }

        } catch (error) {
            console.error("❌ Error tracking invite:", error);
        }
    }

    async notifyInviterAboutTumbal(inviter, tumbalMember, detectionResult) {
        try {
            const guild = tumbalMember.guild;
            const inviterMember = await guild.members.fetch(inviter.id).catch(() => null);
            
            if (inviterMember) {
                const embed = new EmbedBuilder()
                    .setColor(0xe74c3c)
                    .setTitle("⚠️ Invite Ditolak")
                    .setDescription(`Invite mu untuk **${tumbalMember.user.tag}** ditolak karena terdeteksi akun tumbal/fake.`)
                    .addFields(
                        { name: "Alasan", value: detectionResult.flags.map(f => `• ${f.message}`).join('\n'), inline: false },
                        { name: "💡 Tips", value: "Invite teman yang pakai akun asli/lama (minimal 1 bulan)", inline: false }
                    )
                    .setFooter({ text: "BananaSkiee Anti-Tumbal System" })
                    .setTimestamp();

                await inviter.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (err) {}
    }

    async hasValidInvited(userId) {
        try {
            const data = await this.collection.findOne({ userId: userId });
            if (!data) return false;
            
            const validInvites = data.successfulInvites?.filter(inv => inv.isValid === true) || [];
            return validInvites.length > 0;
        } catch (error) {
            console.error("❌ Error checking valid invites:", error);
            return false;
        }
    }

    async getUserStats(userId) {
        try {
            const data = await this.collection.findOne({ userId: userId });
            if (!data) return null;

            const validInvites = data.successfulInvites?.filter(inv => inv.isValid === true) || [];
            const invalidInvites = data.successfulInvites?.filter(inv => inv.isValid === false) || [];
            
            return {
                totalInvites: data.successfulInvites?.length || 0,
                validInvites: validInvites.length,
                invalidInvites: invalidInvites.length,
                tumbalDetected: invalidInvites.length,
                isVerified: data.isVerified || false,
                verifiedAt: data.verifiedAt,
                rejectedInvites: data.rejectedInvites || []
            };
        } catch (error) {
            console.error("❌ Error getting user stats:", error);
            return null;
        }
    }

    async markVerified(userId) {
        try {
            await this.collection.updateOne(
                { userId: userId },
                { 
                    $set: { 
                        isVerified: true,
                        verifiedAt: new Date()
                    }
                }
            );
        } catch (error) {
            console.error("❌ Error marking verified:", error);
        }
    }

    async handleVerifyCommand(message, config) {
        const { VERIFY_CHANNEL_ID, VERIFIED_ROLE_ID } = config;
        
        if (message.channel.id !== VERIFY_CHANNEL_ID) {
            return { success: false, error: "wrong_channel" };
        }

        const member = message.member;
        if (member.roles.cache.has(VERIFIED_ROLE_ID)) {
            const embed = new EmbedBuilder()
                .setColor(0x3498db)
                .setDescription("✅ **Lu udah verified sebelumnya!**")
                .setFooter({ text: "BananaSkiee Verify System" });
            
            await message.reply({ embeds: [embed] });
            return { success: true, alreadyVerified: true };
        }

        const hasValidInvited = await this.hasValidInvited(message.author.id);
        const stats = await this.getUserStats(message.author.id);

        if (hasValidInvited) {
            const role = message.guild.roles.cache.get(VERIFIED_ROLE_ID);
            if (!role) {
                await message.reply("❌ **Role verified tidak ditemukan!** Contact admin.");
                return { success: false, error: "role_not_found" };
            }

            await member.roles.add(role);
            await this.markVerified(message.author.id);

            const successEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle("🎉 Verification Success!")
                .setDescription(`Selamat **${message.author}**! Lu berhasil verified!`)
                .addFields(
                    { 
                        name: "📊 Statistik Invite", 
                        value: `✅ Valid: ${stats.validInvites}\n❌ Tumbal: ${stats.tumbalDetected}\n📈 Total: ${stats.totalInvites}`, 
                        inline: true 
                    },
                    { name: "✨ Status", value: "Verified Member", inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: "BananaSkiee Community | Anti-Tumbal System Active" });

            await message.reply({ embeds: [successEmbed] });
            
            console.log(`✅ ${message.author.tag} berhasil verify via invite system`);
            
            return { success: true, alreadyVerified: false };
        } else {
            let description = `**${message.author}**, `;
            let fields = [];
            
            if (stats && stats.totalInvites > 0 && stats.validInvites === 0) {
                description += `lu udah invite ${stats.totalInvites} orang, tapi semuanya terdeteksi **akun tumbal/fake**!`;
                fields.push({
                    name: "🚫 Kenapa Ditolak?",
                    value: stats.rejectedInvites?.map(r => `• ${r.reason}`).join('\n') || "Akun terlalu baru (< 30 hari)",
                    inline: false
                });
            } else {
                description += `lu belum pernah invite siapapun yang join ke server ini!`;
            }

            const failEmbed = new EmbedBuilder()
                .setColor(0xe74c3c)
                .setTitle("❌ Verification Failed")
                .setDescription(description)
                .addFields(
                    { 
                        name: "📖 Cara Verify yang Benar:", 
                        value: 
                            "1️⃣ Buat invite link\n" +
                            "2️⃣ Share ke **temen dekat** yang pakai akun **asli/lama**\n" +
                            "3️⃣ Pastikan akun temen lu **udah 1 bulan+** dibuatnya\n" +
                            "4️⃣ Tunggu mereka **join server**\n" +
                            "5️⃣ Ketik `bs!verify invite` lagi",
                        inline: false 
                    },
                    ...fields,
                    {
                        name: "🛡️ Anti-Tumbal System",
                        value: "Kami otomatis menolak akun yang dibuat < 30 hari atau terdeteksi fake!",
                        inline: false
                    }
                )
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "BananaSkiee Verify System | Auto-Detect Tumbal" });

            await message.reply({ embeds: [failEmbed] });
            return { success: false, error: "no_valid_invites" };
        }
    }

    async getValidLeaderboard(guildId, limit = 10) {
        try {
            return await this.collection
                .aggregate([
                    { $match: { guildId: guildId } },
                    { 
                        $project: {
                            userId: 1,
                            userTag: 1,
                            validInviteCount: { 
                                $size: { 
                                    $filter: {
                                        input: "$successfulInvites",
                                        as: "invite",
                                        cond: { $eq: ["$$invite.isValid", true] }
                                    }
                                }
                            },
                            totalInvites: { $size: { $ifNull: ["$successfulInvites", []] } },
                            tumbalBlocked: { $size: { $ifNull: ["$rejectedInvites", []] } }
                        }
                    },
                    { $sort: { validInviteCount: -1 } },
                    { $limit: limit }
                ])
                .toArray();
        } catch (error) {
            console.error("❌ Error getting leaderboard:", error);
            return [];
        }
    }

    async getSuspiciousAccounts(guildId, limit = 20) {
        try {
            return await this.suspiciousCollection
                .find({ "joinHistory.guildId": guildId })
                .sort({ detectedAt: -1 })
                .limit(limit)
                .toArray();
        } catch (error) {
            console.error("❌ Error getting suspicious accounts:", error);
            return [];
        }
    }

    async close() {
        if (this.mongoClient) {
            await this.mongoClient.close();
            console.log("🔌 MongoDB Connection Closed");
        }
    }
}

module.exports = VerifyInviteSystem;
