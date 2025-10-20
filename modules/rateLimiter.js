// modules/rateLimiter.js
module.exports = (client) => {
  // Hook ke event internal rate limit Discord.js
  client.rest.on('rateLimited', (info) => {
    const path = info.route || info.url || 'unknown';
    console.warn(`⚠️ [RateLimit] Discord API membatasi permintaan ke ${path}`);
    console.warn(`⏳ Tunggu ${info.timeout}ms sebelum lanjut...`);
  });

  console.log("🛡️ Rate limit watcher aktif (global).");
};
