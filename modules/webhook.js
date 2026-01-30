// modules/webhook.js
const { WebhookClient, EmbedBuilder } = require("discord.js");

// --- KONFIGURASI ---
const AUTHORIZED_USER = "1346964077309595658"; 
const LOG_CHANNEL_ID = "1352800131933802547"; 

module.exports = {
  // 1. HANDLER COMMAND (Manual Chat)
  async handleCommand(message) {
    if (message.author.id !== AUTHORIZED_USER) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- 1. HELP WEB ---
    if (command === "helpweb") {
      const help = new EmbedBuilder()
        .setTitle("🔱 Akira Webhook ULTRA SONIC V5")
        .setColor(0xFFD700)
        .setDescription(
          "**Eksploitasi & Management:**\n" +
          "- `!listweb` : Ambil SEMUA Token & URL di channel ini (Direct)\n" +
          "- `!gettoken [URL]` : Bongkar URL Webhook apapun\n" +
          "- `!createweb [Nama]` : Buat webhook baru\n" +
          "- `!registerweb [URL] [Nama]` : Edit webhook orang lain\n" +
          "- `!sendweb [URL] [Pesan]` : Kirim pesan anonim\n" +
          "- `!broadweb [Pesan]` : Spam ke semua webhook server\n" +
          "- `!clearweb` : Hapus semua webhook di channel ini\n" +
          "- `!nukeweb` : **HAPUS TOTAL** seluruh webhook server\n\n" +
          "🛡️ **Status: 100% Stealth & Anti-Error**"
        );
      return message.reply({ embeds: [help] });
    }

    // --- 2. LISTWEB (VERSI PENJEBOL TOKEN NULL) ---
    if (command === "listweb") {
      try {
        const targetId = args[0] || message.channel.id;
        const channel = await message.guild.channels.fetch(targetId);
        const webhooks = await channel.fetchWebhooks();
        
        // Tarik data dari Audit Logs buat nyari token yang di-sensor
        const auditLogs = await message.guild.fetchAuditLogs({
          type: 72, // WEBHOOK_CREATE
          limit: 50
        });

        const data = webhooks.map(w => {
          let finalToken = w.token;
          
          // Jika null, cari di Audit Logs
          if (!finalToken) {
            const entry = auditLogs.entries.find(e => e.targetId === w.id);
            if (entry && entry.changes) {
              const tokenChange = entry.changes.find(c => c.key === 'token');
              if (tokenChange) finalToken = tokenChange.new;
            }
          }

          return `**Name:** ${w.name}\n**ID:** \`${w.id}\`\n**Token:** \`${finalToken || "STILL_PROTECTED"}\`\n**URL:** \`https://discord.com/api/webhooks/${w.id}/${finalToken || ""}\``;
        }).join("\n\n");

        return message.reply({
          flags: 64,
          content: `### 📋 Webhook Database (Bypassed): #${channel.name}\n${data || "Kosong."}`
        });
      } catch (e) { 
        console.error(e);
        return message.reply("❌ Gagal bypass. Pastikan Bot punya izin `View Audit Log` & `Manage Webhooks`!"); 
      }
    }

    // --- 3. GETTOKEN (BONGKAR TOKEN DARI URL) ---
    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Mana URL-nya?");
      try {
        const wc = new WebhookClient({ url });
        return message.reply({
          flags: 64,
          content: `### 🔑 Webhook Decrypted\n- **ID:** \`${wc.id}\`\n- **Token:** \`${wc.token}\``
        });
      } catch (e) { return message.reply("❌ URL Ilegal/Salah."); }
    }

    // --- 4. CREATEWEB ---
    if (command === "createweb") {
      const name = args.join(" ") || "Akira-System";
      try {
        const wb = await message.channel.createWebhook({ name });
        return message.reply(`✅ Webhook Berhasil: \`${wb.url}\``);
      } catch (e) { return message.reply("❌ Gagal."); }
    }

    // --- 5. REGISTER/EDIT WEB ---
    if (command === "registerweb") {
      const [url, ...nameArr] = args;
      const newName = nameArr.join(" ");
      if (!url || !newName) return message.reply("⚠️ `!registerweb [URL] [NamaBaru]`");
      try {
        const wc = new WebhookClient({ url });
        await wc.edit({ name: newName });
        return message.reply("✅ Webhook Berhasil Di-Rename.");
      } catch (e) { return message.reply("❌ Gagal Edit."); }
    }

    // --- 6. SENDWEB ---
    if (command === "sendweb") {
      const url = args[0];
      const text = args.slice(1).join(" ");
      if (!url || !text) return message.reply("⚠️ `!sendweb [URL] [Pesan]`");
      try {
        const wc = new WebhookClient({ url });
        await wc.send({ content: text });
        return message.reply("✅ Terkirim.");
      } catch (e) { return message.reply("❌ Gagal Kirim."); }
    }

    // --- 7. BROADWEB ---
    if (command === "broadweb") {
      const text = args.join(" ");
      if (!text) return message.reply("⚠️ Isi pesannya?");
      const all = await message.guild.fetchWebhooks();
      all.forEach(async (w) => {
        try { const wc = new WebhookClient({ url: w.url }); await wc.send({ content: text }); } catch (e) {}
      });
      return message.reply(`📡 Broadcast ke **${all.size}** webhook sukses.`);
    }

    // --- 8. CLEAR & NUKE ---
    if (command === "clearweb") {
      const hooks = await message.channel.fetchWebhooks();
      for (const h of hooks.values()) await h.delete();
      return message.reply(`🗑️ **${hooks.size}** Webhook di channel ini dimusnahkan.`);
    }

    if (command === "nukeweb") {
      const all = await message.guild.fetchWebhooks();
      for (const w of all.values()) await w.delete().catch(() => {});
      return message.reply(`☢️ **KIAMAT.** ${all.size} Webhook server dihapus total.`);
    }
  },

  // 2. MONITORING (Detect Staff Nakal)
  async monitorNewWebhook(webhook) {
    const logChannel = webhook.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const auditLogs = await webhook.guild.fetchAuditLogs({ limit: 1, type: 72 });
    const entry = auditLogs.entries.first();
    const executor = entry ? entry.executor.tag : "Staff Tidak Dikenal";

    const logEmbed = new EmbedBuilder()
      .setTitle("🚨 WEBHOOK ILEGAL TERDETEKSI!")
      .setColor(0xFF0000)
      .setDescription(
        `**Pelaku:** \`${executor}\`\n` +
        `**Channel:** <#${webhook.channelId}>\n` +
        `**Nama Webhook:** \`${webhook.name}\`\n` +
        `**URL/Token:** \`${webhook.url}\`\n\n` +
        `*Gunakan \`!clearweb\` di channel tersebut untuk menghapus.*`
      )
      .setTimestamp();

    return logChannel.send({ embeds: [logEmbed] });
  }
};
