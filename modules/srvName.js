require("dotenv").config();

module.exports = function srvName(client) {
  const GUILD_ID = process.env.GUILD_ID;

  const sequences = [
    {
      steps: ["dsc.gg/BananaSkiee"],
      delay: 5000,
      blink: false,
    },
    {
      steps: ["The", "The Empire", "The Empire of", "The Empire of BS"],
      delay: 600,
      blink: true,
    },
    {
      steps: ["The", "The Legacy", "The Legacy of", "The Legacy of BS"],
      delay: 600,
      blink: true,
    },
    {
      steps: ["The", "The Nexus", "The Nexus of", "The Nexus of BS"],
      delay: 600,
      blink: true,
    },
  ];

  client.once("ready", async () => {
    console.log("🎬 Nama server auto-animasi aktif");

    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) return console.log("❌ Server tidak ditemukan!");

    function sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }

    function randomBlink(text) {
      return text
        .split("")
        .map((c) => {
          if (c === " ") return " ";
          return Math.random() < 0.25 ? "·" : c; // 25% blink
        })
        .join("");
    }

    async function runSequence(seq) {
      // Animasi step-by-step
      for (const step of seq.steps) {
        await guild.setName(step);
        await sleep(seq.delay);
      }

      // Blink acak (kalau diaktifkan)
      if (seq.blink) {
        const finalText = seq.steps[seq.steps.length - 1];
        for (let i = 0; i < 5; i++) {
          await guild.setName(randomBlink(finalText));
          await sleep(450);
        }
        await guild.setName(finalText);
        await sleep(800);
      }
    }

    async function loop() {
      while (true) {
        try {
          for (const seq of sequences) {
            await runSequence(seq);
          }
        } catch (err) {
          console.error("❌ Error animasi nama server:", err);
          await sleep(3000);
        }
      }
    }

    loop();
  });
};
