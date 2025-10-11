events/interactionCreate.js
const fs = require("fs");
const path = require("path");
const { ROLES, guildId } = require("../config");
const { EmbedBuilder } = require("discord.js");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

// Store untuk guidebook sessions
const guidebookSessions = new Map();

// ========== IMPORT VERIFY SYSTEM ==========
const VerifySystem = require('../modules/verify');
const verifySystem = new VerifySystem();

function saveTaggedUsers(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      console.log("👉 Interaction diterima:", interaction.type, interaction.customId);

      // ========== VERIFY SYSTEM MODAL HANDLERS ==========
      if (interaction.isModalSubmit()) {
        if (interaction.customId === 'custom_profile_modal') {
          return await verifySystem.handlers.handleModalSubmit(interaction);
        }
        if (interaction.customId === 'rating_modal') {
          return await verifySystem.handlers.handleRatingSubmit(interaction);
        }
      }

      // ========== VERIFY SYSTEM BUTTON HANDLERS ==========
      if (interaction.isButton()) {
        // VERIFY BUTTON
        if (interaction.customId === 'verify_account') {
          return await verifySystem.handleVerify(interaction);
        }
        
        // START COMMUNITY BUTTON
        if (interaction.customId === 'start_community') {
          return await verifySystem.handleStartCommunity(interaction);
        }
        
        // START ONBOARDING BUTTON
        if (interaction.customId === 'start_onboarding') {
          return await verifySystem.handleStartOnboarding(interaction);
        }
        
        // CONFIRM ONBOARDING BUTTON
        if (interaction.customId === 'confirm_onboarding') {
          return await verifySystem.handleConfirmOnboarding(interaction);
        }
        
        // SKIP ONBOARDING BUTTON
        if (interaction.customId === 'skip_onboarding') {
          return await verifySystem.handleSkipOnboarding(interaction);
        }
        
        // CUSTOM FORM BUTTON
        if (interaction.customId === 'custom_form') {
          return await verifySystem.handleCustomForm(interaction);
        }
        
        // RATING & FEEDBACK BUTTONS
        if (interaction.customId === 'input_rating') {
          return await verifySystem.handlers.handleRatingInput(interaction);
        }
        if (interaction.customId === 'next_without_rating') {
          return await verifySystem.handlers.handleFeedbackSkip(interaction);
        }
        if (interaction.customId === 'feedback_detail') {
          // Skip rating langsung ke feedback
          const session = verifySystem.getUserSession(interaction.user.id);
          if (session) {
            session.data.rating = null;
            verifySystem.updateUserSession(interaction.user.id, session);
          }
          return await verifySystem.handlers.handleFeedbackSubmit(interaction);
        }
        if (interaction.customId === 'submit_feedback') {
          return await verifySystem.handlers.handleFeedbackSubmit(interaction);
        }
        if (interaction.customId === 'skip_feedback') {
          return await verifySystem.handleComplete(interaction);
        }
      }
      
            // ========== VERIFY SYSTEM SELECT MENU HANDLERS ==========
      if (interaction.isStringSelectMenu() && interaction.customId === 'info_select') {
        const selected = interaction.values[0];
        
        const rulesModule = require('../modules/rules');
        const rules = await rulesModule.execute(interaction.client);
        
        let embed;
        
        switch(selected) {
            case 'leveling':
                embed = rules.levelingEmbed;
                break;
            case 'moderation':
                embed = rules.moderationPolicyEmbed;
                break;
            case 'counting':
                embed = rules.countingEmbed;
                break;
            default:
                embed = new EmbedBuilder()
                    .setTitle("❌ Information Not Found")
                    .setDescription("Sorry, the selected option is not available.")
                    .setColor(0xFF0000);
        }
        
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
        return;
      }

      // 🆕 HANDLER: TOMBOL GUIDEBOOK, SERVER RULES
      if (interaction.isButton()) {
        const customId = interaction.customId;
        
        // Tombol Guidebook
        if (customId === 'guidebook_btn') {
            const rulesModule = require('../modules/rules');
            const rules = await rulesModule.execute(interaction.client);
            
            // Simpan session untuk intro
            guidebookSessions.set(interaction.user.id, {
                currentPage: 0, // 0 = intro page
                message: null
            });
            
            await interaction.reply({
                embeds: [rules.guidebookIntro],
                components: [rules.startGuideButton],
                ephemeral: true
            });
            return;
        }
        
        // Tombol Server Rules
        if (customId === 'server_rules_btn') {
            const rulesModule = require('../modules/rules');
            const rules = await rulesModule.execute(interaction.client);
            
            await interaction.reply({
                embeds: [rules.rulesAllowedEmbed, rules.rulesNotAllowedEmbed],
                ephemeral: true
            });
            return;
        }
        
        // Tombol Start Guide
        if (customId === 'start_guide') {
            const session = guidebookSessions.get(interaction.user.id);
            if (!session) {
                await interaction.reply({
                    content: "❌ Session tidak ditemukan. Silakan buka Guidebook terlebih dahulu.",
                    ephemeral: true
                });
                return;
            }
            
            const rulesModule = require('../modules/rules');
            const rules = await rulesModule.execute(interaction.client);
            
            // Update session ke page 1
            guidebookSessions.set(interaction.user.id, {
                ...session,
                currentPage: 1
            });
            
            await interaction.update({
                embeds: [rules.guidebookPage1],
                components: [rules.guidebookNavigation]
            });
            return;
        }
        
        // 🆕 HANDLER: GUIDEBOOK NAVIGATION
        if (customId === 'guide_prev' || customId === 'guide_next' || customId === 'guide_close') {
            const session = guidebookSessions.get(interaction.user.id);
            if (!session) {
                await interaction.reply({
                    content: "❌ Session tidak valid. Silakan buka Guidebook kembali.",
                    ephemeral: true
                });
                return;
            }
            
            const rulesModule = require('../modules/rules');
            const rules = await rulesModule.execute(interaction.client);
            
            let newPage = session.currentPage;
            
            if (customId === 'guide_prev') {
                newPage = Math.max(0, session.currentPage - 1); // 0 = back ke intro
            } else if (customId === 'guide_next') {
                newPage = Math.min(5, session.currentPage + 1);
            } else if (customId === 'guide_close') {
                guidebookSessions.delete(interaction.user.id);
                
                try {
                    // 🎯 SOLUSI: Delete message (jika memungkinkan)
                    await interaction.message.delete();
                } catch (error) {
                    // 🎯 FALLBACK: Update dengan pesan minimal
                    await interaction.update({
                        content: "​", // Zero-width space
                        embeds: [],
                        components: []
                    });
                }
                return;
            }
            
            // Update session
            guidebookSessions.set(interaction.user.id, {
                ...session,
                currentPage: newPage
            });
            
            // Get the correct page embed dan components
            let currentEmbed;
            let components;
            
            if (newPage === 0) {
                // Kembali ke intro dengan tombol Start Guide
                currentEmbed = rules.guidebookIntro;
                components = rules.startGuideButton;
            } else {
                switch(newPage) {
                    case 1:
                        currentEmbed = rules.guidebookPage1;
                        components = rules.guidebookNavigation;
                        break;
                    case 2:
                        currentEmbed = rules.guidebookPage2;
                        components = rules.guidebookNavigation;
                        break;
                    case 3:
                        currentEmbed = rules.guidebookPage3;
                        components = rules.guidebookNavigation;
                        break;
                    case 4:
                        currentEmbed = rules.guidebookPage4;
                        components = rules.guidebookNavigation;
                        break;
                    case 5:
                        currentEmbed = rules.guidebookPage5;
                        components = rules.guidebookClose;
                        break;
                }
            }
            
            await interaction.update({
                embeds: [currentEmbed],
                components: [components]
            });
            return;
        }
      }

      // ========== DUEL ACCEPT/REJECT HANDLER ==========
      if (interaction.isButton() && interaction.customId && (
          interaction.customId.startsWith('accept_duel_') || 
          interaction.customId.startsWith('reject_duel_')
      )) {
          console.log(`🎯 Processing duel button: ${interaction.customId}`);
          
          const parts = interaction.customId.split('_');
          const action = parts[0]; // accept or reject
          const duelId = parts.slice(2).join('_');
          
          const shotgunCommand = require('../commands/shotgunCommand');
          
          if (action === 'accept') {
              await shotgunCommand.acceptDuel(duelId, interaction);
          } else if (action === 'reject') {
              await shotgunCommand.rejectDuel(duelId, interaction);
          }
          
          return;
      }

      // ========== SHOTGUN DUELS BUTTON HANDLER - FIXED ==========
      if (interaction.isButton() && interaction.customId) {
        const customId = interaction.customId;
        
        if (customId.startsWith('item_') || 
            customId.startsWith('shoot_self_') || 
            customId.startsWith('shoot_opponent_') ||
            customId.startsWith('surrender_')) {
            
            console.log(`🎯 Processing shotgun button: ${customId}`);
            
            let gameId, action, itemIndex;
            
            // FIX: Parsing yang benar untuk customId
            if (customId.startsWith('item_')) {
                const parts = customId.split('_');
                gameId = parts[1];
                itemIndex = parseInt(parts[2]);
                action = 'use_item';
            } else if (customId.startsWith('shoot_self_')) {
                gameId = customId.replace('shoot_self_', '');
                action = 'shoot_self';
            } else if (customId.startsWith('shoot_opponent_')) {
                gameId = customId.replace('shoot_opponent_', '');
                action = 'shoot_opponent';
            } else if (customId.startsWith('surrender_')) {
                gameId = customId.replace('surrender_', '');
                action = 'surrender';
            } else {
                await interaction.reply({ 
                    content: '❌ Invalid button!', 
                    ephemeral: true 
                });
                return;
            }
            
            const { gameManager } = require('../commands/shotgunCommand');
            const game = gameManager.getGame(gameId);
            
            if (!game) {
                await interaction.reply({ 
                    content: '❌ Game tidak ditemukan atau sudah selesai!', 
                    ephemeral: true 
                });
                return;
            }

            // Check if it's user's turn
            const currentPlayer = game.players[game.currentPlayer];
            if (!currentPlayer || currentPlayer.id !== interaction.user.id) {
                await interaction.reply({ 
                    content: '❌ Bukan giliran kamu!', 
                    ephemeral: true 
                });
                return;
            }

            // Defer update untuk button interactions
            await interaction.deferUpdate();

            try {
                switch (action) {
                    case 'use_item':
                        if (isNaN(itemIndex)) {
                            await interaction.followUp({ 
                                content: '❌ Item tidak valid!', 
                                ephemeral: true 
                            });
                            return;
                        }
                        await gameManager.useItem(gameId, interaction.user.id, itemIndex, interaction);
                        break;
                        
                    case 'shoot_self':
                        await gameManager.shoot(gameId, interaction.user.id, 'self', interaction);
                        break;
                        
                    case 'shoot_opponent':
                        await gameManager.shoot(gameId, interaction.user.id, 'opponent', interaction);
                        break;
                        
                    case 'surrender':
                        await gameManager.surrender(gameId, interaction.user.id, interaction);
                        break;
                        
                    default:
                        await interaction.followUp({ 
                            content: '❌ Aksi tidak dikenali!', 
                            ephemeral: true 
                        });
                }
            } catch (error) {
                console.error('❌ Error handling shotgun interaction:', error);
                await interaction.followUp({ 
                    content: '❌ Terjadi error saat memproses aksi!', 
                    ephemeral: true 
                });
            }
            return;
        }
      }

      // ========== EXISTING CODE - TIDAK DIUBAH ==========
      if (!interaction.isButton()) return;
      
      const username = interaction.user.globalName ?? interaction.user.username;
      const guild = interaction.client.guilds.cache.get(guildId);
      if (!guild) return;

      const member = await guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) {
        return interaction.reply({
          content: "❌ Gagal ambil datamu dari server.",
          ephemeral: true,
        });
      }

      const customId = interaction.customId;

      const taggedUsers = fs.existsSync(filePath)
        ? JSON.parse(fs.readFileSync(filePath, "utf8"))
        : {};

      // ========== TOMBOL ✅ UMUM ==========
      if (customId === "use_tag") {
        const role = ROLES.find(r => member.roles.cache.has(r.id));
        if (!role) {
          return interaction.reply({
            content: "❌ Kamu tidak punya role yang cocok untuk tag ini.",
            ephemeral: true,
          });
        }

        await member.setNickname(`${role.tag} ${username}`).catch(console.error);
        taggedUsers[member.id] = true;
        saveTaggedUsers(taggedUsers);

        return interaction.reply({
          content: `✅ Nama kamu sekarang: \`${role.tag} ${username}\``,
          ephemeral: true,
        });
      }

      // ========== TOMBOL ❌ HAPUS TAG UMUM ==========
      if (customId === "remove_tag") {
        await member.setNickname(username).catch(console.error);
        taggedUsers[member.id] = false;
        saveTaggedUsers(taggedUsers);

        return interaction.reply({
          content: "✅ Tag dihapus dan nickname dikembalikan.",
          ephemeral: true,
        });
      }

      // ========== TOMBOL TEST ✅ / ❌ ==========
      if (customId && (customId.startsWith("test_use_tag_") || customId.startsWith("test_remove_tag_"))) {
        const parts = customId.split("_");
        const action = parts[1];
        const roleId = parts[3];
        const safeTagId = parts.slice(4).join("_");

        const matched = ROLES.find(
          r =>
            r.id === roleId &&
            r.tag.replace(/[^\w-]/g, "").toLowerCase() === safeTagId
        );

        if (!matched) {
          return interaction.reply({
            content: "❌ Tag tidak ditemukan atau tidak valid.",
            ephemeral: true,
          });
        }

        const realTag = matched.tag;

        if (action === "use") {
          await member.setNickname(`${realTag} ${username}`).catch(console.error);
          if (!member.roles.cache.has(matched.id)) {
            await member.roles.add(matched.id).catch(console.error);
          }
          taggedUsers[member.id] = true;
          saveTaggedUsers(taggedUsers);

          return interaction.reply({
            content: `🧪 Nickname kamu sekarang: \`${realTag} ${username}\``,
            ephemeral: true,
          });
        }

        if (action === "remove") {
          await member.setNickname(username).catch(console.error);
          taggedUsers[member.id] = false;
          saveTaggedUsers(taggedUsers);

          return interaction.reply({
            content: `🧪 Nickname kamu dikembalikan menjadi \`${username}\``,
            ephemeral: true,
          });
        }
      }

      // ========== UNKNOWN BUTTON ==========
      await interaction.reply({
        content: "⚠️ Tombol tidak dikenali.",
        ephemeral: true,
      });

    } catch (err) {
      console.error("❌ ERROR GLOBAL DI INTERACTIONCREATE:", err);

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "❌ Terjadi error internal.",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "❌ Terjadi error internal.",
            ephemeral: true,
          });
        }
      } catch (e) {
        console.error('❌ Gagal mengirim error message:', e);
      }
    }
  },
};
