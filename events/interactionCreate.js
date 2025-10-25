const fs = require("fs");
const path = require("path");
const { ROLES, guildId } = require("../config");
const { EmbedBuilder } = require("discord.js");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

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
        if (interaction.customId === 'custom_message_modal') {
          return await verifySystem.handleCustomMessageSubmit(interaction);
        }
        if (interaction.customId === 'input_rating_modal') {
          return await verifySystem.handleRatingSubmit(interaction);
        }
        if (interaction.customId === 'give_feedback_modal') {
          return await verifySystem.handleFeedbackSubmit(interaction);
        }
      }

      // ========== VERIFY SYSTEM BUTTON HANDLERS ==========
      if (interaction.isButton()) {
        const customId = interaction.customId;
        
        // VERIFY BUTTONS
        if (customId === 'verify_account') {
          return await verifySystem.handleVerify(interaction);
        }
        if (customId === 'skip_verify') {
          return await verifySystem.handleSkipVerify(interaction);
        }
        if (customId === 'continue_verify') {
          return await verifySystem.handleContinueVerify(interaction);
        }
        if (customId === 'back_to_verify') {
          return await verifySystem.handleBackToVerify(interaction);
        }
        
        // NEXT VERIFY
        if (customId === 'next_verify') {
          return await verifySystem.handleNextVerify(interaction);
        }
        
        // SERVER EXPLORATION BUTTONS (Link buttons)
        if (customId === 'server_guild') {
          return await verifySystem.handleChannelVisit(interaction, 'home');
        }
        if (customId === 'open_rules') {
          return await verifySystem.handleChannelVisit(interaction, 'rules');
        }
        if (customId === 'self_role') {
          return await verifySystem.handleChannelVisit(interaction, 'customize');
        }
        
        // MISSION BUTTONS
        if (customId === 'see_mission') {
          return await verifySystem.handleSeeMission(interaction);
        }
        if (customId === 'understand_mission') {
          return await verifySystem.handleUnderstandMission(interaction);
        }
        
        // WELCOME BUTTONS
        if (customId === 'auto_welcome') {
          return await verifySystem.handleAutoWelcome(interaction);
        }
        if (customId === 'custom_message') {
          return await verifySystem.handleCustomMessage(interaction);
        }
        if (customId.startsWith('welcome_')) {
          return await verifySystem.handleWelcomeSelection(interaction);
        }
        
        // RATING BUTTONS
        if (customId === 'input_rating') {
          return await verifySystem.handleInputRating(interaction);
        }
        if (customId === 'give_feedback') {
          return await verifySystem.handleGiveFeedback(interaction);
        }
        if (customId === 'next_final') {
          return await verifySystem.handleNextFinal(interaction);
        }
        if (customId === 'rate_server') {
          return await verifySystem.handleInputRating(interaction);
        }
        
        // FAQ BUTTONS
        if (customId === 'faqs_skip' || customId === 'faqs_rating') {
          return await verifySystem.handleFaqs(interaction);
        }
        
        // FINAL BUTTONS
        if (customId === 'give_role_skip' || customId === 'give_role_final') {
          return await verifySystem.handleGiveRole(interaction);
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
