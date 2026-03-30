/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║           AKIRA BOT - TRIPLE VERIFY SYSTEM v3.0                ║
 * ║         Auto-Progression: V1→NV2→V2→NV3→V3 (Complete)          ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * RULES:
 * - Verify Role: Permanent, stackable (1+2+3), tidak pernah dihapus
 * - Non-Verify Role: Bergantian, hanya 1 aktif, auto-next saat verify
 * - Trigger: guildMemberUpdate (detect role changes)
 */

class TripleVerifySystem {
    constructor() {
        // ROLE IDs - VERIFY (Permanent, tidak boleh dihapus)
        this.V = {
            V1: '1352286235233620108',  // Verify Member (Chat)
            V2: '1444248605761470595',  // Verify Bio (Hosting) ⭐
            V3: '1444248590305202247'   // Verify Resources (Code/Web/Plugin)
        };

        // ROLE IDs - NON-VERIFY (Bergantian, hanya 1 aktif)
        this.NV = {
            NV1: '1444248589051367435', // Join awal
            NV2: '1444248606579097640', // Setelah V1
            NV3: '1444248605245313156'  // Setelah V2
        };

        this.LOG_CHANNEL = '1352800131933802547';
        this.client = null;
    }

    async init(client) {
        this.client = client;
        
        // Listen role changes
        client.on('guildMemberUpdate', async (oldM, newM) => {
            await this.handleRoleChange(oldM, newM);
        });

        console.log('✅ TripleVerifySystem: Auto-progression V1→NV2→V2→NV3→V3 active');
        console.log(`📋 V1=${this.V.V1}, V2=${this.V.V2}, V3=${this.V.V3}`);
        console.log(`📋 NV1=${this.NV.NV1}, NV2=${this.NV.NV2}, NV3=${this.NV.NV3}`);
    }

    /**
     * CORE: Detect role changes & auto-progress
     */
    async handleRoleChange(oldMember, newMember) {
        const { guild, user } = newMember;
        
        // Skip non-target server
        if (guild.id !== process.env.GUILD_ID) return;

        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        // Detect ADDED roles only
        const added = newRoles.filter(r => !oldRoles.has(r.id));
        if (added.size === 0) return;

        // ═══════════════════════════════════════════════════════════
        // SCENARIO 1: Dapat V1 → Hapus NV1, Kasih NV2
        // ═══════════════════════════════════════════════════════════
        if (added.has(this.V.V1)) {
            console.log(`🎯 ${user.tag}: Got V1`);
            
            // Hapus NV1 jika ada
            if (newRoles.has(this.NV.NV1)) {
                await newMember.roles.remove(this.NV.NV1);
                console.log(`  🗑️ Removed NV1`);
            }
            
            // Kasih NV2 (hanya jika belum punya V2)
            if (!newRoles.has(this.V.V2)) {
                await newMember.roles.add(this.NV.NV2);
                console.log(`  ✅ Granted NV2`);
                await this.log(guild, `🟡 ${user.tag}: V1 acquired, NV1→NV2`);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // SCENARIO 2: Dapat V2 → Hapus NV2, Kasih NV3
        // ═══════════════════════════════════════════════════════════
        if (added.has(this.V.V2)) {
            console.log(`🎯 ${user.tag}: Got V2`);
            
            // Hapus NV2 jika ada
            if (newRoles.has(this.NV.NV2)) {
                await newMember.roles.remove(this.NV.NV2);
                console.log(`  🗑️ Removed NV2`);
            }
            
            // Kasih NV3 (hanya jika belum punya V3)
            if (!newRoles.has(this.V.V3)) {
                await newMember.roles.add(this.NV.NV3);
                console.log(`  ✅ Granted NV3`);
                await this.log(guild, `🟠 ${user.tag}: V2 acquired, NV2→NV3`);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // SCENARIO 3: Dapat V3 → Hapus NV3, Complete!
        // ═══════════════════════════════════════════════════════════
        if (added.has(this.V.V3)) {
            console.log(`🎯 ${user.tag}: Got V3 - COMPLETE!`);
            
            // Hapus NV3 jika ada
            if (newRoles.has(this.NV.NV3)) {
                await newMember.roles.remove(this.NV.NV3);
                console.log(`  🗑️ Removed NV3`);
            }
            
            await this.log(guild, `🟢 ${user.tag}: V3 acquired, FULL ACCESS`);
            await this.sendCompletionDM(newMember);
            return;
        }
    }

    /**
     * VALIDATION: Fix conflict roles (safety check)
     */
    async validateMember(member) {
        const roles = member.roles.cache;
        
        // Rule: Punya V1 = tidak boleh punya NV1
        if (roles.has(this.V.V1) && roles.has(this.NV.NV1)) {
            await member.roles.remove(this.NV.NV1);
        }
        
        // Rule: Punya V2 = tidak boleh punya NV1, NV2
        if (roles.has(this.V.V2)) {
            if (roles.has(this.NV.NV1)) await member.roles.remove(this.NV.NV1);
            if (roles.has(this.NV.NV2)) await member.roles.remove(this.NV.NV2);
        }
        
        // Rule: Punya V3 = tidak boleh punya semua NV
        if (roles.has(this.V.V3)) {
            if (roles.has(this.NV.NV1)) await member.roles.remove(this.NV.NV1);
            if (roles.has(this.NV.NV2)) await member.roles.remove(this.NV.NV2);
            if (roles.has(this.NV.NV3)) await member.roles.remove(this.NV.NV3);
        }
    }

    /**
     * Get member verification status
     */
    getStatus(member) {
        const r = member.roles.cache;
        return {
            hasV1: r.has(this.V.V1),
            hasV2: r.has(this.V.V2),
            hasV3: r.has(this.V.V3),
            hasNV1: r.has(this.NV.NV1),
            hasNV2: r.has(this.NV.NV2),
            hasNV3: r.has(this.NV.NV3),
            currentStage: r.has(this.V.V3) ? 3 : r.has(this.V.V2) ? 2 : r.has(this.V.V1) ? 1 : 0,
            currentNV: r.has(this.NV.NV3) ? 3 : r.has(this.NV.NV2) ? 2 : r.has(this.NV.NV1) ? 1 : 0
        };
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════

    async log(guild, message) {
        const ch = this.client.channels.cache.get(this.LOG_CHANNEL);
        if (ch) await ch.send(message).catch(() => {});
    }

    async sendCompletionDM(member) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 Verifikasi Lengkap!')
            .setDescription(
                `Selamat **${member.user.username}**! 🚀\n\n` +
                `✅ **V1** - Member Chat\n` +
                `✅ **V2** - Bio/Hosting  \n` +
                `✅ **V3** - Resources\n\n` +
                `Semua akses telah terbuka!\n` +
                `Selamat datang di komunitas penuh! 🌟`
            );
        
        await member.send({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = new TripleVerifySystem();
