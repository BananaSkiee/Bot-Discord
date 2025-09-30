// modules/autoDeleteCryptoMessages.js

const CRYPTO_CHANNEL_ID = "1397169936467755151";

module.exports = async function (message) {
  if (message.author.bot) return;
  if (message.channel.id !== CRYPTO_CHANNEL_ID) return;

  setTimeout(async () => {
    try {
      await message.delete();
    } catch (error) {
      console.error("❌ Gagal hapus pesan:", error.message);
    }
  }, 10 * 1000); // 10 detik
};
