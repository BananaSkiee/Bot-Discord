const fs = require("fs");
const path = require("path");
const { ROLES, guildId } = require("../config");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

function saveTaggedUsers(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      console.log("👉 Interaction diterima:", interaction.type, interaction.customId);

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
        
        if (customId.includes('use_item_') || 
            customId.includes('shoot_') || 
            customId.includes('view_chamber_')) {
            
            console.log(`🎯 Processing shotgun button: ${customId}`);
            
            const parts = customId.split('_');
            if (parts.length < 3) {
                await interaction.reply({ 
                    content: '❌ Invalid button!', 
                    ephemeral: true 
                });
                return;
            }
            
            const action = parts[0] + '_' + parts[1];
            const gameId = parts.slice(2).join('_');
            
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
                        const itemIndex = parseInt(parts[2]);
                        if (isNaN(itemIndex)) {
                            await interaction.followUp({ 
                                content: '❌ Item tidak valid!', 
                                ephemeral: true 
                            });
                            return;
                        }
                        // FIX: Tambah parameter interaction
                        await gameManager.useItem(gameId, interaction.user.id, itemIndex, interaction);
                        break;
                        
                    case 'shoot_self':
                        // FIX: Tambah parameter interaction
                        await gameManager.shoot(gameId, interaction.user.id, 'self', interaction);
                        break;
                        
                    case 'shoot_opponent':
                        // FIX: Tambah parameter interaction
                        await gameManager.shoot(gameId, interaction.user.id, 'opponent', interaction);
                        break;
                        
                    case 'view_chamber':
                        if (game.currentChamber < game.chambers.length) {
                            const currentChamber = game.chambers[game.currentChamber];
                            await interaction.followUp({ 
                                content: `🔍 Chamber saat ini: ${currentChamber === '💥' ? '💥 **LOADED**' : '⚪ **EMPTY**'}`,
                                ephemeral: true 
                            });
                        }
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
