module.exports = (client) => {
  const stickyMessages = new Map();

  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    // ✅ Command sticky (hanya admin/mod)
    if (message.member.permissions.has("ManageMessages")) {
      if (message.content.startsWith("!setsticky")) {
        const args = message.content.slice("!setsticky".length).trim();
        if (!args)
          return message.reply("❌ Masukkan pesan sticky-nya setelah !setsticky");

        stickyMessages.set(message.channel.id, {
          content: args,
          lastMessageId: null,
        });

        return message.reply("✅ Sticky message berhasil disetel.");
      }

      if (message.content.startsWith("!removesticky")) {
        stickyMessages.delete(message.channel.id);
        return message.reply("🗑️ Sticky message berhasil dihapus.");
      }
    }

    // ✅ Jalankan sticky (kalau ada)
    const stickyData = stickyMessages.get(message.channel.id);
    if (!stickyData) return;

    // Hapus pesan sticky sebelumnya
    if (stickyData.lastMessageId) {
      try {
        const oldMsg = await message.channel.messages.fetch(
          stickyData.lastMessageId
        );
        await oldMsg.delete();
      } catch (err) {
        // mungkin udah kehapus, abaikan
      }
    }

    // Kirim sticky baru
    const sent = await message.channel.send(stickyData.content);
    stickyData.lastMessageId = sent.id;
  });
};
