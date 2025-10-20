// modules/minecraft.js — FIXED & STABLE VERSION
// Features tetap sama: dual bot S1/S2, relay Discord<->Minecraft, auto reconnect, anti-AFK, logs

const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// ====== CONFIG ======
const ID_GUILD = '1347233781391560837';
const CHANNEL_S1 = '1426537842875826278';
const CHANNEL_S2 = '1429751342301184071';

const SERVERS = [
  { id: 's1', name: 'Server 1', host: 'BananaUcok.aternos.me', port: 14262, initialUsername: 'BotServer1', channelId: CHANNEL_S1, capacity: 100, version: '1.20.1' },
  { id: 's2', name: 'Server 2', host: 'nightz.my.id', port: 25583, initialUsername: 'BotServer2', channelId: CHANNEL_S2, capacity: 100, version: '1.21.10' }
];

const randomNames = [
  'Banana','Botty','NotchX','Kicker','Banned','Player','Crashy','Signal','ByeBot','LostMC',
  'Reboot','Jumpin','Zapper','MinerX','Crafty','Blocky','Pixelz','Mobster','EnderX','Nether',
  'SkyBot','RedMC','BlueMC','GhostX','LavaMC','AquaBot','Frosty','StormX','BlazeX','IronMC',
  'GoldMC','Diamond','Emerald','SwiftX','LuckyX','MegaMC','MicroX','TinyBot','AlphaX','BetaMC',
  'GammaX','DeltaX','OmegaX','Shadow','Phantom','Mystic','Wizard','RogueX','NinjaX','Pirate',
  'Hunter','Archer','Builder','Farmer','MinerY','Slayer','Tanker','Sniper','ScoutX','Guardian',
  'TitanX','HyperX','SonicX','Rocket','AstroX','CometX','NovaMC','Pulsar','Eclipse','Stellar',
  'OrbitX','Galaxy','Meteor','Cosmic','Quantum','Vector','TurboX','Spectr','PrismX','Photon',
  'Fusion','Reactor','Voltage','Electron','Circuit','AtomX','Proton','Neutron','Magnet','Crystal',
  'ShinyX','SparkX','GlowMC','LightX','FlameX','EmberX','Inferno','PyroMC','BlazeMC','ServerDrop'
];

// ===== internal state =====
const state = {};
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', { recursive: true });

function appendLocalLog(serverId, line) {
  const file = path.join('logs', `server-${serverId}.log`);
  const ts = new Date().toISOString();
  try { fs.appendFileSync(file, `[${ts}] ${line}\n`); } catch { }
}
function getRandomName() {
  return randomNames[Math.floor(Math.random() * randomNames.length)];
}
function makePrefix(serverId) {
  return serverId === 's1' ? '[S1]' : '[S2]';
}

// ===== Reconnect Helper (FIXED) =====
function scheduleReconnect(serverId, discordClient, serverConfig, delay = 30000) {
  const st = state[serverId];
  if (!st) return;
  if (st.reconnectTimer) clearTimeout(st.reconnectTimer);
  appendLocalLog(serverId, `[RECONNECT] Will retry in ${delay / 1000}s...`);
  st.reconnectTimer = setTimeout(() => {
    createAndConnectBot(discordClient, serverConfig);
  }, delay);
}

// ===== Exported init =====
module.exports = {
  init: (discordClient) => {
    SERVERS.forEach(s => {
      state[s.id] = {
        config: s,
        bot: null,
        usernameToUse: s.initialUsername,
        queuedMessages: [],
        online: false,
        players: new Set(),
        totalChatToday: 0,
        totalCommandsToday: 0,
        totalEventsToday: 0,
        errorCount: 0,
        startedAt: null,
        lastOfflineAt: null,
        reconnectTimer: null,
        afkInterval1: null,
        afkInterval2: null
      };
    });

    // ===== Discord message handler =====
    discordClient.on('messageCreate', async (msg) => {
      if (msg.author.bot) return;
      const content = msg.content.trim();

      if (/^!log\s+s1$/i.test(content)) return sendServerStatus(discordClient, 's1', msg.channel);
      if (/^!log\s+s2$/i.test(content)) return sendServerStatus(discordClient, 's2', msg.channel);

      const un1 = content.match(/^!UN1\s+(.+)$/i);
      const un2 = content.match(/^!UN2\s+(.+)$/i);
      if (un1) return setUsernameAndReconnect(discordClient, 's1', un1[1].trim(), msg.author.username);
      if (un2) return setUsernameAndReconnect(discordClient, 's2', un2[1].trim(), msg.author.username);

      if (msg.channel.id === state.s1?.config.channelId)
        return handleDiscordToMinecraft(discordClient, 's1', msg.author.username, content);
      if (msg.channel.id === state.s2?.config.channelId)
        return handleDiscordToMinecraft(discordClient, 's2', msg.author.username, content);

      const mS1 = content.match(/^S1\s+([\s\S]+)/i);
      const mS2 = content.match(/^S2\s+([\s\S]+)/i);
      const mAll = content.match(/^ALL\s+([\s\S]+)/i);
      if (mS1) return handleDiscordToMinecraft(discordClient, 's1', msg.author.username, mS1[1]);
      if (mS2) return handleDiscordToMinecraft(discordClient, 's2', msg.author.username, mS2[1]);
      if (mAll) return handleDiscordToMinecraft(discordClient, 'all', msg.author.username, mAll[1]);
    });

    SERVERS.forEach(s => createAndConnectBot(discordClient, s));
  }
};

// ===== Utility Send Functions =====
async function sendPlainToChannel(discordClient, channelId, text) {
  try {
    const ch = await discordClient.channels.fetch(channelId);
    if (ch) await ch.send(text);
  } catch { }
}
async function sendEmbedToChannel(discordClient, channelId, embed) {
  try {
    const ch = await discordClient.channels.fetch(channelId);
    if (ch) await ch.send({ embeds: [embed] });
  } catch { }
}

// ===== Embed: Server Status =====
function msToHuman(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return `${h} jam ${m} menit ${s} detik`;
}
async function sendServerStatus(discordClient, serverId, replyChannel) {
  const st = state[serverId];
  if (!st) return replyChannel.send('Server tidak ditemukan');
  const cfg = st.config;
  const embed = new EmbedBuilder()
    .setTitle(`${cfg.name} — Status`)
    .addFields(
      { name: 'Status', value: st.online ? '🟢 ONLINE' : '🔴 OFFLINE', inline: true },
      { name: 'Host', value: `${cfg.host}:${cfg.port}`, inline: true },
      { name: 'Players', value: `${st.players.size} / ${cfg.capacity}`, inline: true },
      { name: 'Uptime', value: st.startedAt ? msToHuman(Date.now() - st.startedAt) : '-', inline: true },
      { name: 'Chat', value: `${st.totalChatToday}`, inline: true },
      { name: 'Cmd', value: `${st.totalCommandsToday}`, inline: true },
      { name: 'Events', value: `${st.totalEventsToday}`, inline: true }
    )
    .setColor(st.online ? 0x00FF00 : 0xFF0000)
    .setTimestamp();
  replyChannel.send({ embeds: [embed] });
}

// ===== Username Change + Reconnect =====
async function setUsernameAndReconnect(discordClient, serverId, newUsername, requestedBy) {
  const st = state[serverId];
  if (!st) return;
  st.usernameToUse = newUsername;
  appendLocalLog(serverId, `[MANUAL_USERNAME] ${requestedBy} requested ${newUsername}`);
  if (st.bot) try { st.bot.quit(); } catch { }

  const embed = new EmbedBuilder()
    .setTitle(`${st.config.name} — Username Change`)
    .setDescription(`Next username set to \`${newUsername}\` (requested by ${requestedBy}). Reconnecting...`)
    .setColor(0x00AE86)
    .setTimestamp();
  sendEmbedToChannel(discordClient, st.config.channelId, embed);
}

// ===== Discord -> Minecraft Relay =====
async function handleDiscordToMinecraft(discordClient, target, discordUsername, text) {
  if (target === 'all') {
    for (const sid of Object.keys(state))
      await sendToServerMessage(discordClient, sid, text, discordUsername);
    return;
  }
  await sendToServerMessage(discordClient, target, text, discordUsername);
}

// ===== Send to Minecraft (queue if offline) =====
async function sendToServerMessage(discordClient, serverId, text, discordUsername) {
  const st = state[serverId];
  if (!st) return;
  const bot = st.bot;
  if (!st.online || !bot) {
    st.queuedMessages.push({ text, discordUsername });
    await sendPlainToChannel(discordClient, st.config.channelId, `${makePrefix(serverId)} Server offline — message queued.`);
    return;
  }
  try {
    if (text.startsWith('/')) {
      bot.chat(text);
      st.totalCommandsToday++;
    } else {
      bot.chat(`${makePrefix(serverId)} ${text}`);
      st.totalChatToday++;
    }
  } catch (err) {
    st.errorCount++;
    appendLocalLog(serverId, `[ERROR SEND] ${err.message}`);
    sendPlainToChannel(discordClient, st.config.channelId, `${makePrefix(serverId)} ❌ ${err.message}`);
  }
}

// ===== Bot Creator =====
function createAndConnectBot(discordClient, serverConfig) {
  const sid = serverConfig.id;
  const st = state[sid];

  async function connectOnce() {
    const usernameToTry = st.usernameToUse || serverConfig.initialUsername || getRandomName();
    let bot;

    try {
      bot = mineflayer.createBot({
        host: serverConfig.host,
        port: serverConfig.port,
        username: usernameToTry,
        version: serverConfig.version || 'auto',
        auth: 'offline'
      });
    } catch (err) {
      appendLocalLog(sid, `[ERROR] createBot failed: ${err.message}`);
      return scheduleReconnect(sid, discordClient, serverConfig);
    }

    st.bot = bot;

    bot.once('login', async () => {
      st.online = true;
      st.startedAt = Date.now();
      appendLocalLog(sid, `[LOGIN] ${bot.username}`);
      sendPlainToChannel(discordClient, serverConfig.channelId, `${makePrefix(sid)} ✅ Connected as ${bot.username}`);

      const queued = st.queuedMessages.splice(0);
      for (const q of queued) await sendToServerMessage(discordClient, sid, q.text, q.discordUsername);

      st.afkInterval1 = setInterval(() => {
        try { bot.setControlState('forward', true); setTimeout(() => bot.setControlState('forward', false), 600); } catch { }
      }, 60000);
      st.afkInterval2 = setInterval(() => {
        try { bot.setControlState('jump', true); setTimeout(() => bot.setControlState('jump', false), 300); } catch { }
      }, 120000);
    });

    bot.on('message', (json) => {
      try { handleMinecraftMessage(discordClient, sid, json.toString()); } catch { }
    });
    bot.on('messagestr', (m) => {
      try { handleMinecraftMessage(discordClient, sid, m); } catch { }
    });

    const handleDisconnect = (reason) => {
      clearInterval(st.afkInterval1); clearInterval(st.afkInterval2);
      st.online = false;
      st.bot = null;
      const newName = getRandomName();
      st.usernameToUse = newName;
      appendLocalLog(sid, `[DISCONNECT] ${reason}`);
      const emb = new EmbedBuilder()
        .setTitle(`${serverConfig.name} — Disconnected`)
        .setDescription(`Reason: ${String(reason)}\nReconnect using \`${newName}\` in 30s.`)
        .setColor(0xFF8C00)
        .setTimestamp();
      sendEmbedToChannel(discordClient, serverConfig.channelId, emb);
      scheduleReconnect(sid, discordClient, serverConfig);
    };

    bot.on('kicked', handleDisconnect);
    bot.on('end', handleDisconnect);
    bot.on('error', (err) => {
      st.errorCount++;
      appendLocalLog(sid, `[ERROR] ${err.message}`);
      if (!st.online) scheduleReconnect(sid, discordClient, serverConfig);
    });
  }

  connectOnce();
}

// ===== Minecraft -> Discord Relay =====
function handleMinecraftMessage(discordClient, serverId, rawText) {
  const st = state[serverId];
  if (!st) return;
  const t = String(rawText).trim();
  if (!t) return;
  appendLocalLog(serverId, t);

  const playerChatRegex = /^(?:\[(.*?)\]\s*)?([A-Za-z0-9_-]+):\s*(.*)$/;
  const playerChat = t.match(playerChatRegex);
  if (playerChat) {
    const rank = playerChat[1] ? `[${playerChat[1]}] ` : '';
    sendPlainToChannel(discordClient, st.config.channelId, `${makePrefix(serverId)} ${rank}${playerChat[2]}: ${playerChat[3]}`);
    return;
  }

  const issuedCmd = t.match(/^([A-Za-z0-9_-]+) issued server command: (\/\S.*)$/i);
  if (issuedCmd) {
    sendPlainToChannel(discordClient, st.config.channelId, `${makePrefix(serverId)} ${issuedCmd[1]}: ${issuedCmd[2]}`);
    return;
  }

  const eventPatterns = [
    { re: /(has died|was slain|fell from a high place|hit the ground too hard|blew up|was shot by)/i, color: 0xFF0000, title: 'Death' },
    { re: /(earned the achievement|advancement)/i, color: 0x00FFFF, title: 'Achievement' },
    { re: /(joined the game)/i, color: 0x00FF00, title: 'Join' },
    { re: /(left the game|disconnected)/i, color: 0xFFA500, title: 'Leave' }
  ];
  for (const p of eventPatterns) {
    if (p.re.test(t)) {
      const embed = new EmbedBuilder().setTitle(`${st.config.name} — ${p.title}`).setDescription(t).setColor(p.color).setTimestamp();
      sendEmbedToChannel(discordClient, st.config.channelId, embed);
      return;
    }
  }

  const pluginMatch = t.match(/^\[?([A-Za-z0-9 _-]{2,40})\]?\s*(.*)$/);
  if (pluginMatch) {
    const embed = new EmbedBuilder()
      .setTitle(`${st.config.name} — ${pluginMatch[1]}`)
      .setDescription(pluginMatch[2] || t)
      .setColor(0x00FF00)
      .setTimestamp();
    sendEmbedToChannel(discordClient, st.config.channelId, embed);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`${st.config.name} — Server Message`)
    .setDescription(t)
    .setColor(0xFFFF00)
    .setTimestamp();
  sendEmbedToChannel(discordClient, st.config.channelId, embed);
}
