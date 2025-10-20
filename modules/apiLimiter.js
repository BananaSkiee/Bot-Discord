// modules/apiLimiter.js
const queue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  const { fn, resolve } = queue.shift();
  try {
    await fn();
  } catch (err) {
    console.error("❌ [Limiter] Error:", err.message);
  }

  setTimeout(() => {
    isProcessing = false;
    resolve();
    processQueue();
  }, 2500); // 2.5 detik delay antar permintaan Discord
}

function schedule(fn) {
  return new Promise((resolve) => {
    queue.push({ fn, resolve });
    processQueue();
  });
}

module.exports = { schedule };
