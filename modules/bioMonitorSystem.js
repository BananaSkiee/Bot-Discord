/**
 * Setup pesan verifikasi - dipanggil setelah channel dibersihkan
 */
async setupMessage(channel) {
  // Double-check: hapus pesan bot lama jika ada (safety)
  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessages = messages.filter(m => m.author.id === this.client.user.id);
    
    for (const [, msg] of botMessages) {
      await msg.delete().catch(() => {});
      await new Promise(r => setTimeout(r, 100));
    }
  } catch (e) {
    // Ignore
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🔐 Verifikasi Bio (Tahap 2)')
    .setDescription(
      '**Syarat**: Pasang link server di bio Discord kamu.\n\n' +
      `**Link yang harus dipasang:**\n\`\`\`\n${this.INVITE_CODE}\n\`\`\`\n\n` +
      '**Cara Verifikasi:**\n' +
      '1️⃣ Settings Discord → **Profile** → **About Me**\n' +
      '2️⃣ Tambahkan link di atas ke bio\n' +
      '3️⃣ Klik tombol **Verifikasi Bio** di bawah\n' +
      '4️⃣ Login Discord → **Authorize**\n' +
      '5️⃣ Selesai! Role otomatis diberikan\n\n' +
      '⚠️ **Catatan**: Bot hanya membaca bio, **tidak bisa** edit profile kamu.'
    )
    .setFooter({ text: 'Akira Bot • Auto-refresh saat restart' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('check_bio')
      .setLabel('🔍 Verifikasi Bio')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅')
  );

  await channel.send({ embeds: [embed], components: [row] });
  console.log('✅ Embed verifikasi bio dikirim (channel sudah bersih)');
}
