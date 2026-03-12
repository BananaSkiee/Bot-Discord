const fs = require("fs");
const path = require("path");
const { ROLES, guildId } = require("../config");
const { EmbedBuilder } = require("discord.js");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

// Import verify system
const VerifySystem = require('../modules/verify');
const verifySystem = new VerifySystem();

// Import Shotgun system - ✅ WAJIB ADA
const { gameManager } = require('../commands/shotgunCommand');

function saveTaggedUsers(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      console.log("👉 Interaction diterima:", interaction.type, interaction.customId);

      // ========== SLASH COMMANDS HANDLER ==========
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction);
      }

      // ========== VERIFY SYSTEM HANDLERS ==========
      // ✅ BUTTON INTERACTIONS
      if (interaction.isButton()) {
        const { customId } = interaction;
        console.log(`🔘 Button clicked: ${customId}`);

        // Verify Account Button
        if (customId === 'verify_account') {
          return await verifySystem.handleVerify(interaction);
        }
        
        // Skip Verify Button
        if (customId === 'skip_verify') {
          return await verifySystem.handleSkipVerify(interaction);
        }
        
        // Continue Verify Button
        if (customId === 'continue_verify') {
          return await verifySystem.handleContinueVerify(interaction);
        }
        
        // Next Verify Button
        if (customId === 'next_verify') {
          return await verifySystem.handleNextVerify(interaction);
        }
        
        // See Mission Button
        if (customId === 'see_mission') {
          return await verifySystem.handleSeeMission(interaction);
        }
        
        // Auto Welcome Button
        if (customId === 'auto_welcome') {
          console.log("⚠️ handleAutoWelcome tidak diimplementasikan.");
          return interaction.reply({ content: "⚠️ Fitur Auto Welcome belum aktif.", ephemeral: true });
        }

        // Welcome Selection Buttons
        if (customId.startsWith('welcome_')) {
          console.log("⚠️ handleWelcomeSelection tidak diimplementasikan.");
          return interaction.reply({ content: "⚠️ Fitur Welcome Selection belum aktif.", ephemeral: true });
        }
        
        // Custom Message Button
        if (customId === 'custom_message') {
          console.log("⚠️ handleCustomMessage tidak diimplementasikan.");
          return interaction.reply({ content: "⚠️ Fitur Custom Message belum aktif.", ephemeral: true });
        }
        
        // Input Rating Button
        if (customId === 'input_rating') {
          return await verifySystem.handleInputRating(interaction);
        }
        
        // Give Feedback Button
        if (customId === 'give_feedback') {
          return await verifySystem.handleGiveFeedback(interaction);
        }
        
        // Next Final Button
        if (customId === 'next_final') {
          return await verifySystem.handleNextFinal(interaction);
        }
        
        // Rate Server Button
        if (customId === 'rate_server') {
          return await verifySystem.handleInputRating(interaction);
        }
        
        // FAQ Buttons
        if (customId === 'faqs_skip' || customId === 'faqs_rating') {
          return await verifySystem.handleFaqs(interaction);
        }
        
        // Give Role Buttons
        if (customId === 'give_role_skip' || customId === 'give_role_final') {
          return await verifySystem.handleGiveRole(interaction);
        }
        
        // Back to Verify Button
        if (customId === 'back_to_verify') {
          return await verifySystem.handleBackToVerify(interaction);
        }
      }

      // ✅ MODAL SUBMIT INTERACTIONS
      if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        console.log(`📝 Modal submitted: ${customId}`);

        if (customId === 'input_rating_modal') {
          return await verifySystem.handleRatingSubmit(interaction);
        }
        
        if (customId === 'give_feedback_modal') {
          return await verifySystem.handleFeedbackSubmit(interaction);
        }
        
        if (customId === 'custom_message_modal') {
          console.log("⚠️ handleCustomMessageSubmit tidak diimplementasikan.");
          return interaction.reply({ content: "⚠️ Fitur Custom Message Submit belum aktif.", ephemeral: true });
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
              return await shotgunCommand.acceptDuel(duelId, interaction);
          } else if (action === 'reject') {
              return await shotgunCommand.rejectDuel(duelId, interaction);
          }
      }

      // ========== SHOTGUN DUELS BUTTON HANDLER - FIXED & CLEANED ==========
      if (interaction.isButton() && interaction.customId) {
        const customId = interaction.customId;
        
        if (customId.startsWith('item_') || 
            customId.startsWith('shoot_self_') || 
            customId.startsWith('shoot_opponent_') ||
            customId.startsWith('surrender_')) {
            
            console.log(`🎯 Processing shotgun button: ${customId}`);
            
            let gameId, action, itemIndex;
            
            // Parsing Logic Fixed
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
            }

            const game = gameManager.getGame(gameId);
            
            if (!game) {
                return await interaction.reply({ 
                    content: '❌ Game tidak ditemukan atau sudah selesai!', 
                    ephemeral: true 
                });
            }

            // Validasi Giliran Pemain
            if (game.players[game.currentPlayer].id !== interaction.user.id) {
                return await interaction.reply({ 
                    content: '❌ Bukan giliran kamu!', 
                    ephemeral: true 
                });
            }

            // Defer update agar tombol tidak loading terus
            await interaction.deferUpdate();

            try {
                if (action === 'use_item') {
                    await gameManager.useItem(gameId, interaction.user.id, itemIndex, interaction);
                } else if (action === 'shoot_self') {
                    await gameManager.shoot(gameId, interaction.user.id, 'self', interaction);
                } else if (action === 'shoot_opponent') {
                    await gameManager.shoot(gameId, interaction.user.id, 'opponent', interaction);
                } else if (action === 'surrender') {
                    await gameManager.surrender(gameId, interaction.user.id);
                }
            } catch (error) {
                console.error('❌ Shotgun Interaction Error:', error);
            }
            return;
        }
      }

      // Kode Tag System "Mahal" lu ada di bawah sini (tidak gw sentuh/tulis ulang sesuai request)

    } catch (err) {
      console.error("❌ ERROR GLOBAL DI INTERACTIONCREATE:", err);
    }
  },
};

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
      // Hanya handle jika bukan button verify system
      if (!interaction.customId.startsWith('verify_') && 
          !interaction.customId.startsWith('skip_') &&
          !interaction.customId.startsWith('continue_') &&
          !interaction.customId.startsWith('next_') &&
          !interaction.customId.startsWith('welcome_') &&
          !interaction.customId.startsWith('rate_') &&
          !interaction.customId.startsWith('faqs_') &&
          !interaction.customId.startsWith('give_') &&
          !interaction.customId.startsWith('back_') &&
          !interaction.customId.startsWith('auto_') &&
          !interaction.customId.startsWith('custom_')) {
        
        await interaction.reply({
          content: "⚠️ Tombol tidak dikenali.",
          ephemeral: true,
        });
      }

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
