// modules/minecraft.js — Anti-limit, buffered relay, !join simulator, cmd capture
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

// Nama random untuk join-simulator
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

// ===== send helpers + caching + throttling (anti-rate-limit) =====
const discordChannelsCache = new Map();
const lastChannelSendAt = new Map();
const CHANNEL_MIN_INTERVAL_MS = 1200; // minimal 1.2s antar pesan per channel

async function getCachedChannel(client, id) {
  try {
    if (discordChannelsCache.has(id)) return discordChannelsCache.get(id);
    const ch = await client.channels.fetch(id).catch(() => null);
    if (ch) discordChannelsCache.set(id, ch);
    return ch;
  } catch {
    return null;
  }
}

async function safeSendChannel(client, channelId, payload) {
  try {
    const now = Date.now();
    const last = lastChannelSendAt.get(channelId) || 0;
    if (now - last < CHANNEL_MIN_INTERVAL_MS) {
      // delay sending a bit to respect rate limit
      await new Promise(res => setTimeout(res, CHANNEL_MIN_INTERVAL_MS - (now - last)));
    }
    const ch = await getCachedChannel(client, channelId);
    if (!ch) return;
    if (typeof payload === 'string') await ch.send(payload).catch(() => {});
    else await ch.send(payload).catch(() => {});
    lastChannelSendAt.set(channelId, Date.now());
  } catch (e) {
    // swallow
  }
}

// ===== buffering system: collect messages/events then flush in batch =====
const chatBuffers = {}; // { serverId: { items: [], flushTimer: Timeout, lastActivity: timestamp } }
const BUFFER_IDLE_MS = 2500; // tunggu 2.5s tanpa pesan baru lalu kirim
const BUFFER_FORCE_MS = 5000; // force flush tiap 5s paling lama

function ensureBuffer(serverId) {
  if (!chatBuffers[serverId]) {
    chatBuffers[serverId] = { items: [], flushTimer: null, lastActivity: 0, forceTimer: null };
  }
}

function bufferPush(serverId, text) {
  ensureBuffer(serverId);
  const b = chatBuffers[serverId];
  b.items.push(text);
  b.lastActivity = Date.now();

  // clear/reset idle flush timer
  if (b.flushTimer) clearTimeout(b.flushTimer);
  b.flushTimer = setTimeout(() => flushBuffer(serverId), BUFFER_IDLE_MS);

  // ensure force flush timer exists
  if (!b.forceTimer) {
    b.forceTimer = setTimeout(() => {
      flushBuffer(serverId);
      b.forceTimer = null;
    }, BUFFER_FORCE_MS);
  }
}

async function flushBuffer(serverId) {
  const b = chatBuffers[serverId];
  if (!b || b.items.length === 0) return;
  const st = state[serverId];
  if (!st) return;

  const out = b.items.splice(0).join('\n');
  b.lastActivity = 0;
  if (b.flushTimer) { clearTimeout(b.flushTimer); b.flushTimer = null; }
  // don't flood logs: send to discord via safeSendChannel
  await safeSendChannel(st._discordClient, st.config.channelId, `${makePrefix(serverId)}\n${out}`);
}

// ===== reconnect helper =====
function scheduleReconnect(serverId, discordClient, serverConfig, delay = 30000) {
  const st = state[serverId];
  if (!st) return;
  if (st.reconnectTimer) clearTimeout(st.reconnectTimer);
  appendLocalLog(serverId, `[RECONNECT] Will retry in ${delay / 1000}s...`);
  st.reconnectTimer = setTimeout(() => {
    createAndConnectBot(discordClient, serverConfig);
  }, delay);
}

// ===== exported init =====
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
        afkInterval2: null,
        _discordClient: discordClient,
        _simBots: new Set()
      };
    });

    // Discord message handler (single listener)
    discordClient.on('messageCreate', async (msg) => {
      try {
        if (msg.author?.bot) return;
        const content = (msg.content || '').trim();
        if (!content) return;

        // !log s1 / s2
        if (/^!log\s+s1$/i.test(content)) return sendServerStatus(discordClient, 's1', msg.channel);
        if (/^!log\s+s2$/i.test(content)) return sendServerStatus(discordClient, 's2', msg.channel);

        // !UN1 / !UN2
        const un1 = content.match(/^!UN1\s+(.+)$/i);
        const un2 = content.match(/^!UN2\s+(.+)$/i);
        if (un1) return setUsernameAndReconnect(discordClient, 's1', un1[1].trim(), msg.author.username);
        if (un2) return setUsernameAndReconnect(discordClient, 's2', un2[1].trim(), msg.author.username);

        // !join S1 4  (prefix command)
        const joinMatch = content.match(/^!join\s+(S[12])\s+(\d{1,3})$/i);
        if (joinMatch) {
          const serverAlias = joinMatch[1].toLowerCase(); // S1 or S2
          const count = Math.min(Math.max(parseInt(joinMatch[2], 10), 1), 100);
          const sid = serverAlias === 's1' ? 's1' : 's2';
          return handleJoinSim(discordClient, sid, count, msg.channel, msg.author.username);
        }

        // cmd /...  (discord -> minecraft command execution)
        const cmdMatch = content.match(/^cmd\s+(\/.+)$/i);
        if (cmdMatch) {
          const cmdText = cmdMatch[1].trim();
          // decide which server to send to: if message in S1/S2 channel use that, otherwise require explicit prefix S1/S2 at start
          let targetSid = null;
          if (msg.channel.id === state.s1?.config.channelId) targetSid = 's1';
          else if (msg.channel.id === state.s2?.config.channelId) targetSid = 's2';
          else {
            const explicit = content.match(/^cmd\s+(S[12])\s+(\/.+)$/i);
            if (explicit) targetSid = explicit[1].toLowerCase() === 's1' ? 's1' : 's2';
          }
          if (!targetSid) return msg.reply('❌ Gagal: tentukan channel S1/S2 atau kirim perintah dari channel server yang sesuai.');
          return executeMinecraftCommand(discordClient, targetSid, cmdText, msg.channel, msg.author.username);
        }

        // regular discord->minecraft relay if message is in server channel
        if (msg.channel.id === state.s1?.config.channelId) {
          return handleDiscordToMinecraft(discordClient, 's1', msg.author.username, content);
        }
        if (msg.channel.id === state.s2?.config.channelId) {
          return handleDiscordToMinecraft(discordClient, 's2', msg.author.username, content);
        }

        // allow S1 <text> or S2 <text> prefixes from anywhere
        const mS1 = content.match(/^S1\s+([\s\S]+)/i);
        const mS2 = content.match(/^S2\s+([\s\S]+)/i);
        const mAll = content.match(/^ALL\s+([\s\S]+)/i);
        if (mS1) return handleDiscordToMinecraft(discordClient, 's1', msg.author.username, mS1[1]);
        if (mS2) return handleDiscordToMinecraft(discordClient, 's2', msg.author.username, mS2[1]);
        if (mAll) return handleDiscordToMinecraft(discordClient, 'all', msg.author.username, mAll[1]);
      } catch (err) {
        // swallow top-level errors
        console.error('minecraft:discord-handler error', err);
      }
    });

    // start bots
    SERVERS.forEach(s => createAndConnectBot(discordClient, s));
  }
};

// ===== Utility Send Functions (legacy kept but replaced by safeSendChannel use) =====
async function sendPlainToChannel(discordClient, channelId, text) {
  const ch = await getCachedChannel(discordClient, channelId);
  if (!ch) return;
  await safeSendChannel(discordClient, channelId, text);
}
async function sendEmbedToChannel(discordClient, channelId, embed) {
  const ch = await getCachedChannel(discordClient, channelId);
  if (!ch) return;
  await safeSendChannel(discordClient, channelId, { embeds: [embed] });
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
  await safeSendChannel(replyChannel.client, replyChannel.id, { embeds: [embed] });
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
    for (const sid of Object.keys(state)) await sendToServerMessage(discordClient, sid, text, discordUsername);
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
    appendLocalLog(serverId, `[QUEUE] message queued because offline`);
    // notify but rate-limited via buffer
    bufferPush(serverId, `${makePrefix(serverId)} ⚠️ Server offline — message queued.`);
    return;
  }
  try {
    if (text.startsWith('/')) {
      // send command and capture output briefly
      st.totalCommandsToday++;
      bot.chat(text);
      // don't reply immediately; command output captured by on-message capture and will be flushed by buffer
    } else {
      bot.chat(`${makePrefix(serverId)} ${text}`);
      st.totalChatToday++;
    }
  } catch (err) {
    st.errorCount++;
    appendLocalLog(serverId, `[ERROR SEND] ${err.message}`);
    bufferPush(serverId, `${makePrefix(serverId)} ❌ ${err.message}`);
  }
}

// ===== Bot Creator =====
function createAndConnectBot(discordClient, serverConfig) {
  const sid = serverConfig.id;
  const st = state[sid];
  st._discordClient = discordClient;

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
      bufferPush(sid, `${makePrefix(sid)} ✅ Connected as ${bot.username}`);

      // flush queued messages
      const queued = st.queuedMessages.splice(0);
      for (const q of queued) await sendToServerMessage(discordClient, sid, q.text, q.discordUsername);

      // anti-afk movement
      st.afkInterval1 = setInterval(() => {
        try { bot.setControlState('forward', true); setTimeout(() => bot.setControlState('forward', false), 600); } catch { }
      }, 60000);
      st.afkInterval2 = setInterval(() => {
        try { bot.setControlState('jump', true); setTimeout(() => bot.setControlState('jump', false), 300); } catch { }
      }, 120000);
    });

    // Capture raw messages from server; buffer only important events
    bot.on('message', (json) => {
      try { handleMinecraftMessage(discordClient, sid, json.toString()); } catch (e) { }
    });
    bot.on('messagestr', (m) => {
      try { handleMinecraftMessage(discordClient, sid, m); } catch (e) { }
    });

    const handleDisconnect = (reason) => {
      clearInterval(st.afkInterval1); clearInterval(st.afkInterval2);
      st.online = false;
      st.bot = null;
      st.lastOfflineAt = Date.now();
      const newName = getRandomName();
      st.usernameToUse = newName;
      appendLocalLog(sid, `[DISCONNECT] ${String(reason)}`);
      const emb = new EmbedBuilder()
        .setTitle(`${serverConfig.name} — Disconnected`)
        .setDescription(`Reason: ${String(reason)}\nWill reconnect in 30s as ${newName}`)
        .setColor(0xFF8C00)
        .setTimestamp();
      bufferPush(sid, `⛔ ${serverConfig.name} — Disconnected: ${String(reason)}`);
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

// ===== Minecraft -> Discord Relay (filtered, buffered) =====
function handleMinecraftMessage(discordClient, serverId, rawText) {
  const st = state[serverId];
  if (!st) return;
  const t = String(rawText).trim();
  if (!t) return;
  appendLocalLog(serverId, t);

  // Patterns
  const playerChatRegex = /^(?:\[(.*?)\]\s*)?([A-Za-z0-9_ -]{1,32}):\s*(.*)$/;
  const playerChat = t.match(playerChatRegex);
  if (playerChat) {
    const rank = playerChat[1] ? `[${playerChat[1]}] ` : '';
    const player = playerChat[2];
    const msg = playerChat[3];
    st.totalChatToday++;
    // push to buffer (do NOT send immediately)
    bufferPush(serverId, `💬 ${player}: ${msg}`);
    return;
  }

  // server-printed issued command
  const issuedCmd = t.match(/^([A-Za-z0-9_ -]{1,32}) issued server command: (\/\S.*)$/i);
  if (issuedCmd) {
    bufferPush(serverId, `🛠️ ${issuedCmd[1]}: ${issuedCmd[2]}`);
    return;
  }

  // critical events
  const eventPatterns = [
    { re: /(has died|was slain|fell from a high place|hit the ground too hard|blew up|was shot by)/i, icon: '💀', title: 'Death' },
    { re: /(earned the achievement|advancement)/i, icon: '🏆', title: 'Achievement' },
    { re: /(joined the game|joined)/i, icon: '➡️', title: 'Join' },
    { re: /(left the game|disconnected|left)/i, icon: '⏏️', title: 'Leave' }
  ];
  for (const p of eventPatterns) {
    if (p.re.test(t)) {
      st.totalEventsToday++;
      // Only send important events, buffer them
      bufferPush(serverId, `${p.icon} ${t}`);
      // Keep player set updated for join/leave
      const joinMatch = t.match(/([A-Za-z0-9_ -]{1,32}) joined the game/i);
      const leaveMatch = t.match(/([A-Za-z0-9_ -]{1,32}) left the game|disconnected/i);
      if (joinMatch) try { st.players.add(joinMatch[1]); } catch {}
      if (leaveMatch) try { st.players.delete(leaveMatch[1]); } catch {}
      return;
    }
  }

  // Ignore plugin messages / noise: do not send these to Discord
  const pluginMatch = t.match(/^\[?([A-Za-z0-9 _-]{2,40})\]?\s*(.*)$/);
  if (pluginMatch && pluginMatch[1] && pluginMatch[2]) {
    // Heuristic: plugin messages often have plugin tag + message; ignore to prevent spam
    // But if plugin message contains keywords 'server start' or 'stopping' we may surface it:
    const lower = (pluginMatch[2] || '').toLowerCase();
    if (lower.includes('starting') || lower.includes('stopped') || lower.includes('stop') || lower.includes('online') || lower.includes('offline')) {
      bufferPush(serverId, `ℹ️ ${pluginMatch[1]}: ${pluginMatch[2]}`);
    }
    return;
  }

  // Fallback: treat as server message but rate-limited via buffer
  bufferPush(serverId, `🔔 ${t}`);
}

// ===== Command execution capture: send command and collect output for a short window then flush =====
async function executeMinecraftCommand(discordClient, serverId, cmdText, replyChannel, requestedBy) {
  const st = state[serverId];
  if (!st) return replyChannel.send('❌ Server tidak ditemukan.');
  if (!st.online || !st.bot) return replyChannel.send('❌ Server sedang offline.');

  // We'll capture buffer contents for this server for a short window
  // Mark current buffer length, then wait CAPTURE_MS, then flush new messages as single response
  ensureBuffer(serverId);
  const b = chatBuffers[serverId];
  const beforeLen = b.items.length;
  const CAPTURE_MS = 2500;

  try {
    st.bot.chat(cmdText);
    st.totalCommandsToday++;
    appendLocalLog(serverId, `[CMD EXEC] ${requestedBy}: ${cmdText}`);
  } catch (err) {
    appendLocalLog(serverId, `[CMD ERROR] ${err.message}`);
    return replyChannel.send(`❌ Gagal kirim command: ${err.message}`);
  }

  // wait then take newly added messages
  setTimeout(async () => {
    const after = (chatBuffers[serverId]?.items || []).slice(beforeLen);
    if (!after || after.length === 0) {
      return replyChannel.send('ℹ️ Command dikirim, tapi tidak ada output yang tertangkap.');
    }
    const out = after.join('\n').slice(0, 1900); // limit to 1900 char
    await replyChannel.send(`📥 Output / Command \`${cmdText}\`:\n\`\`\`\n${out}\n\`\`\``).catch(() => {});
    // remove those items from buffer (they were consumed)
    chatBuffers[serverId].items.splice(beforeLen, after.length);
  }, CAPTURE_MS);
}

// ===== Join simulator: spawn temporary bots one by one (with small delay) =====
const SIM_BOT_TTL_MS = 60 * 1000; // keep simulated bot online for 60s (configurable)
const SIM_SPAWN_DELAY_MS = 300; // delay between spawning each sim bot to avoid bursts
const MAX_SIMULATED_PER_SERVER = 100;

async function handleJoinSim(discordClient, serverId, count, replyChannel, requestedBy) {
  const st = state[serverId];
  if (!st) return replyChannel.send('❌ Server not configured.');
  if (count < 1 || count > MAX_SIMULATED_PER_SERVER) return replyChannel.send(`❌ Jumlah harus antara 1 dan ${MAX_SIMULATED_PER_SERVER}.`);
  if (!st.config) return replyChannel.send('❌ Server config tidak ada.');

  appendLocalLog(serverId, `[SIM_JOIN] ${requestedBy} requested ${count} joins on ${serverId}`);

  // spawn count bots sequentially
  const spawned = [];
  for (let i = 0; i < count; i++) {
    // small delay
    // eslint-disable-next-line no-await-in-loop
    await new Promise(res => setTimeout(res, SIM_SPAWN_DELAY_MS));
    const name = `${getRandomName()}${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const simBot = mineflayer.createBot({
        host: st.config.host,
        port: st.config.port,
        username: name,
        version: st.config.version || 'auto',
        auth: 'offline'
      });
      st._simBots.add(simBot);
      spawned.push(name);

      // when simBot logs in push join-event to buffer (we won't send immediate per-bot)
      simBot.once('login', () => {
        appendLocalLog(serverId, `[SIMBOT LOGIN] ${name}`);
        bufferPush(serverId, `➡️ ${name} joined the game (simulated)`);
        try { st.players.add(name); } catch {}
      });

      // clean up after TTL
      setTimeout(() => {
        try {
          simBot.quit();
          st._simBots.delete(simBot);
          appendLocalLog(serverId, `[SIMBOT QUIT] ${name}`);
          bufferPush(serverId, `⏏️ ${name} left the game (simulated)`);
          try { st.players.delete(name); } catch {}
        } catch { }
      }, SIM_BOT_TTL_MS);

      // handle immediate errors quietly
      simBot.on('error', (e) => {
        appendLocalLog(serverId, `[SIMBOT ERROR] ${name} ${String(e)}`);
      });
    } catch (err) {
      appendLocalLog(serverId, `[SIMBOT CREATE ERROR] ${String(err)}`);
    }
  }

  // Report to discord once (don't spam)
  const listText = spawned.map(n => `• ${n}`).join('\n');
  await safeSendChannel(replyChannel.client, replyChannel.id, `👥 ${spawned.length} pemain (simulated) bergabung ke ${st.config.name}:\n${listText}`);
}

// ===== End of module =====
