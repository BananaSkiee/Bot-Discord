// modules/verifyInvite.js
const { MongoClient } = require('mongodb');
const { EmbedBuilder } = require('discord.js');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const DB_NAME = "akira_bot";
const COLLECTION_NAME = "invite_verifications";

class VerifyInviteSystem {
    constructor() {
        this.client = null;
        this.db = null;
        this.collection = null;
        this.pendingInvites = new Map(); // Cache sementara: userId -> {inviterId, timestamp}
    }

    async connect() {
        try {
            this.client = new MongoClient(MONGO_URI);
            await this.client.connect();
            this.db = this.client.db(DB_NAME);
            this.collection = this.db.collection(COLLECTION_NAME);
            
            // Buat index untuk query cepat
            await this.collection.createIndex({ userId: 1 }, { unique: true });
            await this.collection.createIndex({ inviterId: 1 });
            
            console.log("✅ MongoDB Connected untuk VerifyInvite System");
        } catch (error) {
            console.error("❌ MongoDB Connection Error:", error);
            throw error;
        }
    }

    // Dipanggil saat member join - track siapa yang invite
    async trackInvite(member, inviteUsed) {
        try {
            if (!inviteUsed || !inviteUsed.inviter) return;

            const inviterId = inviteUsed.inviter.id;
            const joinedUserId = member.id;
            const guildId = member.guild.id;

            // Simpan ke database - catat bahwa inviter ini berhasil invite seseorang
            await this.collection.updateOne(
                { userId: inviterId },
                { 
                    $push: { 
                        successfulInvites: {
                            invitedUserId: joinedUserId,
                            invitedUserTag: member.user.tag,
                            joinedAt: new Date(),
                            inviteCode: inviteUsed.code
                        }
                    },
                    $setOnInsert: { 
                        userId: inviterId,
                        userTag: inviteUsed.inviter.tag,
                        verifiedAt: null,
                        isVerified: false,
                        guildId: guildId
                    }
                },
                { upsert: true }
            );

            console.log(`📝 Tracked: ${inviteUsed.inviter.tag} invited ${member.user.tag}`);
        } catch (error) {
            console.error("❌ Error tracking invite:", error);
        }
    }

    // Cek apakah user sudah pernah invite minimal 1 orang
    async hasInvited(userId) {
        try {
            const data = await this.collection.findOne({ userId: userId });
            return data && data.successfulInvites && data.successfulInvites.length > 0;
        } catch (error) {
            console.error("❌ Error checking invites:", error);
            return false;
        }
    }

    // Get detail invite user
    async getInviteDetails(userId) {
        try {
            return await this.collection.findOne({ userId: userId });
        } catch (error) {
            console.error("❌ Error getting invite details:", error);
            return null;
        }
    }

    // Mark user as verified
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

    // Command handler untuk bs!verify invite
    async handleVerifyCommand(message, config) {
        const { VERIFY_CHANNEL_ID, VERIFIED_ROLE_ID } = config;
        
        // Cek channel
        if (message.channel.id !== VERIFY_CHANNEL_ID) {
            return { success: false, error: "wrong_channel" };
        }

        // Cek apakah sudah verified
        const member = message.member;
        if (member.roles.cache.has(VERIFIED_ROLE_ID)) {
            const embed = new EmbedBuilder()
                .setColor(0x3498db)
                .setDescription("✅ **Lu udah verified sebelumnya!**")
                .setFooter({ text: "BananaSkiee Verify System" });
            
            await message.reply({ embeds: [embed] });
            return { success: true, alreadyVerified: true };
        }

        // Cek apakah user pernah invite orang
        const hasInvited = await this.hasInvited(message.author.id);

        if (hasInvited) {
            // Berikan role verified
            const role = message.guild.roles.cache.get(VERIFIED_ROLE_ID);
            if (!role) {
                await message.reply("❌ **Role verified tidak ditemukan!** Contact admin.");
                return { success: false, error: "role_not_found" };
            }

            await member.roles.add(role);
            await this.markVerified(message.author.id);

            // Get stats untuk ditampilkan
            const details = await this.getInviteDetails(message.author.id);
            const inviteCount = details?.successfulInvites?.length || 0;

            const successEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle("🎉 Verification Success!")
                .setDescription(`Selamat **${message.author}**! Lu berhasil verified!`)
                .addFields(
                    { name: "📊 Total Invites", value: `${inviteCount} user`, inline: true },
                    { name: "✨ Status", value: "Verified Member", inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: "BananaSkiee Community" });

            await message.reply({ embeds: [successEmbed] });
            
            // Log ke channel log (opsional)
            console.log(`✅ ${message.author.tag} berhasil verify via invite system`);
            
            return { success: true, alreadyVerified: false };
        } else {
            // Belum pernah invite
            const failEmbed = new EmbedBuilder()
                .setColor(0xe74c3c)
                .setTitle("❌ Verification Failed")
                .setDescription(`**${message.author}**, lu belum pernah invite siapapun yang join ke server ini!`)
                .addFields(
                    { 
                        name: "📖 Cara Verify:", 
                        value: 
                            "1️⃣ Buat invite link (bisa lewat Discord atau bot)\n" +
                            "2️⃣ Share link ke temen/teman lu\n" +
                            "3️⃣ Tunggu mereka **join server**\n" +
                            "4️⃣ Ketik `bs!verify invite` lagi di channel ini",
                        inline: false 
                    },
                    {
                        name: "💡 Tips:",
                        value: "Pastikan temen lu beneran join, bukan cuma klik link doang!",
                        inline: false
                    }
                )
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "BananaSkiee Verify System" });

            await message.reply({ embeds: [failEmbed] });
            return { success: false, error: "no_invites" };
        }
    }

    // Get leaderboard invites (opsional)
    async getLeaderboard(guildId, limit = 10) {
        try {
            return await this.collection
                .find({ guildId: guildId })
                .sort({ "successfulInvites": -1 })
                .limit(limit)
                .toArray();
        } catch (error) {
            console.error("❌ Error getting leaderboard:", error);
            return [];
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log("🔌 MongoDB Connection Closed");
        }
    }
}

// Singleton instance
const verifyInviteSystem = new VerifyInviteSystem();

module.exports = verifyInviteSystem;
