// modules/minecraftBot.js
const mineflayer = require('mineflayer');

// Konfigurasi
const config = {
  host: 'emerald.magmanode.com',
  port: 33096,
  username: 'EmpireSV',
  version: '1.21.1',
  password: 'BananaSkiee'
};

let bot = null;
let reconnectTimer = null;
let afkInterval = null;
let isReconnecting = false;
let hasLoggedIn = false; // Flag untuk cek sudah login

// Log sederhana (minimal)
function log(msg) {
  console.log(`[MC] ${msg}`);
}

function createBot() {
  if (bot) {
    bot.end();
    bot = null;
  }

  hasLoggedIn = false;

  log('Menghubungkan...');
  
  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    viewDistance: 'tiny',
    chatLengthLimit: 256
  });

  bot.once('login', () => {
    log(`${config.username} login`);
    if (afkInterval) clearInterval(afkInterval);
    setTimeout(startAntiAFK, 5000);
  });

  bot.once('spawn', () => {
    log('Spawn');
    
    // Login 1x saja (TANPA PERINTAH /SERVER)
    if (!hasLoggedIn) {
      setTimeout(() => {
        bot.chat(`/register ${config.password} ${config.password}`);
        bot.chat(`/login ${config.password}`);
        log('Login dikirim');
        hasLoggedIn = true;
      }, 2000);
    }
  });

  // Event kicked
  bot.on('kicked', (reason) => {
    log(`Kicked: ${reason.toString().substring(0, 50)}`);
    scheduleReconnect();
  });

  // Event error (hanya log penting)
  bot.on('error', (err) => {
    if (err.code !== 'ECONNRESET') {
      log(`Error: ${err.code}`);
    }
    scheduleReconnect();
  });

  // Event end
  bot.on('end', () => {
    log('Koneksi putus');
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (isReconnecting) return;
  isReconnecting = true;

  if (afkInterval) {
    clearInterval(afkInterval);
    afkInterval = null;
  }

  log('Reconnect 30 detik...');
  
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    isReconnecting = false;
    createBot();
  }, 30000);
}

function startAntiAFK() {
  if (afkInterval) clearInterval(afkInterval);
  
  afkInterval = setInterval(() => {
    if (!bot || !bot.entity) return;
    
    // Gerakan ringan: lompat & maju sebentar
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 150);
    
    bot.setControlState('forward', true);
    setTimeout(() => bot.setControlState('forward', false), 300);
  }, 25000); // setiap 25 detik
}

// Shutdown handler
process.on('SIGINT', () => {
  log('Mematikan bot...');
  if (afkInterval) clearInterval(afkInterval);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (bot) bot.end();
  process.exit();
});

// Start
createBot();
