// updateCrypto.js
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/cryptoMessage.json");

module.exports = async function updateCryptoMessage(client, newContent) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const channel = await client.channels.fetch(data.channelId);

  try {
    const oldMsg = await channel.messages.fetch(data.messageId);
    await oldMsg.edit(newContent).catch((err) => {
      console.error("❌ Gagal edit pesan:", err);
    });
  } catch (err) {
    console.error("❌ Gagal update pesan crypto:", err);
  }
};
