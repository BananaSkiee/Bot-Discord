const fs = require("fs");
const path = require("path");
const generateTextGraph = require("./generateTextGraph");

let hargaData = [64000, 64500, 64200, 64800, 65000, 64900, 65500];
const CHANNEL_ID = "1397169936467755151";
const DATA_FILE = path.join(__dirname, "../data/cryptoMessage.json");

function getNextDelay() {
  return Math.floor(Math.random() * 10000) + 5000;
}

function getPriceChange() {
  const chance = Math.random();
  if (chance < 0.4) return Math.floor(Math.random() * 50);
  if (chance < 0.7) return Math.floor(Math.random() * -50);
  if (chance < 0.85) return Math.floor(Math.random() * 150);
  return Math.floor(Math.random() * -150);
}

function saveMessageId(id) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ messageId: id }, null, 2));
}

function loadMessageId() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data).messageId;
  } catch {
    return null;
  }
}

async function updateHarga(client) {
  const last = hargaData[hargaData.length - 1];
  const change = getPriceChange();
  const next = last + change;

  hargaData.push(next);
  if (hargaData.length > 20) hargaData.shift();

  const chart = generateTextGraph(hargaData, "BTC");

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    const messageId = loadMessageId();
    let message;

    if (messageId) {
      try {
        message = await channel.messages.fetch(messageId);
        await message.edit("```" + chart + "```");
      } catch (e) {
        message = await channel.send("```" + chart + "```");
        saveMessageId(message.id);
      }
    } else {
      message = await channel.send("```" + chart + "```");
      saveMessageId(message.id);
    }

  } catch (err) {
    console.error("❌ Gagal kirim/edit grafik:", err);
  }

  setTimeout(() => updateHarga(client), getNextDelay());
}

module.exports = function startCryptoSimulation(client) {
  updateHarga(client);
};
