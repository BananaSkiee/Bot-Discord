const fs = require("fs");
const path = require("path");
const { ROLES, guildId } = require("../config");

// Import Shotgun Duels game manager - TAMBAHAN BARU
const { gameManager } = require("../commands/shotgunCommand");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

function saveTaggedUsers(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      console.log("👉 Tombol ditekan:", interaction.customId);

      // ========== SHOTGUN DUELS BUTTON HANDLER - TAMBAHAN BARU ==========
if (interaction.isButton() && (
    interaction.customId.startsWith('use_item_') || 
    interaction.customId.startsWith('shoot_') || 
    interaction.customId.startsWith('view_chamber_')
)) {
    const { gameManager } = require('../commands/shotgunCommand');
    const customId = interaction.customId;
    const parts = customId.split('_');
    const action = parts[0] + '_' + parts[1];
    const gameId = parts[2];
    
    const game = gameManager.getGame(gameId);
    if (!game) {
        await interaction.reply({ 
            content: '❌ Game tidak ditemukan!', 
            ephemeral: true 
        });
        return;
    }

    if (game.players[game.currentPlayer].id !== interaction.user.id) {
        await interaction.reply({ 
            content: '❌ Bukan giliran kamu!', 
            ephemeral: true 
        });
        return;
    }

    await interaction.deferUpdate();

    try {
        switch (action) {
            case 'use_item':
                const itemIndex = parseInt(parts[3]);
                await gameManager.useItem(gameId, interaction.user.id, itemIndex);
                break;
                
            case 'shoot_self':
                await gameManager.shoot(gameId, interaction.user.id, 'self');
                break;
                
            case 'shoot_opponent':
                await gameManager.shoot(gameId, interaction.user.id, 'opponent');
                break;
                
            case 'view_chamber':
                const currentChamber = game.chambers[game.currentChamber];
                await interaction.followUp({ 
                    content: `🔍 Chamber saat ini: ${currentChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`,
                    ephemeral: true 
                });
                break;
        }
    } catch (error) {
        console.error('Error handling shotgun interaction:', error);
        await interaction.followUp({ 
            content: '❌ Terjadi error!', 
            ephemeral: true 
        });
    }
    return;
}

      // ========== EXISTING CODE - JANGAN DIUBAH ==========
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
      if (
        customId.startsWith("test_use_tag_") ||
        customId.startsWith("test_remove_tag_")
      ) {
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

      // ========== UNKNOWN ==========
      return interaction.reply({
        content: "⚠️ Tombol tidak dikenali.",
        ephemeral: true,
      });

    } catch (err) {
      console.error("❌ ERROR GLOBAL DI INTERACTIONCREATE:", err);

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
    }
  },
};
