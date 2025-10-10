const fs = require("fs");
const path = require("path");
const { ROLES, guildId } = require("../config");
const { EmbedBuilder } = require("discord.js");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

function saveTaggedUsers(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      console.log("👉 Interaction diterima:", interaction.type, interaction.customId);

      // 🆕 HANDLER BARU: SELECT MENU "FIND MORE INFO HERE"
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
                embed = rules.modPolicyEmbed;
                break;
            case 'counting':
                embed = rules.countingEmbed;
                break;
            default:
                embed = new EmbedBuilder()
                    .setTitle("❌ Informasi Tidak Ditemukan")
                    .setDescription("Maaf, pilihan yang Anda pilih tidak tersedia.")
                    .setColor(0xFF0000);
        }
        
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
        return;
      }

      // 🆕 HANDLER BARU: TOMBOL GUIDEBOOK, SERVER RULES, YT MEMBERSHIP
      if (interaction.isButton()) {
        const customId = interaction.customId;
        
        if (customId === 'guidebook_btn') {
            const rulesModule = require('../modules/rules');
            const rules = await rulesModule.execute(interaction.client);
            
            await interaction.reply({
                embeds: [rules.guidebookEmbed],
                components: [rules.guideButton],
                ephemeral: true
            });
            return;
        }
        
        if (customId === 'server_rules_btn') {
            const rulesModule = require('../modules/rules');
            const rules = await rulesModule.execute(interaction.client);
            
            await interaction.reply({
                embeds: [rules.guidelinesEmbed],
                ephemeral: true
            });
            return;
        }
        
        if (customId === 'yt_membership_btn') {
            const ytEmbed = new EmbedBuilder()
                .setTitle("🔴 **YouTube Membership Premium**")
                .setDescription("Tingkatkan pengalaman Anda dengan menjadi YouTube Member eksklusif!")
                .setColor(0xFF0000)
                .addFields(
                    {
                        name: '🎁 **Keuntungan Eksklusif**',
                        value: '• Role khusus di server Discord\n• Akses channel member-only\n• Early access konten premium\n• Badge eksklusif di YouTube\n• Konten behind-the-scenes',
                        inline: false
                    },
                    {
                        name: '💎 **Level Membership**',
                        value: '• **Bronze** - Akses dasar\n• **Silver** - Fitur tambahan\n• **Gold** - Prioritas support\n• **Platinum** - Semua fitur premium',
                        inline: false
                    }
                )
                .setFooter({ text: 'Upgrade pengalaman komunitas Anda hari ini!', iconURL: 'https://i.imgur.com/example.png' });

            await interaction.reply({
                embeds: [ytEmbed],
                ephemeral: true
            });
            return;
        }
        
        if (customId === 'start_guide') {
            const guideEmbed = new EmbedBuilder()
                .setTitle("🚀 **Panduan Memulai Premium**")
                .setDescription("Selamat! Anda telah memulai perjalanan menarik di komunitas kami. Ikuti langkah-langkah berikut:")
                .setColor(0x00FF00)
                .addFields(
                    {
                        name: '📖 **Langkah 1 - Baca Pedoman**',
                        value: 'Pahami aturan dan budaya komunitas kami yang profesional',
                        inline: false
                    },
                    {
                        name: '👋 **Langkah 2 - Perkenalan**',
                        value: 'Kenalkan diri Anda di channel #perkenalan',
                        inline: false
                    },
                    {
                        name: '💬 **Langkah 3 - Mulai Berinteraksi**',
                        value: 'Bergabunglah dalam percakapan di berbagai channel',
                        inline: false
                    },
                    {
                        name: '🎮 **Langkah 4 - Ikuti Aktivitas**',
                        value: 'Jelajahi game counting dan event komunitas',
                        inline: false
                    },
                    {
                        name: '🏆 **Langkah 5 - Naik Level**',
                        value: 'Dapatkan role eksklusif dengan aktif berpartisipasi',
                        inline: false
                    }
                )
                .setFooter({ text: 'Selamat menikmati pengalaman premium di komunitas kami!', iconURL: 'https://i.imgur.com/example.png' });

            await interaction.reply({
                embeds: [guideEmbed],
                ephemeral: true
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

      if (!interaction.isButton()) return;
      
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
