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

      // 🆕 HANDLER: SELECT MENU "FIND MORE INFO HERE"
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
            case 'beginner_guide':
                embed = rules.beginnerGuideEmbed;
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

      // 🆕 HANDLER: TOMBOL GUIDEBOOK, SERVER RULES, YT MEMBERSHIP
      if (interaction.isButton()) {
        const customId = interaction.customId;
        
        // Tombol Buku Panduan
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
        
        // Tombol Peraturan Server
        if (customId === 'server_rules_btn') {
            const rulesModule = require('../modules/rules');
            const rules = await rulesModule.execute(interaction.client);
            
            await interaction.reply({
                embeds: [rules.guidelinesEmbed],
                ephemeral: true
            });
            return;
        }
        
        // 🆕 UBAH: Tombol YouTube Membership sekarang hanya kirim link
        if (customId === 'yt_membership_btn') {
            await interaction.reply({
                content: "🔗 **YouTube Membership Premium**\n\n🎁 Tingkatkan pengalaman Anda dengan menjadi member eksklusif:\nhttps://www.youtube.com/channel/your-channel/membership\n\n**Keuntungan Membership:**\n• Role khusus di Discord\n• Akses konten eksklusif\n• Badge spesial di YouTube\n• Early access video\n• Komunitas private",
                ephemeral: true
            });
            return;
        }
        
        // 🆕 Tombol Mulai Panduan Interaktif
        if (customId === 'start_guide') {
            const guideEmbed = new EmbedBuilder()
                .setTitle("🚀 **PANDUAN INTERAKTIF DIMULAI!**")
                .setDescription(`## Selamat! Anda telah memulai panduan interaktif.\n\nIkuti langkah-langkah berikut untuk pengalaman terbaik:\n\n### 📝 **Langkah 1 - Baca & Pahami**\nPelajari semua peraturan dan pedoman komunitas kami\n\n### 👋 **Langkah 2 - Perkenalan**\nKenalkan diri Anda di channel **#perkenalan**\n\n### 💬 **Langkah 3 - Interaksi**\nMulai berinteraksi dengan member lain\n\n### 🎮 **Langkah 4 - Eksplorasi**\nCoba berbagai fitur dan game yang tersedia\n\n### 🏆 **Langkah 5 - Berkembang**\nNaik level dan dapatkan reward eksklusif\n\n---\n\n**🎯 Tips Sukses:**\n• Jangan ragu bertanya\n• Ikuti event komunitas\n• Hormati semua member\n• Nikmati prosesnya!`)
                .setColor(0x00FF00)
                .setThumbnail('https://i.imgur.com/1M8Yh6u.png')
                .setFooter({ 
                    text: 'Panduan interaktif • Selamat bergabung!', 
                    iconURL: 'https://i.imgur.com/1M8Yh6u.png' 
                })
                .setTimestamp();

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
