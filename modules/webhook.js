// modules/webhook.js
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  // Fungsi untuk handle command manual dari messageCreate
  async handleCommand(message) {
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Cek Permission (Hanya Admin yang boleh manage webhook)
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // --- COMMAND: !addweb [url/token] [optional: channel_id] ---
    if (command === "addweb") {
      const webhookInput = args[0]; // Bisa URL penuh atau cuma Token
      const targetChannelId = args[1] || message.channel.id;

      if (!webhookInput) {
        return message.reply("❌ Format salah! Gunakan: `!addweb <URL_atau_TOKEN> [channel_id]`");
      }

      // Logic: Kita simpan infonya (Idealnya pakai Database, tapi ini contoh response sukses)
      // Di sini lu bisa tambahin fungsi buat save ke MongoDB/Quick.db
      
      const embed = new EmbedBuilder()
        .setTitle("✅ Webhook Berhasil Ditambahkan")
        .setColor(0x2ecc71)
        .addFields(
          { name: "Target Channel", value: `<#${targetChannelId}>`, inline: true },
          { name: "Input", value: `\`\`\`${webhookInput.substring(0, 20)}...\`\`\``, inline: true }
        )
        .setFooter({ text: "Simpan URL ini baik-baik, jangan disebar lagi!" });

      return message.reply({ embeds: [embed] });
    }

    // --- COMMAND: !listweb [optional: channel_id] ---
    if (command === "listweb") {
      const targetChannelId = args[0] || message.channel.id;
      
      try {
        const channel = await message.guild.channels.fetch(targetChannelId);
        const webhooks = await channel.fetchWebhooks();

        if (webhooks.size === 0) {
          return message.reply(`❌ Tidak ada webhook yang ditemukan di channel <#${targetChannelId}>`);
        }

        const embed = new EmbedBuilder()
          .setTitle(`📋 Daftar Webhook - #${channel.name}`)
          .setColor(0x3498db)
          .setDescription(
            webhooks.map(w => `**Name:** ${w.name}\n**ID:** \`${w.id}\`\n**Token:** ||${w.token}||\n---`).join("\n")
          );

        return message.reply({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        return message.reply("❌ Gagal mengambil daftar webhook. Pastikan ID channel benar dan bot punya izin.");
      }
    }
  }
};
        
