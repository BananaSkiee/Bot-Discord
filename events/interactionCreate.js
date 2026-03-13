const fs = require("fs");
const path = require("path");
const { ROLES, guildId } = require("../config");
const { EmbedBuilder } = require("discord.js");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

// Import verify system
const VerifySystem = require('../modules/verify');
const verifySystem = new VerifySystem();

// Import Shotgun system - ✅ Pakai Destructuring yang bener sesuai log lu
const { gameManager } = require('../commands/shotgunCommand');

function saveTaggedUsers(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      // Log interaction biar gampang debug di console
      if (interaction.isButton() || interaction.isModalSubmit()) {
          console.log(`👉 Interaction [${interaction.type}]: ${interaction.customId}`);
      }

      // ========== SLASH COMMANDS HANDLER ==========
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction);
      }

      // ========== SHOTGUN DUELS HANDLER (V2) - PRIORITAS UTAMA ==========
      if (interaction.isButton() && interaction.customId?.startsWith('sg_')) {
          const parts = interaction.customId.split('_');
          const action = parts[1]; // accept, reject, ready, shoot, item, surrender
          const gameId = parts[2];

          // 1. Handle Accept/Reject (Gak perlu cek turn)
          if (action === 'accept') return await gameManager.acceptDuel(gameId, interaction, parts[3], parts[4]);
          if (action === 'reject') return await gameManager.rejectDuel(gameId, interaction);

          // 2. Load Game Data
          const game = gameManager.getGame(gameId);
          if (!game) {
              return await interaction.reply({ content: '❌ Sesi game hilang atau bot baru saja restart!', ephemeral: true });
          }

          // 3. Handle Ready
          if (action === 'ready') {
              await interaction.deferUpdate().catch(() => {});
              return await gameManager.handleAction('ready', gameId, interaction.user.id, interaction);
          }

          // 4. Check Turn
          const turnPlayer = game.players[game.currentPlayer];
          if (action !== 'surrender' && interaction.user.id !== turnPlayer.id) {
              return await interaction.reply({ content: '❌ Sabar, ini bukan giliranmu!', ephemeral: true });
          }

          // 5. Execute Action
          // Gunakan try-catch lokal supaya kalau gameManager error, bot gak crash total
          try {
              if (action === 'shoot') {
                  await interaction.deferUpdate().catch(() => {});
                  const target = parts[2]; // self / opp (dari customId sg_shoot_self_gameId)
                  const realId = parts[3]; 
                  return await gameManager.handleAction(`shoot_${target}`, realId, interaction.user.id, interaction);
              }
              
              if (action === 'item') {
                  await interaction.deferUpdate().catch(() => {});
                  return await gameManager.handleAction('use_item', gameId, interaction.user.id, interaction, parts[3]);
              }
              
              if (action === 'surrender') {
                  await interaction.deferUpdate().catch(() => {});
                  return await gameManager.handleAction('surrender', gameId, interaction.user.id, interaction);
              }
          } catch (gameErr) {
              console.error("❌ Shotgun Logic Error:", gameErr);
              if (!interaction.replied) await interaction.followUp({ content: "❌ Terjadi kesalahan saat memproses aksi game.", ephemeral: true });
          }
          return;
      }

      // ========== VERIFY SYSTEM HANDLERS ==========
      if (interaction.isButton()) {
        const { customId } = interaction;

        if (customId === 'verify_account') return await verifySystem.handleVerify(interaction);
        if (customId === 'skip_verify') return await verifySystem.handleSkipVerify(interaction);
        if (customId === 'continue_verify') return await verifySystem.handleContinueVerify(interaction);
        if (customId === 'next_verify') return await verifySystem.handleNextVerify(interaction);
        if (customId === 'see_mission') return await verifySystem.handleSeeMission(interaction);
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
      }  
            
      // ========== TAG SYSTEM MAHAL (TIDAK DIUBAH) ==========
      if (!interaction.isButton()) return;
      
      const username = interaction.user.globalName ?? interaction.user.username;
      const guild = interaction.client.guilds.cache.get(guildId);
      if (!guild) return;

      const member = await guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) return;

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

      // Handler Nickname Testing
      if (customId.startsWith("test_use_tag_") || customId.startsWith("test_remove_tag_")) {
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

      // Handler Unknown Button (Filter biar gak spam)
      const skipPrefixes = ['verify_', 'sg_', 'skip_', 'continue_', 'next_', 'welcome_', 'rate_', 'faqs_', 'give_', 'back_', 'auto_', 'custom_'];
      if (!skipPrefixes.some(p => interaction.customId.startsWith(p)) && 
          !['use_tag', 'remove_tag'].includes(interaction.customId)) {
        await interaction.reply({ content: "⚠️ Tombol tidak dikenali.", ephemeral: true });
      }

    } catch (err) {
      console.error("❌ ERROR GLOBAL INTERACTION:", err);
      // Cegah crash "Unknown Interaction" saat bot mencoba reply interaction yang sudah hang
      try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "❌ Terjadi error internal pada bot.", ephemeral: true });
          }
      } catch (e) {}
    }
  },
};
