ssion.step = 'ready_for_rating';
                this.updateUserSession(userId, session);
                
                // Panggil fungsi untuk mengaktifkan tombol Next Verify
                await this.enableNextVerifyButton(verifyMessage);
                
                // *** PENTING: BLOK KIRIM DM SUDAH DIHAPUS DI SINI ***
            }
        }
    }
    
    async autoProceedToMission(message) {
        // Fungsi ini dipanggil setelah 30 detik (setTimeout) dari handleContinueVerify
        const userId = message.mentions.users.first()?.id;
        if (!userId) return;

        const session = this.getUserSession(userId);
        if (!session || session.step !== 'server_exploration') return;

        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🎯 MISI PERKENALAN DI CHANNEL GENERAL')
            .setDescription(`Selamat datang, ${message.mentions.users.first().username}!\n\n**LANGKAH SELANJUTNYA:**\n\n1. Kunjungi <#${this.config.generalChannelId}>\n2. Kirim pesan perkenalan singkat\n3. Setelah terdeteksi, tombol **NEXT VERIFY** akan aktif di sini!\n\n*Atau* klik **[❓ SEE MISSION]** untuk detail misi.`)
            .setFooter({ text: 'Kami akan otomatis mendeteksi pesan pertama Anda!' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('next_verify')
                    .setLabel('➡️ NEXT VERIFY')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true), // Awalnya disabled
                new ButtonBuilder()
                    .setCustomId('see_mission')
                    .setLabel('❓ SEE MISSION') // <-- Button ini akan Ephemeral/Dismissive
                    .setStyle(ButtonStyle.Secondary)
            );
            
        // Edit pesan yang sudah ada (Non-Dismissive)
        await message.edit({ embeds: [embed], components: [buttons] });
        this.updateUserSession(userId, { step: 'mission', explorationEnd: Date.now() });
    }
    
    async enableNextVerifyButton(message) {
        // Fungsi ini dipanggil dari detectFirstMessage untuk mengaktifkan tombol
        const components = message.components.map(row => {
            // Gunakan from(row.toJSON()) untuk membuat ActionRowBuilder yang bisa diedit
            const newRow = ActionRowBuilder.from(row.toJSON()); 
            newRow.components.forEach((component, index) => {
                // Gunakan from(component.toJSON()) untuk membuat ButtonBuilder yang bisa diedit
                const newComponent = ButtonBuilder.from(component.toJSON()); 
                if (newComponent.data.custom_id === 'next_verify') {
                    // Setel ulang Button (Non-Dismissive)
                    newRow.components[index] = newComponent.setDisabled(false).setStyle(ButtonStyle.Primary);
                }
            });
            return newRow;
        });
        
        // Memastikan tombol `next_verify` berwarna Primary (biru) saat aktif
        await message.edit({ components: components });
    }
    
    // ========== ROLE MANAGEMENT & LOGGING (NON-DISMISSIVE) ==========
    async handleGiveRole(interaction) {
        try {
            await interaction.deferUpdate();
            
            const success = await this.grantMemberAccess(interaction);
            
            if (success) {
                // LOGGING KE FORUM CHANNEL BERJALAN DI SINI
                // TIDAK DIMINTA MENGUBAH LOGIC INI
                await this.logVerification(interaction);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ ROLE BERHASIL DIBERIKAN')
                    .setDescription(`Role member telah diberikan kepada ${interaction.user.username}!\n\nChannel verify sekarang tersembunyi untuk Anda.`)
                    .setFooter({ text: 'Welcome to BananaSkiee Community!' });
                
                // EDIT REPLY AGAR TETAP TERLIHAT DI CHANNEL VERIFIKASI (Non-Dismissive)
                await interaction.editReply({ embeds: [embed], components: [] });
                
                this.userSessions.delete(interaction.user.id);
            }
        } catch (error) {
            console.error('Give role error:', error);
            await interaction.editReply({ content: '❌ Failed to give role.', components: [] });
        }
    }
    
    async grantMemberAccess(interaction) {
        try {
            const member = interaction.member;
            if (!member.roles.cache.has(this.config.memberRoleId)) {
                await member.roles.add(this.config.memberRoleId, 'Verification completed');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Grant member access error:', error);
            return false;
        }
    }

    // ========== LOGGING SYSTEM (KE FORUM CHANNEL) - TIDAK DIMINTA MENGUBAH ========== 
    async logVerification(interaction) {
        try {
            const logChannel = await interaction.guild.channels.fetch(this.config.logChannelId);
            
            if (!logChannel || logChannel.type !== ChannelType.GuildForum) {
                 console.log(`⚠️ Log Channel ID ${this.config.logChannelId} is not a Forum Channel or not found. Log skipped.`);
                 return;
            }

            const session = this.getUserSession(interaction.user.id);
            const user = interaction.user;
            const member = interaction.member;
            
            const logContent = this.generateLogContent(user, member, session);

            // Membuat Post Forum (thread) dengan JUDUL NAMA USER
            const forumPost = await logChannel.threads.create({
                // JUDUL THREAD = NAMA USER (Sesuai Permintaan)
                name: `${user.username} - Verification Log`, 
                message: { 
                    content: logContent,
                },
            });

            console.log(`📋 Verification forum post created: ${forumPost.id} - ${user.username}`);
        } catch (error) {
            console.error('❌ Logging error:', error);
        } 
    }

    // ========== LOG CONTENT GENERATOR - TIDAK DIMINTA MENGUBAH ==========
    generateLogContent(user, member, session) { 
        const timestamp = new Date().toLocaleString('id-ID'); 
        const accountAge = this.getAccountAge(user.createdAt); 
        
        let earlySupporterStatus = '❌';
        try {
            if (user.flags && user.flags.has(UserFlags.EarlySupporter)) {
                earlySupporterStatus = '✅';
            }
        } catch (e) { /* silent fail */ }

        return `  
🎴 USER PROFILE CARD 🎴
┌───────────────────────────────────────────────────┐
│ 🏷️ ${user.username} │
│ 💬 "${user.globalName || 'No bio set'}" │
│ 🌐 ${member.presence?.status || 'Offline'} • ${member.presence?.activities?.[0]?.name || 'No activity'} │
│ 🏷️ Server Nickname: ${member.nickname || 'None'} │
└───────────────────────────────────────────────────┘

👤 EXTENDED USER IDENTITY
├─ 🔹 Username: ${user.username}
├─ 🔹 Display Name: ${user.displayName}
├─ 🔹 Global Name: ${user.globalName || 'N/A'}
├─ 🔹 User ID: ${user.id}
├─ 🔹 Server Nickname: ${member.nickname || 'None'}
├─ 🔹 Status: ${member.presence?.status || 'Offline'}
├─ 🔹 Activities: ${member.presence?.activities?.map(a => a.name).join(' • ') || 'None'}
└─ 🔹 Client: ${this.getUserClient(user)}

📱 ACCOUNT BADGES & PREMIUM
├─ 🏆 Early Supporter: ${earlySupporterStatus}
├─ 💎 Nitro: ${member.premiumSince ? '✅ Active Subscription' : '❌'}
├─ 🎮 Nitro Games: ${member.premiumSince ? '✅ Included' : '❌'}
├─ 🎨 Nitro Avatar: ${user.avatar?.startsWith('a_') ? '✅ Animated' : '❌'}
├─ 🖼️ Profile Banner: ${user.banner ? '✅ Custom Banner' : '❌'}
├─ 📈 Server Boosts: ${member.premiumSince ? 'Active' : 'None'}
└─ 💳 Premium Tier: ${member.premiumSince ? 'Nitro' : 'None'}

📊 ACCOUNT METADATA
├─ 📅 Account Created: ${user.createdAt.toLocaleString('id-ID')}
├─ 🎂 Account Age: ${accountAge} hari
├─ 🌍 Location: Detected from IP
├─ 🕒 Timezone: GMT+7 (WIB)
├─ 💬 Language: English, Bahasa Indonesia
└─ 🔞 Age: Estimated from account creation

💬 FIRST INTERACTION - FULL CONTEXT
├─ 📝 Original Message: "${session?.data?.firstMessage || 'N/A'}"
├─ 🔗 Message Link: N/A (Internal)
├─ 🕒 Timestamp: ${session?.data?.firstMessageTime ? new Date(session.data.firstMessageTime).toLocaleString('id-ID') : 'N/A'}
├─ 📍 Channel: 「💬」ɢᴇɴᴇRᴬL
├─ ⏱️ Response Time: ${session?.data?.responseTime ? Math.round(session.data.responseTime / 1000) + ' detik' : 'N/A'}
└─ 🔥 Engagement: First message detected

🔄 VERIFICATION PROCESS - DETAILED TIMELINE
├─ 🕒 Start: ${session?.createdAt ? new Date(session.createdAt).toLocaleString('id-ID') : 'N/A'}
├─ 🕒 End: ${timestamp}
├─ ⏱️ Total: ${this.getTotalDuration(session)}
├─ 📊 Steps: ${this.getCompletedSteps(session)}
└─ 🎯 Status: COMPLETED

⭐ RATING & FEEDBACK ANALYSIS
├─ 🎯 Final Rating: ${session?.data?.rating || 'N/A'}/100
├─ 📊 Rating Category: ${session?.data?.ratingCategory || 'N/A'}
├─ 🕒 Rating Time: ${session?.data?.ratingTime ? new Date(session.data.ratingTime).toLocaleString('id-ID') : 'N/A'}
├─ 💬 Feedback: ${session?.data?.feedback ? '✅ Provided' : '❌ None'}
└─ 🔄 Rating Changes: ${session?.data?.rating ? 'Recorded' : 'N/A'}

🔮 ADVANCED ANALYTICS & PREDICTIONS
├─ 📈 Engagement Probability: ${this.getEngagementScore(session)}%
├─ 🏆 Engagement Level: ${this.getEngagementLevel(session)}
├─ 🗓️ Predicted Retention: ${this.getRetentionMonths(session)}+ bulan
├─ 🤝 Potential Connections: ${this.getPotentialConnections(session)} dalam 30 hari
└─ 🎯 Activity Pattern: Detected

🛡️ SECURITY & TRUST SCORE
├─ 🔒 Account Security: ${this.getSecurityScore(user)}/100
├─ 📅 Account Age: ${accountAge > 365 ? '✅ Established' : '⚠️ New'}
├─ 🚫 Previous Bans: ✅ Clean
├─ 🔄 Verification History: First Time
└─ 🏆 Trust Level: ${this.getTrustLevel(user)}

🎁 PERMISSIONS & ROLE GRANTS
├─ 👑 Member Role: ✅ Granted
├─ 📍 Channel Access: 45+ channels unlocked
├─ 🏆 Achievement Unlocked: Verified Member
└─ ⚡ Permission Sync: Complete

📋 LOG METADATA
├─ 🕒 Generated: ${timestamp}
├─ 🔧 System Version: VerifySystem v3.2.1
├─ 🤖 Bot ID: BS#9886
├─ 🏠 Server: BananaSkiee Community
├─ 📁 Log ID: VRF_${user.id}_${Date.now()}
└─ 🔍 Access Level: Admin & Moderator Only
`;
    }

    // ========== HELPER FUNCTIONS ==========
    getAccountAge(accountCreationDate) { const created = new Date(accountCreationDate); const now = new Date(); const diffTime = Math.abs(now - created); return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); }
    getTotalDuration(session) { if (!session?.createdAt) return 'N/A'; const duration = Date.now() - session.createdAt; const minutes = Math.floor(duration / 60000); const seconds = Math.floor((duration % 60000) / 1000); return `${minutes} menit ${seconds} detik`; }
    getCompletedSteps(session) { if (!session) return '0/8'; const steps = ['verified', 'server_exploration', 'mission', 'ready_for_rating', 'rating', 'completed']; const currentStep = steps.indexOf(session.step); return currentStep >= 0 ? `${currentStep + 1}/8` : 'N/A'; }
    getEngagementScore(session) { let score = 50; if (session?.data?.rating) score += (session.data.rating - 50) / 2; if (session?.data?.feedback) score += 10; if (session?.data?.firstMessage) score += 15; return Math.min(Math.round(score), 95); }
    getEngagementLevel(session) { const score = this.getEngagementScore(session); if (score >= 80) return 'High Engagement'; if (score >= 60) return 'Medium Engagement'; return 'Low Engagement'; }
    getRetentionMonths(session) { const engagement = this.getEngagementScore(session); return Math.round((engagement / 100) * 12); }
    getPotentialConnections(session) { const engagement = this.getEngagementScore(session); return Math.round((engagement / 100) * 20); }
    getSecurityScore(user) { let score = 70; if (user.flags?.has('VerifiedBot')) score += 20; if (user.avatar) score += 5; if (user.banner) score += 5; return Math.min(score, 100); }
    getTrustLevel(user) { const score = this.getSecurityScore(user); if (score >= 80) return 'High'; if (score >= 60) return 'Medium'; return 'Low'; }
    getUserClient(user) { return 'Desktop/Mobile'; } 
    getAchievements(session) { return '🏆 Verified Member\n✨ Completed Mission\n🌟 High Rated Service'; }

    // RATING UTILITIES
    getRatingCategory(rating) { if (rating <= 50) return "Perlu improvement"; if (rating <= 75) return "Cukup memuaskan"; if (rating <= 90) return "Baik & profesional"; return "Luar biasa"; }
    getRatingColor(rating) { if (rating <= 50) return 0xFF0000; if (rating <= 75) return 0xFFA500; if (rating <= 90) return 0x00FF00; return 0x0000FF; }
    getRatingEmoji(rating) { if (rating <= 50) return "❌"; if (rating <= 75) return "⚠️"; if (rating <= 90) return "✅"; return "🎉"; }

    // SESSION MANAGEMENT
    createUserSession(userId) {
        if (this.userSessions.has(userId)) { return this.userSessions.get(userId); }
        const session = { id: userId, createdAt: Date.now(), step: 'verified', data: {}, lastActivity: Date.now(), welcomeSent: false };
        this.userSessions.set(userId, session);
        return session;
    }
    getUserSession(userId) { return this.userSessions.get(userId); }
    updateUserSession(userId, updates) {
        const session = this.getUserSession(userId);
        if (session) {
            Object.assign(session, updates, { lastActivity: Date.now() });
            this.userSessions.set(userId, session);
        }
        return session;
    }

    // UTILITY
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    // handleCustomMessage dan handleCustomMessageSubmit diabaikan karena tidak ada di interactionCreate Anda.
    async handleAutoWelcome() {}
    async handleWelcomeSelection() {}
    async handleCustomMessage() {}
    async handleCustomMessageSubmit() {} 
}

module.exports = VerifySystem;
