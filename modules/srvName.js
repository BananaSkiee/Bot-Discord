require("dotenv").config();

module.exports = function srvName(client) {
  const GUILD_ID = process.env.GUILD_ID;

  const names = [
    { steps: ["dsc.gg/BananaSkiee"], delay: 5000, blink: false },
    { steps: ["The", "The Empire", "The Empire of", "The Empire of BS"], delay: 500, blink: true },
    { steps: ["The", "The Legacy", "The Legacy of", "The Legacy of BS"], delay: 500, blink: true },
    { steps: ["The", "The Nexus", "The Nexus of", "The Nexus of BS"], delay: 500, blink: true }
  ];

  client.once("ready", async () => {
    console.log("🎬 Animasi nama server aktif");

    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) return console.log("❌ Server tidak ditemukan!");

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function randomBlink(text) {
      return text.split("").map(c => {
        if (c === " ") return " "; // spasi tetap
        return Math.random() < 0.3 ? "·" : c; // 30% huruf kedip
      }).join("");
    }

    async function animate() {
      try {
        for (let i = 0; ; i = (i + 1) % names.length) {
          const current = names[i];

          // Animasi per step (per kata / frasa)
          for (let step of current.steps) {
            await guild.setName(step);
            await sleep(current.delay);
          }

          // Jika blink = true, lakukan kedip acak
          if (current.blink) {
            for (let blinkCount = 0; blinkCount < 5; blinkCount++) {
              await guild.setName(randomBlink(current.steps[current.steps.length - 1]));
              await sleep(400); // kedip lambat 400ms
            }
            // set full name lagi
            await guild.setName(current.steps[current.steps.length - 1]);
            await sleep(500);
          }
        }
      } catch (err) {
        console.error("❌ Error animasi nama server:", err);
        await sleep(2000);
        animate(); // ulangi jika error
      }
    }

    animate();
  });
};
