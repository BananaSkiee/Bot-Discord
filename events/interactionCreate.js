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
      if (interaction.isButton()) {
        const { customId } = interaction;
        console.log(`🔘 Button clicked: ${customId}`);

        if (customId === 'verify_account') return await verifySystem.handleVerify(interaction);
        if (customId === 'skip_verify') return await verifySystem.handleSkipVerify(interaction);
        if (customId === 'continue_verify') return await verifySystem.handleContinueVerify(interaction);
        if (customId === 'next_verify') return await verifySystem.handleNextVerify(interaction);
        if (customId === 'see_mission') return await verifySystem.handleSeeMission(interaction);
        
        if (customId === 'auto_welcome') {
          console.log("⚠️ handleAutoWelcome tidak diimplementasikan.");
          return interaction.reply({ content: "⚠️ Fitur Auto Welcome belum aktif.", ephemeral: true });
        }

        if (customId.startsWith('welcome_')) {
          console.log("⚠️ handleWelcomeSelection tidak diimplementasikan.");
          return interaction.reply({ content: "⚠️ Fitur Welcome Selection belum aktif.", ephemeral: true });
        }
        
        if (customId === 'custom_message') {
          console.log("⚠️ handleCustomMessage tidak diimplementasikan.");
          return interaction.reply({ content: "⚠️ Fitur Custom Message belum aktif.", ephemeral: true });
        }
        
        if (customId === 'input_rating') return await verifySystem.handleInputRating(interaction);
        if (customId === 'give_feedback') return await verifySystem.handleGiveFeedback(interaction);
        if (customId === 'next_final') return await verifySystem.handleNextFinal(interaction);
        if (customId === 'rate_server') return await verifySystem.handleInputRating(interaction);
        if (customId === 'faqs_skip' || customId === 'faqs_rating') return await verifySystem.handleFaqs(interaction);
        if (customId === 'give_role_skip' || customId === 'give_role_final') return await verifySystem.handleGiveRole(interaction);
        if (customId === 'back_to_verify') return await verifySystem.handleBackToVerify(interaction);
      }

      // ✅ MODAL SUBMIT INTERACTIONS
      if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        if (customId === 'input_rating_modal') return await verifySystem.handleRatingSubmit(interaction);
        if (customId === 'give_feedback_modal') return await verifySystem.handleFeedbackSubmit(interaction);
        if (customId === 'custom_message_modal') {
          return interaction.reply({ content: "⚠️ Fitur Custom Message Submit belum aktif.", ephemeral: true });
        }
      }  

      // ========== SHOTGUN DUELS HANDLER (V2) - FIXED PARSING ==========
      if (interaction.isButton() && interaction.customId?.startsWith('sg_')) {
          const parts = interaction.customId.split('_');
          const action = parts[1];
          
          console.log(`🎮 Shotgun: action=${action}, full customId=${interaction.customId}`);
          console.log(`🎮 Parts: ${parts.join(' | ')}`);

          // Handle Accept/Reject (format: sg_accept_gameId_challengerId_opponentId)
          if (action === 'accept') {
              const gameId = parts[2];
              return await gameManager.acceptDuel(gameId, interaction, parts[3], parts[4]);
          }
          if (action === 'reject') {
              const gameId = parts[2];
              return await gameManager.rejectDuel(gameId, interaction);
          }

          // Handle Ready (format: sg_ready_gameId_playerId)
          if (action === 'ready') {
              const gameId = parts[2];
              const playerId = parts[3];
              console.log(`🎮 Ready: gameId=${gameId}, playerId=${playerId}`);
              
              const game = gameManager.getGame(gameId);
              if (!game) return await interaction.reply({ content: '❌ Sesi game hilang/bot restart!', ephemeral: true });
              
              if (playerId && interaction.user.id !== playerId) {
                  return await interaction.reply({ content: '❌ Bukan tombolmu!', ephemeral: true });
              }
              return await gameManager.handleReady(gameId, interaction);
          }

          // Handle Shoot (format: sg_shoot_target_gameId)
          // Handle Item (format: sg_item_gameId_index)
          // Handle Surrender (format: sg_surrender_gameId)
          
          let gameId;
          let extraParam;
          
          if (action === 'shoot') {
              // sg_shoot_opp_gameId → parts[3] = gameId
              // sg_shoot_self_gameId → parts[3] = gameId
              extraParam = parts[2]; // target: opp/self
              gameId = parts[3];
              console.log(`🎮 Shoot: target=${extraParam}, gameId=${gameId}`);
          } else if (action === 'item') {
              // sg_item_gameId_index
              gameId = parts[2];
              extraParam = parseInt(parts[3]); // item index
              console.log(`🎮 Item: gameId=${gameId}, index=${extraParam}`);
          } else if (action === 'surrender') {
              // sg_surrender_gameId
              gameId = parts[2];
              console.log(`🎮 Surrender: gameId=${gameId}`);
          } else {
              return await interaction.reply({ content: '❌ Aksi tidak dikenal!', ephemeral: true });
          }

          const game = gameManager.getGame(gameId);
          console.log(`🎮 Game lookup: ${gameId} => ${game ? 'FOUND' : 'NOT FOUND'}`);
          
          if (!game) {
              console.log(`🎮 Available games: ${gameManager.games?.size || 0} games`);
              return await interaction.reply({ content: '❌ Sesi game hilang/bot restart!', ephemeral: true });
          }

          // Check turn untuk shoot dan item (tidak untuk surrender)
          const turnPlayer = game.players[game.currentPlayer];
          if (action !== 'surrender' && interaction.user.id !== turnPlayer.id) {
              return await interaction.reply({ content: '❌ Bukan giliranmu!', ephemeral: true });
          }

          if (action === 'shoot') {
              return await gameManager.handleShoot(gameId, extraParam, interaction);
          }
          if (action === 'item') {
              return await gameManager.handleItem(gameId, extraParam, interaction);
          }
          if (action === 'surrender') {
              return await gameManager.handleSurrender(gameId, interaction);
          }
      }

      // ========== EXISTING CODE - TAG SYSTEM MAHAL (TIDAK DIUBAH) ==========
      if (!interaction.isButton()) return;
      
      const username = interaction.user.globalName ?? interaction.user.username;
      const guild = interaction.client.guilds.cache.get(guildId);
      if (!guild) return;

      const member = await guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: "❌ Gagal ambil datamu dari server.", ephemeral: true });
      }

      const customId = interaction.customId;
      const taggedUsers = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : {};

      if (customId === "use_tag") {
        const role = ROLES.find(r => member.roles.cache.has(r.id));
        if (!role) return interaction.reply({ content: "❌ Kamu tidak punya role yang cocok.", ephemeral: true });
        await member.setNickname(`${role.tag} ${username}`).catch(console.error);
        taggedUsers[member.id] = true;
        saveTaggedUsers(taggedUsers);
        return interaction.reply({ content: `✅ Nama: \`${role.tag} ${username}\``, ephemeral: true });
      }

      if (customId === "remove_tag") {
        await member.setNickname(username).catch(console.error);
        taggedUsers[member.id] = false;
        saveTaggedUsers(taggedUsers);
        return interaction.reply({ content: "✅ Tag dihapus.", ephemeral: true });
      }

      if (customId && (customId.startsWith("test_use_tag_") || customId.startsWith("test_remove_tag_"))) {
        const parts = customId.split("_");
        const action = parts[1];
        const roleId = parts[3];
        const safeTagId = parts.slice(4).join("_");
        const matched = ROLES.find(r => r.id === roleId && r.tag.replace(/[^\w-]/g, "").toLowerCase() === safeTagId);

        if (!matched) return interaction.reply({ content: "❌ Tag tidak valid.", ephemeral: true });
        if (action === "use") {
          await member.setNickname(`${matched.tag} ${username}`).catch(console.error);
          if (!member.roles.cache.has(matched.id)) await member.roles.add(matched.id).catch(console.error);
          taggedUsers[member.id] = true;
          saveTaggedUsers(taggedUsers);
          return interaction.reply({ content: `🧪 Nickname: \`${matched.tag} ${username}\``, ephemeral: true });
        }
        if (action === "remove") {
          await member.setNickname(username).catch(console.error);
          taggedUsers[member.id] = false;
          saveTaggedUsers(taggedUsers);
          return interaction.reply({ content: "🧪 Tag dihapus.", ephemeral: true });
        }
      }

      // Handler Unknown Button
      const verifyPrefixes = ['verify_', 'skip_', 'continue_', 'next_', 'welcome_', 'rate_', 'faqs_', 'give_', 'back_', 'auto_', 'custom_'];
      if (!verifyPrefixes.some(p => interaction.customId.startsWith(p))) {
        await interaction.reply({ content: "⚠️ Tombol tidak dikenali.", ephemeral: true });
      }

    } catch (err) {
      console.error("❌ ERROR GLOBAL:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Terjadi error internal.", ephemeral: true });
      }
    }
  },
};
