const fs = require("fs");
const path = require("path");
const { ROLES, guildId } = require("../config");
const { EmbedBuilder } = require("discord.js");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

// Import verify system
const VerifySystem = require('../modules/verify');
const verifySystem = new VerifySystem();

// Import Shotgun system
const { gameManager } = require('../commands/shotgunCommand');

// Import introCard handler
const { handleIntroInteractions } = require('../modules/introCard');

function saveTaggedUsers(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      console.log("👉 Interaction diterima:", interaction.type, interaction.customId);

      // ✅ TAMBAHAN: Skip jika ini suggestion/feedback interaction (dihandle di index.js)
      const externalHandlers = ['suggest_', 'feedback_'];
      const isExternal = interaction.isButton() && 
          externalHandlers.some(id => interaction.customId?.startsWith(id));
      
      if (isExternal) {
        console.log('⏭️ Skipping to external handler (suggestion/feedback)');
        return;
      }
      
      if (interaction.isModalSubmit() && interaction.customId === 'feedback_modal_submit') {
        console.log('⏭️ Skipping to external handler (feedback modal)');
        return;
      }

      // ========== SLASH COMMANDS HANDLER ==========
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction);
      }

      // ========== INTRO CARD HANDLER ==========
      if (interaction.isButton() || interaction.isModalSubmit()) {
        const introIds = ['open_intro_modal', 'intro_modal_form', 'info_user_'];
        const isIntroInteraction = introIds.some(id => 
          interaction.customId === id || interaction.customId?.startsWith(id)
        );
        
        if (isIntroInteraction) {
          console.log(`🎴 Intro Card interaction: ${interaction.customId}`);
          return await handleIntroInteractions(interaction);
        }
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

      // MODAL SUBMIT INTERACTIONS
      if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        if (customId === 'input_rating_modal') return await verifySystem.handleRatingSubmit(interaction);
        if (customId === 'give_feedback_modal') return await verifySystem.handleFeedbackSubmit(interaction);
        if (customId === 'custom_message_modal') {
          return interaction.reply({ content: "⚠️ Fitur Custom Message Submit belum aktif.", ephemeral: true });
        }
      }  

      // ========== SHOTGUN DUELS HANDLER ==========
      if (interaction.isButton() && interaction.customId?.startsWith('sg_')) {
          try {
              const parts = interaction.customId.split('_');
              const prefix = parts[0];
              const action = parts[1];
              
              console.log(`🎮 [SHOTGUN] Action: ${action} | CustomID: ${interaction.customId}`);
              console.log(`🎮 [SHOTGUN] Parts: [${parts.join('][')}]`);

              let gameId, param1, param2;

              switch(action) {
                  case 'accept':
                      gameId = parts[2];
                      param1 = parts[3];
                      param2 = parts[4];
                      break;
                  case 'reject':
                      gameId = parts[2];
                      break;
                  case 'ready':
                      gameId = parts[2];
                      param1 = parts[3];
                      break;
                  case 'shoot':
                      param1 = parts[2];
                      gameId = parts[3];
                      break;
                  case 'item':
                      gameId = parts[2];
                      param1 = parseInt(parts[3]);
                      break;
                  case 'surrender':
                      gameId = parts[2];
                      break;
                  default:
                      return await interaction.reply({ 
                          content: '❌ Aksi tidak dikenal!', 
                          ephemeral: true 
                      });
              }

              console.log(`🎮 [SHOTGUN] Parsed: gameId=${gameId}, param1=${param1}, param2=${param2}`);

              if (action === 'accept') {
                  return await gameManager.acceptDuel(gameId, interaction, param1, param2);
              }
              if (action === 'reject') {
                  return await gameManager.rejectDuel(gameId, interaction);
              }

              const game = gameManager.getGame(gameId);
              if (!game) {
                  console.error(`🎮 [SHOTGUN] ERROR: Game ${gameId} not found!`);
                  
                  const baseId = gameId?.split('-')[0];
                  const similarGame = Array.from(gameManager.games?.keys() || []).find(k => k.includes(baseId));
                  if (similarGame) {
                      console.log(`🎮 [SHOTGUN] Found similar game: ${similarGame}`);
                  }
                  
                  return await interaction.reply({ 
                      content: '❌ Sesi game hilang atau sudah berakhir!', 
                      ephemeral: true 
                  });
              }

              if (action === 'ready') {
                  if (param1 && interaction.user.id !== param1) {
                      return await interaction.reply({ 
                          content: '❌ Bukan tombolmu!', 
                          ephemeral: true 
                      });
                  }
                  return await gameManager.handleReady(gameId, interaction);
              }

              const currentPlayer = game.players[game.currentPlayer];
              if (action !== 'surrender' && interaction.user.id !== currentPlayer.id) {
                  return await interaction.reply({ 
                      content: `❌ Bukan giliranmu! Sekarang giliran ${currentPlayer.username}`, 
                      ephemeral: true 
                  });
              }

              switch(action) {
                  case 'shoot':
                      console.log(`🎮 [SHOTGUN] Shoot: ${param1} (target) | Game: ${gameId}`);
                      return await gameManager.handleShoot(gameId, param1, interaction);
                  case 'item':
                      console.log(`🎮 [SHOTGUN] Item: index ${param1} | Game: ${gameId}`);
                      return await gameManager.handleItem(gameId, param1, interaction);
                  case 'surrender':
                      console.log(`🎮 [SHOTGUN] Surrender by ${interaction.user.tag} | Game: ${gameId}`);
                      return await gameManager.handleSurrender(gameId, interaction);
              }

          } catch (err) {
              console.error('🎮 [SHOTGUN] CRITICAL ERROR:', err);
              if (!interaction.replied && !interaction.deferred) {
                  return await interaction.reply({ 
                      content: '❌ Terjadi error internal!', 
                      ephemeral: true 
                  });
              }
          }
      }

      // ========== TAG SYSTEM ==========
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
      const introPrefixes = ['open_intro_modal', 'intro_modal_form', 'info_user_'];
      const externalPrefixes = ['suggest_', 'feedback_'];
      
      const isHandled = introPrefixes.some(p => customId === p || customId.startsWith(p)) ||
                       verifyPrefixes.some(p => customId.startsWith(p)) ||
                       externalPrefixes.some(p => customId.startsWith(p));
      
      if (!isHandled) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "⚠️ Tombol tidak dikenali.", ephemeral: true });
        }
      }

    } catch (err) {
      console.error("❌ ERROR GLOBAL:", err);
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ content: "❌ Terjadi error internal.", ephemeral: true });
        } catch (replyErr) {
          console.error("Gagal kirim error reply:", replyErr.message);
        }
      }
    }
  },
};
