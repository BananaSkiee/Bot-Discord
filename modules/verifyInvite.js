// Tambahin di bagian atas CONFIG
const CONFIG = {
    VERIFY_CHANNEL_ID: "1487876516971806730",
    VERIFIED_ROLE_ID: "1444248590305202247",
    REQUIRED_ROLE_ID: "1444248605761470595",
    MEMBER_ROLE_ID: "1352286235233620108",
    MIN_STAY_HOURS: 24,
    MIN_ACCOUNT_AGE_DAYS: 30,
    GUILD_ID: "1347233781391560837",
    ADMIN_ROLES: ["1352286235233620108", "1444248590305202247"] // Role yang bisa manage bonus
};

// Tambahin method di class VerifyInviteSystem:

// Cek apakah user adalah admin
isAdmin(member) {
    return CONFIG.ADMIN_ROLES.some(roleId => member.roles.cache.has(roleId));
}

// Kasih bonus invite ke user
async addBonus(userId, amount, givenBy, reason = "No reason") {
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

// Kurangi bonus
async removeBonus(userId, amount, givenBy, reason = "No reason") {
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
                        reason: reason,
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

// Reset bonus user
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

// Get bonus history user
async getBonusHistory(userId, limit = 10) {
    try {
        const data = await this.collection.findOne({ userId: userId });
        if (!data || !data.bonusHistory) return [];
        
        return data.bonusHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    } catch (err) {
        console.error("❌ Get bonus history error:", err);
        return [];
    }
}

// Command handler untuk bonus system
async handleBonusCommand(message, args) {
    // Cek admin
    if (!this.isAdmin(message.member)) {
        const embed = {
            components: [{
                type: 17,
                components: [
                    { type: 14 },
                    { type: 10, content: "## <a:silang:1001076112534810624> **Access Denied**\n> Anda tidak memiliki izin untuk mengelola bonus invite." },
                    { type: 14 },
                    { type: 10, content: "-# EmpireBS - Admin Only" }
                ]
            }],
            flags: 32768
        };
        const msg = await message.reply(embed);
        setTimeout(() => message.delete().catch(() => {}), 100);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
        return;
    }

    const subCmd = args[0]?.toLowerCase();
    
    // bs!bonus @user <amount> [reason]
    if (!subCmd || message.mentions.users.first()) {
        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);
        const reason = args.slice(2).join(" ") || "Bonus dari admin";
        
        if (!target || isNaN(amount) || amount <= 0) {
            const embed = {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: "### ⚠️ **Usage**\n> `bs!bonus @user <jumlah> [alasan]`\n> `bs!bonus remove @user <jumlah>`\n> `bs!bonus reset @user`\n> `bs!bonus log @user`" },
                        { type: 14 },
                        { type: 10, content: "-# EmpireBS - Bonus System" }
                    ]
                }],
                flags: 32768
            };
            const msg = await message.reply(embed);
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
                        { type: 10, content: `### <a:betul:728231880771764266> **Bonus Added**\n> **Target:** <@${target.id}>\n> **Amount:** +${amount} invites\n> **Reason:** ${reason}\n> **By:** <@${message.author.id}>` },
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
    
    // bs!bonus remove @user <amount>
    if (subCmd === "remove") {
        const target = message.mentions.users.first();
        const amount = parseInt(args[2]);
        
        if (!target || isNaN(amount) || amount <= 0) {
            const msg = await message.reply({
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: "### ⚠️ **Usage:** `bs!bonus remove @user <jumlah>`" },
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
        
        const result = await this.removeBonus(target.id, amount, message.author.id, "Removed by admin");
        
        const embed = result.success ? {
            components: [{
                type: 17,
                components: [
                    { type: 14 },
                    { type: 10, content: `### <a:betul:728231880771764266> **Bonus Removed**\n> **Target:** <@${target.id}>\n> **Amount:** -${amount} invites\n> **By:** <@${message.author.id}>` },
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
                    { type: 10, content: `## <a:silang:1001076112534810624> **Failed**\n> ${result.error}` },
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
    
    // bs!bonus reset @user
    if (subCmd === "reset") {
        const target = message.mentions.users.first();
        
        if (!target) {
            const msg = await message.reply({
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: "### ⚠️ **Usage:** `bs!bonus reset @user`" },
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
                    { type: 10, content: `### <a:betul:728231880771764266> **Bonus Reset**\n> **Target:** <@${target.id}>\n> **Reset Amount:** ${result.amount} invites\n> **By:** <@${message.author.id}>` },
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
                    { type: 10, content: `## <a:silang:1001076112534810624> **Failed**\n> ${result.error}` },
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
    
    // bs!bonus log @user
    if (subCmd === "log") {
        const target = message.mentions.users.first() || message.author;
        const history = await this.getBonusHistory(target.id, 10);
        
        if (history.length === 0) {
            const embed = {
                components: [{
                    type: 17,
                    components: [
                        { type: 14 },
                        { type: 10, content: `### 📋 **Bonus History**\n> <@${target.id}> tidak memiliki history bonus.` },
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
            return `> \`${date}\` ${sign}${h.amount} • ${h.reason} • ${h.type}`;
        }).join('\n');
        
        const embed = {
            components: [{
                type: 17,
                components: [
                    { type: 14 },
                    { type: 10, content: `### 📋 **Bonus History - ${target.username}**\n${historyText}` },
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
