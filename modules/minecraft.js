// modules/minecraft.js
// Full integrated Minecraft <-> Discord bridge with persistent simulated bots,
// !join / !kick commands (prefix), buffered chat batching, anti-rate-limit.

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
  { id: 's2', name: 'Server 2', host: 'nightz.my.id', port: 25583, initialUsername: 'Chizen404', channelId: CHANNEL_S2, capacity: 100, version: '1.21.10' }
];

const MAX_SIM_PER_SERVER = 20;
const SIM_SPAWN_DELAY_MS = 400; // delay between spawns
const SIM_KICK_DELAY_MS = 300;  // delay between kicks
const CHANNEL_MIN_INTERVAL_MS = 1200; // throttle per channel
const BUFFER_IDLE_MS = 2500; // 2.5s idle flush
const BUFFER_FORCE_MS = 5000; // 5s force flush
const CMD_CAPTURE_MS = 2500; // capture command output window

// random names
const randomNames = [
  'delta','Botty','NotchX','Kicker','Banned','Player','Crashy','Signal','ByeBot','LostMC',
  'Reboot','Jumpin','Zapper','MinerX','Crafty','Blocky','Pixelz','Mobster','EnderX','Nether',
  'SkyBot','RedMC','BlueMC','GhostX','LavaMC','AquaBot','Frosty','StormX','BlazeX','IronMC',
  'GoldMC','Diamond','Emerald','SwiftX','LuckyX','MegaMC','MicroX','TinyBot','AlphaX','BetaMC'
];

// ===== internal state =====
const state = {};
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', { recursive: true });
function appendLocalLog(serverId, line) {
  const file = path.join('logs', `server-${serverId}.log`);
  const ts = new Date().toISOString();
  try { fs.appendFileSync(file, `[${ts}] ${line}\n`); } catch { /* ignore */ }
}
function getRandomName() {
  return randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 9000 + 1000);
}
function makePrefix(serverId) { return serverId === 's1' ? '[S1]' : '[S2]'; }

// ===== send helpers + caching + throttling =====
const discordChannelsCache = new Map();
const lastChannelSendAt = new Map();

async function getCachedChannel(client, id) {
  if (discordChannelsCache.has(id)) return discordChannelsCache.get(id);
  try {
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
      await new Promise(res => setTimeout(res, CHANNEL_MIN_INTERVAL_MS - (now - last)));
    }
    const ch = await getCachedChannel(client, channelId);
    if (!ch) return;
    if (typeof payload === 'string') await ch.send(payload).catch(() => {});
    else await ch.send(payload).catch(() => {});
    lastChannelSendAt.set(channelId, Date.now());
  } catch { /* swallow */ }
}

// ===== buffering system =====
const chatBuffers = {}; // serverId -> { items: [], flushTimer, forceTimer }

function ensureBuffer(sid) {
  if (!chatBuffers[sid]) chatBuffers[sid] = { items: [], flushTimer: null, forceTimer: null };
}
function bufferPush(sid, text) {
  ensureBuffer(sid);
  const b = chatBuffers[sid];
  b.items.push(text);
  if (b.flushTimer) clearTimeout(b.flushTimer);
  b.flushTimer = setTimeout(() => flushBuffer(sid), BUFFER_IDLE_MS);
  if (!b.forceTimer) {
    b.forceTimer = setTimeout(() => { flushBuffer(sid); b.forceTimer = null; }, BUFFER_FORCE_MS);
  }
}
async function flushBuffer(sid) {
  const b = chatBuffers[sid];
  if (!b || b.items.length === 0) return;
  const st = state[sid];
  if (!st) { b.items = []; return; }
  const out = b.items.splice(0).join('\n');
  if (b.flushTimer) { clearTimeout(b.flushTimer); b.flushTimer = null; }
  await safeSendChannel(st._discordClient, st.config.channelId, `${makePrefix(sid)}\n${out}`);
}

// ===== utility counts =====
function totalBotsOnServer(st) {
  // count main relay bot + simulated bots that are connected
  let relay = st.bot ? 1 : 0;
  let sims = 0;
  for (const [name, b] of st.simBots) { if (b && b.player && b.entity) sims++; } // crude check
  // If we can't rely on player presence, treat Map size as sims
  if (st.simBots.size > sims) sims = st.simBots.size;
  return relay + sims;
}

// ===== reconnect helper =====
function scheduleReconnect(serverId, discordClient, serverConfig, delay = 30000) {
  const st = state[serverId];
  if (!st) return;
  if (st.reconnectTimer) clearTimeout(st.reconnectTimer);
  appendLocalLog(serverId, `[RECONNECT] Will retry in ${delay/1000}s`);
  st.reconnectTimer = setTimeout(() => createAndConnectBot(discordClient, serverConfig), delay);
}

// ===== exported init =====
module.exports = {
  init: (discordClient) => {
    SERVERS.forEach(s => {
      state[s.id] = {
        config: s,
        bot: null,               // relay bot instance
        simBots: new Map(),     // name -> bot (simulated persistent bots)
        queuedMessages: [],
        online: false,
        players: new Set(),
        totalChatToday: 0,
        totalCommandsToday: 0,
        totalEventsToday: 0,
        errorCount: 0,
        startedAt: null,
        reconnectTimer: null,
        afkInterval1: null,
        afkInterval2: null,
        _discordClient: discordClient
      };
    });

    // single messageCreate listener
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

        // !join S1 5
        const joinMatch = content.match(/^!join\s+(S[12])\s+(\d{1,3})$/i);
        if (joinMatch) {
          const sid = joinMatch[1].toLowerCase() === 's1' ? 's1' : 's2';
          const count = Math.min(Math.max(parseInt(joinMatch[2],10),1), MAX_SIM_PER_SERVER);
          return handleJoinCommand(discordClient, sid, count, msg.channel, msg.author.username);
        }

        // !kick S1 5
        const kickMatch = content.match(/^!kick\s+(S[12])\s+(\d{1,3})$/i);
        if (kickMatch) {
          const sid = kickMatch[1].toLowerCase() === 's1' ? 's1' : 's2';
          const count = Math.min(Math.max(parseInt(kickMatch[2],10),1), MAX_SIM_PER_SERVER);
          return handleKickCommand(discordClient, sid, count, msg.channel, msg.author.username);
        }

        // cmd /... or cmd S1 /...
        const cmdExplicit = content.match(/^cmd\s+(S[12])\s+(\/.+)$/i);
        const cmdInChannel = content.match(/^cmd\s+(\/.+)$/i);
        if (cmdExplicit) {
          const sid = cmdExplicit[1].toLowerCase() === 's1' ? 's1' : 's2';
          return executeMinecraftCommand(discordClient, sid, cmdExplicit[2].trim(), msg.channel, msg.author.username);
        } else if (cmdInChannel) {
          // if message posted in server channel, route there
          if (msg.channel.id === state.s1.config.channelId) return executeMinecraftCommand(discordClient, 's1', cmdInChannel[1].trim(), msg.channel, msg.author.username);
          if (msg.channel.id === state.s2.config.channelId) return executeMinecraftCommand(discordClient, 's2', cmdInChannel[1].trim(), msg.channel, msg.author.username);
          return msg.reply('❌ Untuk `cmd /...` kirim dari channel server S1/S2 atau gunakan `cmd S1 /...`.');
        }

        // Relay discord->minecraft if in server channels or prefix S1/S2
        if (msg.channel.id === state.s1.config.channelId) return handleDiscordToMinecraft(discordClient, 's1', msg.author.username, content);
        if (msg.channel.id === state.s2.config.channelId) return handleDiscordToMinecraft(discordClient, 's2', msg.author.username, content);

        const mS1 = content.match(/^S1\s+([\s\S]+)/i);
        const mS2 = content.match(/^S2\s+([\s\S]+)/i);
        const mAll = content.match(/^ALL\s+([\s\S]+)/i);
        if (mS1) return handleDiscordToMinecraft(discordClient, 's1', msg.author.username, mS1[1]);
        if (mS2) return handleDiscordToMinecraft(discordClient, 's2', msg.author.username, mS2[1]);
        if (mAll) return handleDiscordToMinecraft(discordClient, 'all', msg.author.username, mAll[1]);
      } catch (e) {
        console.error('minecraft:discordListener', e);
      }
    });

    // Start relay bots for configured servers
    SERVERS.forEach(s => createAndConnectBot(discordClient, s));
  }
};

// ===== send helpers (legacy wrappers) =====
async function sendPlainToChannel(discordClient, channelId, text) { await safeSendChannel(discordClient, channelId, text); }
async function sendEmbedToChannel(discordClient, channelId, embed) { await safeSendChannel(discordClient, channelId, { embeds: [embed] }); }

// ===== Server status embed =====
function msToHuman(ms){
  const s = Math.floor(ms/1000)%60;
  const m = Math.floor(ms/60000)%60;
  const h = Math.floor(ms/3600000);
  return `${h} jam ${m} menit ${s} detik`;
}
async function sendServerStatus(discordClient, serverId, replyChannel) {
  const st = state[serverId];
  if (!st) return replyChannel.send('Server tidak ditemukan.');
  const cfg = st.config;
  const embed = new EmbedBuilder()
    .setTitle(`${cfg.name} — Status`)
    .addFields(
      { name: 'Status', value: st.online ? '🟢 ONLINE' : '🔴 OFFLINE', inline: true },
      { name: 'Host', value: `${cfg.host}:${cfg.port}`, inline: true },
      { name: 'Players', value: `${(st.players && st.players.size) || 0} / ${cfg.capacity}`, inline: true },
      { name: 'Uptime', value: st.startedAt ? msToHuman(Date.now()-st.startedAt) : '-', inline: true },
      { name: 'Chat', value: `${st.totalChatToday}`, inline: true },
      { name: 'Cmd', value: `${st.totalCommandsToday}`, inline: true },
      { name: 'Events', value: `${st.totalEventsToday}`, inline: true }
    )
    .setColor(st.online ? 0x00FF00 : 0xFF0000)
    .setTimestamp();
  await safeSendChannel(replyChannel.client, replyChannel.id, { embeds: [embed] });
}

// ===== Username change & reconnect =====
async function setUsernameAndReconnect(discordClient, serverId, newUsername, requestedBy) {
  const st = state[serverId]; if (!st) return;
  st.usernameToUse = newUsername;
  appendLocalLog(serverId, `[MANUAL_USERNAME] ${requestedBy} -> ${newUsername}`);
  if (st.bot) try { st.bot.quit(); } catch {}
  const emb = new EmbedBuilder().setTitle(`${st.config.name} — Username Change`).setDescription(`Next username: \`${newUsername}\``).setColor(0x00AE86).setTimestamp();
  bufferPush(serverId, `ℹ️ Username change requested: ${newUsername} (by ${requestedBy})`);
  await sendEmbedToChannel(discordClient, st.config.channelId, emb);
}

// ===== Discord -> Minecraft relay =====
async function handleDiscordToMinecraft(discordClient, target, discordUsername, text) {
  if (target === 'all') {
    for (const sid of Object.keys(state)) await sendToServerMessage(discordClient, sid, text, discordUsername);
    return;
  }
  await sendToServerMessage(discordClient, target, text, discordUsername);
}

// ===== Send to Minecraft (queue if offline) =====
async function sendToServerMessage(discordClient, serverId, text, discordUsername) {
  const st = state[serverId]; if (!st) return;
  const bot = st.bot;
  if (!st.online || !bot) {
    st.queuedMessages.push({ text, discordUsername });
    appendLocalLog(serverId, `[QUEUE] offline -> message queued`);
    bufferPush(serverId, `${makePrefix(serverId)} ⚠️ Server offline — message queued.`);
    return;
  }
  try {
    if (text.startsWith('/')) {
      st.totalCommandsToday++;
      bot.chat(text);
      appendLocalLog(serverId, `[CMD SENT] ${discordUsername}: ${text}`);
      // output will be captured by handleMinecraftMessage -> buffered
    } else {
      st.totalChatToday++;
      bot.chat(`${makePrefix(serverId)} ${text}`);
    }
  } catch (err) {
    st.errorCount++;
    appendLocalLog(serverId, `[ERROR SEND] ${err.message}`);
    bufferPush(serverId, `${makePrefix(serverId)} ❌ ${err.message}`);
  }
}

// ===== create relay bot per server (main bot that listens) =====
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
      appendLocalLog(sid, `[ERROR createBot] ${err.message}`);
      return scheduleReconnect(sid, discordClient, serverConfig);
    }

    st.bot = bot;

    bot.once('login', () => {
      st.online = true;
      st.startedAt = Date.now();
      appendLocalLog(sid, `[LOGIN] ${bot.username}`);
      bufferPush(sid, `✅ Relay bot connected as ${bot.username}`);
      // flush queued messages to server
      const queued = st.queuedMessages.splice(0);
      for (const q of queued) sendToServerMessage(discordClient, sid, q.text, q.discordUsername);
      // anti-AFK
      st.afkInterval1 = setInterval(() => { try { bot.setControlState('forward', true); setTimeout(()=>bot.setControlState('forward', false),600); } catch {} }, 60000);
      st.afkInterval2 = setInterval(() => { try { bot.setControlState('jump', true); setTimeout(()=>bot.setControlState('jump', false),300); } catch {} }, 120000);
    });

    bot.on('message', (json) => { try { handleMinecraftMessage(discordClient, sid, json.toString()); } catch {} });
    bot.on('messagestr', (m) => { try { handleMinecraftMessage(discordClient, sid, m); } catch {} });

    const handleDisconnect = (reason) => {
      clearInterval(st.afkInterval1); clearInterval(st.afkInterval2);
      st.online = false;
      st.bot = null;
      st.lastOfflineAt = Date.now();
      appendLocalLog(sid, `[DISCONNECT] ${String(reason)}`);
      bufferPush(sid, `⛔ ${st.config.name} — Disconnected: ${String(reason)}`);
      // schedule reconnect
      scheduleReconnect(sid, discordClient, serverConfig, 30000);
      // ensure minimum one bot exists (if no sim bots, spawn one)
      setTimeout(() => ensureMinimumBots(sid), 2000);
    };

    bot.on('kicked', handleDisconnect);
    bot.on('end', handleDisconnect);
    bot.on('error', (err) => { st.errorCount++; appendLocalLog(sid, `[ERROR] ${String(err)}`); if (!st.online) scheduleReconnect(sid, discordClient, serverConfig, 30000); });
  }

  connectOnce();
}

// ===== handle incoming mc messages (buffered) =====
function handleMinecraftMessage(discordClient, serverId, rawText) {
  const st = state[serverId];
  if (!st) return;
  const t = String(rawText).trim();
  if (!t) return;
  appendLocalLog(serverId, t);

  // player chat like "Name: message"
  const playerChatRegex = /^(?:\[(.*?)\]\s*)?([A-Za-z0-9_ -]{1,32}):\s*(.*)$/;
  const playerChat = t.match(playerChatRegex);
  if (playerChat) {
    const player = playerChat[2];
    const msg = playerChat[3];
    st.totalChatToday++;
    bufferPush(serverId, `💬 ${player}: ${msg}`);
    return;
  }

  // command issued
  const issuedCmd = t.match(/^([A-Za-z0-9_ -]{1,32}) issued server command: (\/\S.*)$/i);
  if (issuedCmd) {
    bufferPush(serverId, `🛠️ ${issuedCmd[1]}: ${issuedCmd[2]}`);
    return;
  }

  // important events
  const eventPatterns = [
    { re: /(has died|was slain|fell from a high place|hit the ground too hard|blew up|was shot by)/i, icon: '💀' },
    { re: /(earned the achievement|advancement)/i, icon: '🏆' },
    { re: /(joined the game|joined)/i, icon: '➡️' },
    { re: /(left the game|disconnected|left)/i, icon: '⏏️' }
  ];
  for (const p of eventPatterns) {
    if (p.re.test(t)) {
      st.totalEventsToday++;
      bufferPush(serverId, `${p.icon} ${t}`);
      // update players set for join/leave heuristics
      const jm = t.match(/([A-Za-z0-9_ -]{1,32}) joined the game/i);
      const lm = t.match(/([A-Za-z0-9_ -]{1,32}) (left the game|disconnected|left)/i);
      if (jm) try{ st.players.add(jm[1]); }catch{}
      if (lm) try{ st.players.delete(lm[1]); }catch{}
      return;
    }
  }

  // plugin messages: ignore unless contain key words
  const pluginMatch = t.match(/^\[?([A-Za-z0-9 _-]{2,40})\]?\s*(.*)$/);
  if (pluginMatch) {
    const payload = (pluginMatch[2]||'').toLowerCase();
    if (payload.includes('starting') || payload.includes('stopping') || payload.includes('online') || payload.includes('offline')) {
      bufferPush(serverId, `ℹ️ ${pluginMatch[1]}: ${pluginMatch[2]}`);
    }
    return;
  }

  // fallback
  bufferPush(serverId, `🔔 ${t}`);
}

// ===== execute command from discord -> capture output =====
async function executeMinecraftCommand(discordClient, serverId, cmdText, replyChannel, requestedBy) {
  const st = state[serverId]; if (!st) return replyChannel.send('❌ Server not found.');
  if (!st.online || !st.bot) return replyChannel.send('❌ Server offline.');

  ensureBuffer(serverId);
  const beforeLen = chatBuffers[serverId].items.length;
  try {
    st.bot.chat(cmdText);
    st.totalCommandsToday++;
    appendLocalLog(serverId, `[CMD] ${requestedBy}: ${cmdText}`);
  } catch (err) {
    appendLocalLog(serverId, `[CMD ERROR] ${err.message}`);
    return replyChannel.send(`❌ Gagal kirim command: ${err.message}`);
  }

  setTimeout(async () => {
    const afterItems = (chatBuffers[serverId]?.items || []).slice(beforeLen);
    if (!afterItems || afterItems.length === 0) return replyChannel.send('ℹ️ Command dikirim, tidak ada output terekam.');
    const out = afterItems.join('\n').slice(0,1900);
    await replyChannel.send(`📥 Output untuk \`${cmdText}\`:\n\`\`\`\n${out}\n\`\`\``).catch(()=>{});
    // remove captured items from buffer
    chatBuffers[serverId].items.splice(beforeLen, afterItems.length);
  }, CMD_CAPTURE_MS);
}

// ===== persistent simulated bots management =====
async function spawnSimBot(serverId, name) {
  const st = state[serverId]; if (!st) return null;
  try {
    const sim = mineflayer.createBot({
      host: st.config.host, port: st.config.port,
      username: name, version: st.config.version || 'auto', auth: 'offline'
    });
    st.simBots.set(name, sim);
    appendLocalLog(serverId, `[SIM SPAWN] ${name}`);
    // when login -> push join event
    sim.once('login', () => { bufferPush(serverId, `➡️ ${name} joined the game`); try{ st.players.add(name); }catch{} });
    sim.on('error', (e) => appendLocalLog(serverId, `[SIM ERROR] ${name} ${String(e)}`));
    sim.on('end', () => {
      appendLocalLog(serverId, `[SIM END] ${name}`);
      st.simBots.delete(name);
      bufferPush(serverId, `⏏️ ${name} left the game`);
      // ensure minimal bot presence after short delay
      setTimeout(()=>ensureMinimumBots(serverId), 2000);
    });
    return sim;
  } catch (err) {
    appendLocalLog(serverId, `[SIM CREATE ERROR] ${String(err)}`);
    return null;
  }
}

async function ensureMinimumBots(serverId) {
  const st = state[serverId]; if (!st) return;
  const total = totalBotsOnServer(st);
  if (total >= 1) return;
  // spawn one simulated bot to maintain minimal presence
  const name = getRandomName();
  await spawnSimBot(serverId, name);
  bufferPush(serverId, `ℹ️ Auto-spawn minimal bot: ${name}`);
}

// ===== handle !join command =====
async function handleJoinCommand(discordClient, serverId, count, replyChannel, requestedBy) {
  const st = state[serverId]; if (!st) return replyChannel.send('❌ Server tidak ada.');
  // determine how many can be spawned up to MAX
  const existingSims = st.simBots.size;
  const relayCount = st.bot ? 1 : 0;
  const currentTotal = existingSims + relayCount;
  if (count < 1) return replyChannel.send('❌ Jumlah harus >= 1.');
  if (currentTotal + count > MAX_SIM_PER_SERVER) {
    return replyChannel.send(`❌ Gagal: maksimal total bots per server adalah ${MAX_SIM_PER_SERVER}. Saat ini: ${currentTotal}`);
  }

  appendLocalLog(serverId, `[CMD_JOIN] ${requestedBy} -> ${count}`);
  const spawnedNames = [];
  for (let i=0;i<count;i++) {
    // small delay to avoid bursts
    // eslint-disable-next-line no-await-in-loop
    await new Promise(res=>setTimeout(res, SIM_SPAWN_DELAY_MS));
    const name = getRandomName();
    const sim = await spawnSimBot(serverId, name);
    if (sim) spawnedNames.push(name);
  }
  // one combined message to discord
  const listText = spawnedNames.map(n=>`• ${n}`).join('\n');
  if (spawnedNames.length === 0) return replyChannel.send('⚠️ Tidak ada bot berhasil dibuat.');
  await safeSendChannel(replyChannel.client, replyChannel.id, `👥 ${spawnedNames.length} pemain joined ${state[serverId].config.name} (simulated):\n${listText}`);
}

// ===== handle !kick command =====
async function handleKickCommand(discordClient, serverId, count, replyChannel, requestedBy) {
  const st = state[serverId]; if (!st) return replyChannel.send('❌ Server tidak ada.');
  if (count < 1) return replyChannel.send('❌ Jumlah harus >= 1.');
  // we will only kick simulated bots, never the relay main bot
  const simNames = Array.from(st.simBots.keys());
  if (simNames.length === 0) return replyChannel.send('⚠️ Tidak ada simulated bots untuk dikick (relay tidak akan diputus).');

  // ensure not to reduce total bots (relay + sims) below 1
  const relayCount = st.bot ? 1 : 0;
  let allowedToRemove = Math.max(0, (relayCount + st.simBots.size) - 1);
  if (allowedToRemove === 0) return replyChannel.send('⚠️ Tidak bisa kick: harus ada minimal 1 bot di server.');
  const toRemove = Math.min(count, allowedToRemove, simNames.length);

  appendLocalLog(serverId, `[CMD_KICK] ${requestedBy} -> ${toRemove}`);
  const removed = [];
  for (let i=0;i<toRemove;i++) {
    // pick random sim bot
    const names = Array.from(st.simBots.keys());
    if (names.length === 0) break;
    const pick = names[Math.floor(Math.random()*names.length)];
    const bot = st.simBots.get(pick);
    if (!bot) { st.simBots.delete(pick); continue; }
    // delay a bit to avoid burst
    // eslint-disable-next-line no-await-in-loop
    await new Promise(res=>setTimeout(res, SIM_KICK_DELAY_MS));
    try {
      bot.quit(); // triggers 'end' handler and removal
      removed.push(pick);
    } catch (err) {
      appendLocalLog(serverId, `[KICK ERROR] ${pick} ${String(err)}`);
      st.simBots.delete(pick);
    }
  }
  if (removed.length === 0) return replyChannel.send('⚠️ Tidak ada bot berhasil dikick.');
  const listText = removed.map(n=>`• ${n}`).join('\n');
  await safeSendChannel(replyChannel.client, replyChannel.id, `👋 ${removed.length} pemain dikick dari ${st.config.name}:\n${listText}`);
  // ensure minimal after small delay
  setTimeout(()=>ensureMinimumBots(serverId), 2000);
}

// ===== ensure initial minimal bots on startup =====
function ensureInitialMinimums() {
  for (const sid of Object.keys(state)) {
    // if relay not online and no sims, spawn one sim
    setTimeout(()=>ensureMinimumBots(sid), 3000);
  }
}

// call ensureInitialMinimums after a short delay when module init is used
setTimeout(()=>{ try { if (Object.keys(state).length) ensureInitialMinimums(); } catch{} }, 5000);

// ===== export end =====
