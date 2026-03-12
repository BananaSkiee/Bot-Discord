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
      
      // ========== DUEL ACCEPT/REJECT HANDLER ==========
      if (interaction.isButton() && interaction.customId && (
          interaction.customId.startsWith('accept_duel_') || 
          interaction.customId.startsWith('reject_duel_')
      )) {
          const parts = interaction.customId.split('_');
          const action = parts[0];
          const duelId = parts.slice(2).join('_');
          const shotgunCommand = require('../commands/shotgunCommand');
          
          if (action === 'accept') return await shotgunCommand.acceptDuel(duelId, interaction);
          if (action === 'reject') return await shotgunCommand.rejectDuel(duelId, interaction);
      }

      // ========== SHOTGUN DUELS BUTTON HANDLER ==========
      if (interaction.isButton() && interaction.customId) {
        const customId = interaction.customId;
        if (customId.startsWith('item_') || customId.startsWith('shoot_self_') || 
            customId.startsWith('shoot_opponent_') || customId.startsWith('surrender_')) {
            
            let gameId, action, itemIndex;
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
            if (!game) return await interaction.reply({ content: '❌ Game tidak ditemukan!', ephemeral: true });
            if (game.players[game.currentPlayer].id !== interaction.user.id) {
                return await interaction.reply({ content: '❌ Bukan giliran kamu!', ephemeral: true });
            }

            await interaction.deferUpdate();
            try {
                if (action === 'use_item') await gameManager.useItem(gameId, interaction.user.id, itemIndex, interaction);
                else if (action === 'shoot_self') await gameManager.shoot(gameId, interaction.user.id, 'self', interaction);
                else if (action === 'shoot_opponent') await gameManager.shoot(gameId, interaction.user.id, 'opponent', interaction);
                else if (action === 'surrender') await gameManager.surrender(gameId, interaction.user.id);
            } catch (error) { console.error(error); }
            return;
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
