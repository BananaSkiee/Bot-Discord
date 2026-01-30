// modules/webhook.js
const { WebhookClient, EmbedBuilder } = require("discord.js");

// --- ⚙️ KONFIGURASI UTAMA ---
const AUTHORIZED_USER = "1346964077309595658"; 
const LOG_CHANNEL_ID = "1352800131933802547"; 

module.exports = {
  /**
   * 🛠️ HANDLER COMMAND UTAMA (8 PREFIX)
   */
  async handleCommand(message) {
    // Validasi User: Cuma lu yang bisa eksekusi
    if (message.author.id !== AUTHORIZED_USER) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. HELPWEB: Navigasi Sistem
    if (command === "helpweb") {
      const helpEmbed = new EmbedBuilder()
        .setTitle("🔱 Akira Webhook ULTRA SONIC V8")
        .setColor(0x00FFFF)
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription(
          "**Eksploitasi & Manajemen:**\n" +
          "• `!listweb [ID]` - Scan token via Audit Log & Force Fetch\n" +
          "• `!gettoken [URL]` - Bongkar data Webhook dari link\n" +
          "• `!createweb [Nama]` - Buat Webhook baru di channel ini\n" +
          "• `!registerweb [URL] [Nama]` - Edit/Rename Webhook target\n" +
          "• `!sendweb [URL] [Pesan]` - Kirim pesan anonim\n" +
          "• `!broadweb [Pesan]` - Spam pesan ke SEMUA webhook server\n" +
          "• `!clearweb` - Hapus semua webhook di channel ini\n" +
          "• `!nukeweb` - Hapus TOTAL seluruh webhook satu server\n\n" +
          "🛡️ **Status:** Audit Log Bypasser v8.0 Active"
        )
        .setFooter({ text: "BananaSkiee Systems Security" });
      return message.reply({ embeds: [helpEmbed] });
    }

    // 2. LISTWEB: Versi Paling Brutal (Bypass null)
    if (command === "listweb") {
      try {
        const targetId = args[0] || message.channel.id;
        const channel = await message.guild.channels.fetch(targetId);
        if (!channel) return message.reply("❌ Channel tidak ditemukan.");

        const webhooks = await channel.fetchWebhooks();
        // Ambil 100 log terbaru untuk mencari jejak pembuatan webhook
        const auditLogs = await message.guild.fetchAuditLogs({ type: 72, limit: 100 });

        let response = `### 📋 Webhook Database V8: #${channel.name}\n`;

        for (const w of webhooks.values()) {
          let token = w.token;

          // LOGIKA SNATCHING 1: Cari di perubahan Audit Log
          if (!token) {
            const entry = auditLogs.entries.find(e => e.targetId === w.id);
            if (entry && entry.changes) {
              const tokenChange = entry.changes.find(c => c.key === 'token');
              if (tokenChange) token = tokenChange.new;
            }
          }

          // LOGIKA SNATCHING 2: Force Fetch Direct (Meminta data ke Discord API)
          if (!token) {
            try {
              const fetched = await message.client.fetchWebhook(w.id);
              if (fetched.token) token = fetched.token;
            } catch (e) { /* Discord API memblokir fetch langsung */ }
          }

          const fullUrl = token ? `https://discord.com/api/webhooks/${w.id}/${token}` : null;
          response += `**Name:** \`${w.name}\`\n**ID:** \`${w.id}\`\n**Token:** \`${token || "STILL_PROTECTED"}\`\n**URL:** ${token ? `\`${fullUrl}\`` : "_Gagal bypass (Proteksi API)_"}\n\n`;
        }

        return message.reply({ flags: 64, content: response || "Tidak ada webhook terdeteksi." });
      } catch (err) {
        console.error(err);
        return message.reply("❌ Error Scanning: Cek izin Manage Webhooks / View Audit Log.");
      }
    }

    // 3. GETTOKEN: Ekstraksi metadata
    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Masukkan URL Webhook!");
      try {
        const wc = new WebhookClient({ url });
        return message.reply({
          flags: 64,
          content: `### 🔑 Decrypted\n**ID:** \`${wc.id}\`\n**Token:** \`${wc.token}\``
        });
      } catch (e) { return message.reply("❌ URL Webhook Ilegal."); }
    }

    // 4. CREATEWEB: Inisialisasi baru
    if (command === "createweb") {
      const name = args.join(" ") || "Akira-System";
      try {
        const wb = await message.channel.createWebhook({ name, avatar: message.client.user.displayAvatarURL() });
        return message.reply(`✅ Webhook Berhasil: \`${wb.url}\``);
      } catch (e) { return message.reply("❌ Gagal membuat webhook."); }
    }

    // 5. REGISTERWEB: Override Webhook Lain
    if (command === "registerweb") {
      const [url, ...nameArr] = args;
      const newName = nameArr.join(" ");
      if (!url || !newName) return message.reply("⚠️ `!registerweb [URL] [NamaBaru]`");
      try {
        const wc = new WebhookClient({ url });
        await wc.edit({ name: newName });
        return message.reply("✅ Webhook berhasil di-edit.");
      } catch (e) { return message.reply("❌ Gagal mengedit."); }
    }

    // 6. SENDWEB: Anonymous Message
    if (command === "sendweb") {
      const url = args[0];
      const text = args.slice(1).join(" ");
      if (!url || !text) return message.reply("⚠️ `!sendweb [URL] [Pesan]`");
      try {
        const wc = new WebhookClient({ url });
        await wc.send({ content: text });
        return message.reply("✅ Pesan terkirim.");
      } catch (e) { return message.reply("❌ Gagal mengirim."); }
    }

    // 7. BROADWEB: Server-Wide Spam
    if (command === "broadweb") {
      const text = args.join(" ");
      if (!text) return message.reply("⚠️ Isi pesan broadcast-nya!");
      const all = await message.guild.fetchWebhooks();
      all.forEach(async (w) => {
        try {
          const wc = new WebhookClient({ url: w.url });
          await wc.send({ content: text });
        } catch (e) {}
      });
      return message.reply(`📡 Broadcast ke **${all.size}** webhook dimulai...`);
    }

    // 8. CLEAR & NUKE: Pembersihan Total
    if (command === "clearweb") {
      const hooks = await message.channel.fetchWebhooks();
      for (const h of hooks.values()) await h.delete();
      return message.reply(`🗑️ **${hooks.size}** Webhook di channel ini dihapus.`);
    }

    if (command === "nukeweb") {
      const all = await message.guild.fetchWebhooks();
      for (const w of all.values()) await w.delete().catch(() => {});
      return message.reply(`☢️ **NUKE SUCCESS.** ${all.size} Webhook server dimusnahkan.`);
    }
  },

  /**
   * 🛡️ SISTEM DETEKSI (AUTO SNATCHER)
   */
  async monitorNewWebhook(webhook) {
    const logChannel = webhook.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    // Tunggu 3 detik agar Discord mencatat token di Audit Log
    setTimeout(async () => {
      try {
        const auditLogs = await webhook.guild.fetchAuditLogs({ limit: 5, type: 72 });
        const entry = auditLogs.entries.find(e => e.targetId === webhook.id);
        const executor = entry ? entry.executor.tag : "Unknown Staff";
        
        let snatchedToken = webhook.token;
        // Jika token null, kita paksa bongkar dari history log
        if (!snatchedToken && entry && entry.changes) {
          const tChange = entry.changes.find(c => c.key === 'token');
          if (tChange) snatchedToken = tChange.new;
        }

        const logEmbed = new EmbedBuilder()
          .setTitle("🚨 WEBHOOK ILEGAL TERDETEKSI!")
          .setColor(0xFF0000)
          .addFields(
            { name: "Eksekutor", value: `\`${executor}\``, inline: true },
            { name: "Channel", value: `<#${webhook.channelId}>`, inline: true },
            { name: "Token Snatch", value: `\`${snatchedToken || "FAILED"}\``, inline: false },
            { name: "URL Lengkap", value: `\`https://discord.com/api/webhooks/${webhook.id}/${snatchedToken || ""}\``, inline: false }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } catch (e) {
        console.error("Gagal Snatch:", e);
      }
    }, 3000);
  }
};
