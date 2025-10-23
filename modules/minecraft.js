// modules/minecraft.js
// Full integrated Minecraft <-> Discord bridge with persistent simulated bots,
// !join / !kick commands (prefix), buffered chat batching, anti-rate-limit.

const mineflayer = require('mineflayer');
const bedrock = require('bedrock-protocol'); // for Bedrock support
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// ====== CONFIG ======
const ID_GUILD = '1347233781391560837';
const CHANNEL_S1 = '1426537842875826278';
const CHANNEL_S2 = '1429751342301184071';

const SERVERS = [
  {
    id: 's1', name: 'Server 1', host: 'BananaUcok.aternos.me',
    port: 14262, initialUsername: 'BotServer1', channelId: CHANNEL_S1,
    capacity: 100, version: '1.20.1', type: 'java'
  },
  {
    id: 's2', name: 'Server 2', host: 'temanfauzandc.aternos.me',
    port: 19797, initialUsername: 'BotServer2', channelId: CHANNEL_S2,
    capacity: 100, version: '1.21.113', type: 'bedrock' // <--- bedrock
  }
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
  'Delta','Botty','NotchX','Kicker','Banned','Player','Crashy','Signal','ByeBot','LostMC',
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
  if (st.bot) try { 
    // attempt graceful quit for java bots
    if (st.config.type === 'java' && typeof st.bot.quit === 'function') {
      st.bot.quit();
    } else if (st.config.type === 'bedrock' && typeof st.bot.end === 'function') {
      st.bot.end();
    } else {
      try { st.bot.socket?.end?.(); } catch {}
    }
  } catch {}
  const emb = new EmbedBuilder().setTitle(`${st.config.name} — Username Change`)
    .setDescription(`Next username: ${newUsername}`)
    .setColor(0x00AE86).setTimestamp();
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
      // For bedrock, chat() isn't the same; many bedrock clients use 'text' packet send; try generic.
      if (st.config.type === 'bedrock' && typeof bot.chat === 'function') {
        bot.chat(text);
      } else if (st.config.type === 'bedrock' && typeof bot.queue === 'function') {
        // fallback - some bedrock clients expose queue/packet; best-effort:
        try { bot.queue('text', { message: text }); } catch {}
      } else {
        bot.chat(text);
      }
      appendLocalLog(serverId, `[CMD SENT] ${discordUsername}: ${text}`);
      // output will be captured by handleMinecraftMessage -> buffered
    } else {
      st.totalChatToday++;
      if (st.config.type === 'bedrock' && typeof bot.chat === 'function') {
        bot.chat(`${makePrefix(serverId)} ${text}`);
      } else {
        bot.chat(`${makePrefix(serverId)} ${text}`);
      }
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

  // helper for java disconnect (shared)
  function handleDisconnect(reason) {
    clearInterval(st.afkInterval1); clearInterval(st.afkInterval2);
    st.online = false;
    st.bot = null;
    st.lastOfflineAt = Date.now();
    appendLocalLog(sid, `[DISCONNECT] ${String(reason)}`);
    bufferPush(sid, `⛔ ${st.config.name} — Disconnected: ${String(reason)}`);
    scheduleReconnect(sid, discordClient, serverConfig, 30000);
    // ensure minimum one bot exists (if no sim bots, spawn one)
    setTimeout(() => ensureMinimumBots(sid), 2000);
  }

  async function connectOnce() {
    const usernameToTry = st.usernameToUse || serverConfig.initialUsername || getRandomName();

    if (serverConfig.type === 'bedrock') {
      // ======== BEDROCK MODE ========
      try {
        const client = bedrock.createClient({
          host: serverConfig.host,
          port: serverConfig.port,
          username: usernameToTry,
          version: serverConfig.version || undefined,
          offline: true
        });

        st.bot = client;
        st.online = true;
        st.startedAt = Date.now();
        appendLocalLog(sid, `[LOGIN-BEDROCK] ${usernameToTry}`);
        bufferPush(sid, `✅ Bedrock relay bot connected as ${usernameToTry}`);

        client.on('text', packet => {
          // packet.message or packet.data depending on bedrock-protocol version; be permissive
          const msg = packet.message || packet.data || '';
          try { handleMinecraftMessage(discordClient, sid, String(msg)); } catch {}
        });

        // Some bedrock-protocol versions emit 'packet' events for chat/text;
        client.on('packet', (packet) => {
          try {
            if (packet?.type === 'text') {
              const msg = packet.message || packet.data || '';
              handleMinecraftMessage(discordClient, sid, String(msg));
            }
          } catch {}
        });

        client.on('disconnect', reason => {
          st.online = false;
          appendLocalLog(sid, `[BEDROCK DISCONNECT] ${reason}`);
          bufferPush(sid, `⛔ ${serverConfig.name} — Disconnected (Bedrock): ${reason}`);
          scheduleReconnect(sid, discordClient, serverConfig, 30000);
          setTimeout(() => ensureMinimumBots(sid), 2000);
        });

        client.on('error', err => {
          appendLocalLog(sid, `[BEDROCK ERROR] ${String(err)}`);
          st.errorCount++;
          if (!st.online) scheduleReconnect(sid, discordClient, serverConfig, 30000);
        });

        // try to flush queued messages (for bedrock clients we will attempt chat)
        const queued = st.queuedMessages.splice(0);
        for (const q of queued) sendToServerMessage(discordClient, sid, q.text, q.discordUsername);

      } catch (err) {
        appendLocalLog(sid, `[BEDROCK CREATE ERROR] ${String(err)}`);
        return scheduleReconnect(sid, discordClient, serverConfig);
      }
      return;
    }

    // ======== JAVA MODE (default) ========
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
      appendLocalLog(sid, `[ERROR createBot] ${String(err)}`);
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

    bot.on('kicked', reason => { handleDisconnect(reason); });
    bot.on('end', reason => { handleDisconnect(reason); });
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
  const playerChatRegex = /^(?:\s*)?([A-Za-z0-9_ \-]{1,32}):\s*(.*)$/;
  const playerChat = t.match(playerChatRegex);
  if (playerChat) {
    const player = playerChat[1];
    const msg = playerChat[2];
    st.totalChatToday++;
    bufferPush(serverId, `💬 ${player}: ${msg}`);
    return;
  }

  // command issued
  const issuedCmd = t.match(/^([A-Za-z0-9_ \-]{1,32}) issued server command: (\/\S.*)$/i);
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
      const jm = t.match(/([A-Za-z0-9_ \-]{1,32}) joined the game/i);
      const lm = t.match(/([A-Za-z0-9_ \-]{1,32}) (left the game|disconnected|left)/i);
      if (jm) try{ st.players.add(jm[1]); }catch{}
      if (lm) try{ st.players.delete(lm[1]); }catch{}
      return;
    }
  }

  // plugin messages: crude handling
  const pluginMatch = t.match(/^\??\s*(.*)$/);
  if (pluginMatch) {
    const payload = (pluginMatch[1] || '').toLowerCase();
    if (payload.includes('starting') || payload.includes('stopping') || payload.includes('online') || payload.includes('offline')) {
      bufferPush(serverId, `ℹ️ ${pluginMatch[1]}`);
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
    // send command
    if (st.config.type === 'bedrock' && typeof st.bot.chat === 'function') {
      st.bot.chat(cmdText);
    } else {
      st.bot.chat(cmdText);
    }
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
    await replyChannel.send(`📥 Output untuk ${cmdText}:\n\`\`\`\n${out}\n\`\`\``).catch(()=>{});
    // remove captured items from buffer
    chatBuffers[serverId].items.splice(beforeLen, afterItems.length);
  }, CMD_CAPTURE_MS);
}

// ===== persistent simulated bots management =====
async function spawnSimBot(serverId, name) {
  const st = state[serverId]; if (!st) return null;
  try {
    if (st.config.type === 'bedrock') {
      // bedrock simulated bot
      const sim = bedrock.createClient({
        host: st.config.host, port: st.config.port,
        username: name, version: st.config.version || undefined, offline: true
      });
      st.simBots.set(name, sim);
      appendLocalLog(serverId, `[SIM SPAWN-BEDROCK] ${name}`);
      sim.once && sim.once('spawn', () => { bufferPush(serverId, `➡️ ${name} joined the game`); try{ st.players.add(name); }catch{} });
      sim.on && sim.on('error', (e) => appendLocalLog(serverId, `[SIM ERROR] ${name} ${String(e)}`));
      sim.on && sim.on('end', () => {
        appendLocalLog(serverId, `[SIM END] ${name}`);
        st.simBots.delete(name);
        bufferPush(serverId, `⏏️ ${name} left the game`);
        setTimeout(()=>ensureMinimumBots(serverId), 2000);
      });
      return sim;
    } else {
      // java simulated bot
      const sim = mineflayer.createBot({
        host: st.config.host, port: st.config.port,
        username: name, version: st.config.version || 'auto', auth: 'offline'
      });
      st.simBots.set(name, sim);
      appendLocalLog(serverId, `[SIM SPAWN] ${name}`);
      sim.once('login', () => { bufferPush(serverId, `➡️ ${name} joined the game`); try{ st.players.add(name); }catch{} });
      sim.on('error', (e) => appendLocalLog(serverId, `[SIM ERROR] ${name} ${String(e)}`));
      sim.on('end', () => {
        appendLocalLog(serverId, `[SIM END] ${name}`);
        st.simBots.delete(name);
        bufferPush(serverId, `⏏️ ${name} left the game`);
        setTimeout(()=>ensureMinimumBots(serverId), 2000);
      });
      return sim;
    }
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
  bufferPush(serverId, `ℹ️ Spawned helper sim: ${name}`);
}

// ===== handle !join / !kick commands (sim bots) =====
async function handleJoinCommand(discordClient, serverId, count, replyChannel, requestedBy) {
  const st = state[serverId]; if (!st) return replyChannel.send('Server tidak ditemukan.');
  // Check limit
  const canSpawn = Math.max(0, MAX_SIM_PER_SERVER - st.simBots.size);
  const willSpawn = Math.min(canSpawn, count);
  if (willSpawn <= 0) return replyChannel.send(`❌ Sudah mencapai limit simulated bots (${st.simBots.size}).`);
  replyChannel.send(`🔁 Memulai spawn ${willSpawn} simulated bots di ${st.config.name}...`);
  for (let i = 0; i < willSpawn; i++) {
    const name = getRandomName();
    await new Promise(r => setTimeout(r, SIM_SPAWN_DELAY_MS));
    await spawnSimBot(serverId, name);
  }
  appendLocalLog(serverId, `[JOIN CMD] ${requestedBy}: spawn ${willSpawn}`);
  bufferPush(serverId, `ℹ️ ${requestedBy} requested spawn ${willSpawn} simulated bots.`);
}
async function handleKickCommand(discordClient, serverId, count, replyChannel, requestedBy) {
  const st = state[serverId]; if (!st) return replyChannel.send('Server tidak ditemukan.');
  const current = Array.from(st.simBots.keys());
  if (current.length === 0) return replyChannel.send('Tidak ada simulated bots untuk dikick.');
  const willKick = Math.min(count, current.length);
  replyChannel.send(`🔁 Kicking ${willKick} simulated bots from ${st.config.name}...`);
  for (let i = 0; i < willKick; i++) {
    const name = current[i];
    await new Promise(r => setTimeout(r, SIM_KICK_DELAY_MS));
    const b = st.simBots.get(name);
    try {
      if (st.config.type === 'bedrock' && b && typeof b.end === 'function') b.end();
      else if (b && typeof b.quit === 'function') b.quit();
      else if (b && b.socket && typeof b.socket.end === 'function') b.socket.end();
    } catch (e) { /* ignore */ }
    st.simBots.delete(name);
    appendLocalLog(serverId, `[SIM KICK] ${name}`);
    bufferPush(serverId, `⏏️ ${name} kicked`);
  }
  appendLocalLog(serverId, `[KICK CMD] ${requestedBy}: kick ${willKick}`);
}

// end of file
