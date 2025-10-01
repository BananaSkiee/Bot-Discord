require("dotenv").config();

module.exports = function srvName(client) {
  const GUILD_ID = process.env.GUILD_ID;
  const FULL_NAME = "BananaSkiee Community";
  const SPEED = 1000; // jeda antar frame grow/shrink
  const BLINK_TEXT = "·"; // karakter kecil untuk kedip

  client.once("ready", async () => {
    console.log("🎬 Animasi nama server aktif (grow + smart blink + shrink)");

    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) return console.log("❌ Server tidak ditemukan!");

    async function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function animate() {
      try {
        const len = FULL_NAME.length;

        // Stage 1: Grow dari kiri
        for (let size = 2; size <= len; size++) {
          const name = FULL_NAME.slice(0, size);
          await guild.setName(name);
          await sleep(SPEED);
        }

        // Stage 2: Kedip pelan 2x
        for (let i = 0; i < 2; i++) {
          await guild.setName(FULL_NAME);
          await sleep(500); // on
          await guild.setName(BLINK_TEXT.repeat(len));
          await sleep(500); // off
        }

        // Stage 2.2: Kedip cepat 2x
        for (let i = 0; i < 2; i++) {
          await guild.setName(FULL_NAME);
          await sleep(200); // on
          await guild.setName(BLINK_TEXT.repeat(len));
          await sleep(200); // off
        }

        // Stage 3: Shrink dari kanan
        for (let size = len - 1; size >= 2; size--) {
          const name = FULL_NAME.slice(0, size);
          await guild.setName(name);
          await sleep(SPEED);
        }

        await sleep(1500); // jeda sebelum ulang
      } catch (err) {
        console.error("❌ Error animasi:", err);
      } finally {
        animate(); // ulang animasi
      }
    }

    animate();
  });
};
