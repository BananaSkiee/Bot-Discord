// modules/minecraft.js
// Full single-file implementation:
// - 2 Mineflayer bots (S1, S2)
// - 100 random minecraft usernames for reconnect after kick/ban
// - Discord -> Minecraft chat relay (channel per server)
// - Minecraft -> Discord chat + plugin/server messages (plain chat + embed for plugin/server)
// - !UN1 / !UN2 to change next Minecraft username for server 1/2
// - !log s1 / !log s2 to send server status embed
// - Queue messages when server offline
// - Auto reconnect loop
// - Local log files in ./logs

const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// ====== CONFIG - EDIT BEFORE RUN ======
const ID_GUILD = '1347233781391560837'; // your Discord guild id (required for nickname changes if used)
const CHANNEL_S1 = '1426537842875826278'; // Discord channel for Server 1 (plain chat + embeds)
const CHANNEL_S2 = '1429751342301184071'; // Discord channel for Server 2 (plain chat + embeds)

// Fill server host/port/initial username correctly:
// config servers (contoh)
const SERVERS = [
  { id: 's1', name: 'Server 1', host: 'BananaUcok.aternos.me', port: 14262, initialUsername: 'BotServer1', channelId: CHANNEL_S1, capacity: 100, version: '1.20.1' },
  { id: 's2', name: 'Server 2', host: 'nightz.my.id', port: 25583, initialUsername: 'BotServer2', channelId: CHANNEL_S2, capacity: 100, version: '1.21.10' }
];

// 100 random Minecraft usernames (short)
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
  try { fs.appendFileSync(file, `[${ts}] ${line}\n`); } catch (e) { /* ignore */ }
}
function getRandomName() {
  return randomNames[Math.floor(Math.random() * randomNames.length)];
}
function makePrefix(serverId) {
  return serverId === 's1' ? '[S1]' : '[S2]';
}

// Exported initializer
module.exports = {
  init: (discordClient) => {
    // prepare state
    SERVERS.forEach(s => {
      state[s.id] = {
        config: s,
        bot: null,
        usernameToUse: s.initialUsername, // current username to attempt
        queuedMessages: [],
        online: false,
        players: new Set(),
        totalChatToday: 0,
        totalCommandsToday: 0,
        totalEventsToday: 0,
        errorCount: 0,
        startedAt: null,
        lastOfflineAt: null,
        reconnectTimer: null
      };
    });

    // Discord message handler (relay + commands)
    discordClient.on('messageCreate', async (msg) => {
      if (msg.author.bot) return;
      const content = msg.content.trim();

      // prefix commands (no S1/S2 needed for normal chat)
      if (/^!log\s+s1$/i.test(content)) return sendServerStatus(discordClient, 's1', msg.channel);
      if (/^!log\s+s2$/i.test(content)) return sendServerStatus(discordClient, 's2', msg.channel);

      // !UN1 <nick> -> set next username for server1 and force reconnect
      const un1 = content.match(/^!UN1\s+(.+)$/i);
      const un2 = content.match(/^!UN2\s+(.+)$/i);
      if (un1) return setUsernameAndReconnect(discordClient, 's1', un1[1].trim(), msg.author.username);
      if (un2) return setUsernameAndReconnect(discordClient, 's2', un2[1].trim(), msg.author.username);

      // Plain chat in channel -> relay to corresponding server (no S1/S2 required)
      if (msg.channel.id === state.s1?.config.channelId) {
        return handleDiscordToMinecraft(discordClient, 's1', msg.author.username, content);
      }
      if (msg.channel.id === state.s2?.config.channelId) {
        return handleDiscordToMinecraft(discordClient, 's2', msg.author.username, content);
      }

      // Backwards compatible shortcuts: "S1 <text>" or "S2 <text>" or "ALL <text>"
      const mS1 = content.match(/^S1\s+([\s\S]+)/i);
      const mS2 = content.match(/^S2\s+([\s\S]+)/i);
      const mAll = content.match(/^ALL\s+([\s\S]+)/i);
      if (mS1) return handleDiscordToMinecraft(discordClient, 's1', msg.author.username, mS1[1]);
      if (mS2) return handleDiscordToMinecraft(discordClient, 's2', msg.author.username, mS2[1]);
      if (mAll) return handleDiscordToMinecraft(discordClient, 'all', msg.author.username, mAll[1]);

      // !mc s1/s2/all <command>
      const mcCmd = content.match(/^!mc\s+(s1|s2|all)\s+([\s\S]+)/i);
      if (mcCmd) {
        const target = mcCmd[1].toLowerCase();
        return handleDiscordToMinecraft(discordClient, target === 'all' ? 'all' : target, msg.author.username, mcCmd[2]);
      }
    });

    // Start bots
    SERVERS.forEach(s => createAndConnectBot(discordClient, s));
  }
};

// ===== helpers: send logs to discord channels =====
async function sendPlainToChannel(discordClient, channelId, text) {
  try {
    const ch = await discordClient.channels.fetch(channelId);
    if (!ch) return;
    await ch.send(text);
  } catch (e) {
    // ignore
  }
}

async function sendEmbedToChannel(discordClient, channelId, embed) {
  try {
    const ch = await discordClient.channels.fetch(channelId);
    if (!ch) return;
    await ch.send({ embeds: [embed] });
  } catch (e) {
    // ignore
  }
}

// ===== server status embed =====
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
  const players = Array.from(st.players || []);
  const embed = new EmbedBuilder()
    .setTitle(`${cfg.name} — Status`)
    .addFields(
      { name: 'Status', value: st.online ? '🟢 ONLINE' : '🔴 OFFLINE', inline: true },
      { name: 'Host', value: `${cfg.host}:${cfg.port}`, inline: true },
      { name: 'Players', value: `${players.length} / ${cfg.capacity}`, inline: true },
      { name: 'Uptime', value: st.startedAt ? msToHuman(Date.now() - st.startedAt) : '-', inline: true },
      { name: 'Total Chat Today', value: `${st.totalChatToday}`, inline: true },
      { name: 'Total Commands Today', value: `${st.totalCommandsToday}`, inline: true },
      { name: 'Total Events Today', value: `${st.totalEventsToday}`, inline: true }
    )
    .setTimestamp();
  return replyChannel.send({ embeds: [embed] });
}

// ===== change username manually and reconnect =====
async function setUsernameAndReconnect(discordClient, serverId, newUsername, requestedBy) {
  const st = state[serverId];
  if (!st) return;
  st.usernameToUse = newUsername;
  appendLocalLog(serverId, `[MANUAL_USERNAME] ${requestedBy} requested ${newUsername}`);
  // force disconnect (bot.quit()) so connect flow will use new username
  if (st.bot && typeof st.bot.quit === 'function') {
    try { st.bot.quit(); } catch (e) { /* ignore */ }
  }
  // log to Discord channel
  const embed = new EmbedBuilder()
    .setTitle(`${st.config.name} — Username Change`)
    .setDescription(`Next username set to \`${newUsername}\` (requested by ${requestedBy}). Reconnecting...`)
    .setColor(0x00AE86)
    .setTimestamp();
  sendEmbedToChannel(discordClient, st.config.channelId, embed);
}

// ===== handle Discord -> Minecraft relay =====
async function handleDiscordToMinecraft(discordClient, target, discordUsername, text) {
  if (target === 'all') {
    for (const sid of Object.keys(state)) {
      await sendToServerMessage(discordClient, sid, text, discordUsername);
    }
    // central log (optional)
    appendLocalLog('all', `[DISCORD → ALL] ${discordUsername}: ${text}`);
    return;
  }
  await sendToServerMessage(discordClient, target, text, discordUsername);
  appendLocalLog(target, `[DISCORD → ${target.toUpperCase()}] ${discordUsername}: ${text}`);
}

// ===== send to a specific Minecraft bot (queue if offline) =====
async function sendToServerMessage(discordClient, serverId, text, discordUsername) {
  const st = state[serverId];
  if (!st) return;
  const bot = st.bot;
  if (!st.online || !bot) {
    st.queuedMessages.push({ text, discordUsername, time: Date.now() });
    appendLocalLog(serverId, `[QUEUED] ${discordUsername}: ${text}`);
    // notify in channel that message queued (optional)
    const notify = `${makePrefix(serverId)} Server offline — message queued: ${text}`;
    await sendPlainToChannel(discordClient, st.config.channelId, notify);
    return;
  }

  const trimmed = text.trim();
  // If starts with '/', send as command (bot.chat('/...'))
  if (trimmed.startsWith('/')) {
    try {
      bot.chat(trimmed);
      st.totalCommandsToday++;
      appendLocalLog(serverId, `[DISCORD_CMD] ${discordUsername}: ${trimmed}`);
    } catch (err) {
      st.errorCount++;
      appendLocalLog(serverId, `[ERROR] Failed CMD: ${trimmed} (${err.message})`);
      await sendPlainToChannel(discordClient, st.config.channelId, `${makePrefix(serverId)} ❌ Failed to run command: ${err.message}`);
    }
  } else {
    // Send plain chat but DO NOT reveal the real Discord username as "source" to players.
    // We still include the discord username in our local log + Discord logs.
    const inGameMsg = `${makePrefix(serverId)} ${trimmed}`;
    try {
      bot.chat(inGameMsg);
      st.totalChatToday++;
      appendLocalLog(serverId, `[DISCORD_CHAT] ${discordUsername}: ${trimmed}`);
    } catch (err) {
      st.errorCount++;
      appendLocalLog(serverId, `[ERROR] Failed chat: ${inGameMsg} (${err.message})`);
      await sendPlainToChannel(discordClient, st.config.channelId, `${makePrefix(serverId)} ❌ Failed to send chat: ${err.message}`);
    }
  }
}

// ===== create & connect Mineflayer bot for each server =====
function createAndConnectBot(discordClient, serverConfig) {
  const sid = serverConfig.id;
  const st = state[sid];

  async function connectOnce() {
    // choose username to use: either manual override or existing or random on kick
    const usernameToTry = st.usernameToUse || serverConfig.initialUsername || getRandomName();
    // create bot
    let bot;
    try {
      // sebelum: mineflayer.createBot({ host: ..., port: ..., username: usernameToTry, version: '1.20.1', ... });
// sesudah:
bot = mineflayer.createBot({
  host: serverConfig.host,
  port: serverConfig.port,
  username: usernameToTry,
  version: serverConfig.version || 'auto', // gunakan version yg diset, atau 'auto' jika null
  auth: 'offline'
});
    } catch (err) {
      appendLocalLog(sid, `[ERROR] createBot threw: ${err.message}`);
      scheduleReconnect();
      return;
    }

    st.bot = bot;

    // events
    bot.once('login', async () => {
      st.online = true;
      st.startedAt = Date.now();
      st.lastOfflineAt = null;
      st.usernameToUse = bot.username || usernameToTry; // current username in use
      appendLocalLog(sid, `[LOGIN] Bot logged in as ${st.usernameToUse}`);
      // flush queued messages
      if (st.queuedMessages.length > 0) {
        const queued = st.queuedMessages.splice(0); // clear
        appendLocalLog(sid, `[QUEUE] Sending ${queued.length} queued messages`);
        for (const q of queued) {
          await sendToServerMessage(discordClient, sid, q.text, q.discordUsername);
        }
      }
      // announce to channel (optional)
      await sendPlainToChannel(discordClient, serverConfig.channelId, `${makePrefix(sid)} ✅ Bot connected as ${st.usernameToUse}`);

      // set up anti-AFK intervals (store ids if needed)
      st.afkInterval1 = setInterval(()=>{ try { if (bot.entity) { bot.setControlState('forward', true); setTimeout(()=>bot.setControlState('forward', false), 600); } } catch(e){} }, 60000);
      st.afkInterval2 = setInterval(()=>{ try { if (bot.entity){ bot.setControlState('jump', true); setTimeout(()=>bot.setControlState('jump', false), 300); } } catch(e){} }, 120000);
    });

    // catch normal chat/message packets
    bot.on('message', json => {
      try {
        const text = json.toString();
        handleMinecraftMessage(discordClient, sid, text);
      } catch (e) { /* ignore parse errors */ }
    });
    // sometimes messagestr is emitted
    bot.on('messagestr', msg => {
      try { handleMinecraftMessage(discordClient, sid, String(msg)); } catch (e) {}
    });

    // player join/leave events — mineflayer emits playerJoined/playerLeft with player objects in some versions
    bot.on('playerJoined', p => {
      if (!p || !p.username) return;
      st.players.add(p.username);
      st.totalEventsToday++;
      appendLocalLog(sid, `[JOIN] ${p.username}`);
      // log to discord plain
      sendPlainToChannel(discordClient, serverConfig.channelId, `${makePrefix(sid)} [JOIN] ${p.username}`);
    });
    bot.on('playerLeft', p => {
      if (!p || !p.username) return;
      st.players.delete(p.username);
      st.totalEventsToday++;
      appendLocalLog(sid, `[LEAVE] ${p.username}`);
      sendPlainToChannel(discordClient, serverConfig.channelId, `${makePrefix(sid)} [LEAVE] ${p.username}`);
    });

    // disconnect handlers: kicked, end
    const handleDisconnect = async (reason) => {
      // clear AFK intervals
      try { clearInterval(st.afkInterval1); clearInterval(st.afkInterval2); } catch(e){}
      st.online = false;
      st.lastOfflineAt = Date.now();
      st.bot = null;
      st.totalEventsToday++;
      appendLocalLog(sid, `[DISCONNECT] Reason: ${reason}`);
      // when kicked/banned we rotate username to try rejoin
      const newName = getRandomName();
      st.usernameToUse = newName;
      // inform discord (embed)
      const emb = new EmbedBuilder()
        .setTitle(`${serverConfig.name} — Disconnected`)
        .setDescription(`Bot disconnected: ${String(reason)}\nWill attempt reconnect with username: \`${newName}\`.`)
        .setColor(0xFF8C00)
        .setTimestamp();
      sendEmbedToChannel(discordClient, serverConfig.channelId, emb);
      scheduleReconnectWithDelay();
    };

    bot.on('kicked', (reason) => handleDisconnect(reason));
    bot.on('end', (reason) => handleDisconnect(reason));
    bot.on('error', (err) => {
      st.errorCount++;
      appendLocalLog(sid, `[ERROR] ${err && err.message ? err.message : String(err)}`);
      // don't immediately schedule reconnect here — 'end' will follow; but ensure reconnect exists
      if (!st.online) scheduleReconnectWithDelay();
    });

    // helper schedule reconnect
    function scheduleReconnectWithDelay() {
      if (st.reconnectTimer) clearTimeout(st.reconnectTimer);
      st.reconnectTimer = setTimeout(()=> {
        connectOnce();
      }, 30000); // try reconnect after 30s
    }
  } // end connectOnce

  // initial connect
  connectOnce();
}

// ===== parse Minecraft messages and forward to Discord =====
function handleMinecraftMessage(discordClient, serverId, rawText) {
  const st = state[serverId];
  if (!st) return;
  const t = String(rawText).trim();
  if (!t) return;
  appendLocalLog(serverId, t);

  // 1) player chat pattern: optional [Rank] Name: message
  // Common chat forms: "<name> message" OR "Name: message" OR "[Rank] Name: message"
  // We'll handle many variants; adjust regex if your chat plugin uses different format.
  const playerChatRegex = /^(?:\[(.*?)\]\s*)?([A-Za-z0-9_\\-]+):\s*(.*)$/;
  const playerChat = t.match(playerChatRegex);
  if (playerChat) {
    const rank = playerChat[1] ? `[${playerChat[1]}] ` : '';
    const player = playerChat[2];
    const msg = playerChat[3];
    st.players.add(player);
    st.totalChatToday++;
    const plain = `${makePrefix(serverId)} ${rank}${player}: ${msg}`;
    // send plain text to server channel
    sendPlainToChannel(discordClient, st.config.channelId, plain);
    return;
  }

  // 2) command issued: "name issued server command: /pl"
  const issuedCmd = t.match(/^([A-Za-z0-9_\\-]+) issued server command: (\/\S.*)$/i);
  if (issuedCmd) {
    const who = issuedCmd[1];
    const cmd = issuedCmd[2];
    st.totalCommandsToday++;
    const plain = `${makePrefix(serverId)} ${who}: ${cmd}`;
    sendPlainToChannel(discordClient, st.config.channelId, plain);
    return;
  }

  // 3) player death/achievement or other common events: attempt to match keywords
  const eventPatterns = [
    { re: /(has died|was slain|fell from a high place|hit the ground too hard|blew up|was shot by)/i, title: 'Death' },
    { re: /(earned the achievement|has made the advancement|got the achievement|earned the advancement)/i, title: 'Achievement' },
    { re: /(joined the game)/i, title: 'Join' },
    { re: /(left the game|disconnected)/i, title: 'Leave' }
  ];
  for (const p of eventPatterns) {
    if (p.re.test(t)) {
      st.totalEventsToday++;
      const embed = new EmbedBuilder()
        .setTitle(`${st.config.name} — ${p.title}`)
        .setDescription(t)
        .setColor(0x0099FF)
        .setTimestamp();
      sendEmbedToChannel(discordClient, st.config.channelId, embed);
      return;
    }
  }

  // 4) plugin/server messages: often start with [PluginName] msg OR contain important server lines
  const pluginMatch = t.match(/^\[?([A-Za-z0-9 _-]{2,40})\]?\s*(.*)$/);
  if (pluginMatch) {
    // This is a heuristic: many plugin messages come as "[PluginName] message"
    // We'll send as embed for readability.
    st.totalEventsToday++;
    const pluginName = pluginMatch[1];
    const pluginMsg = pluginMatch[2] || t;
    const embed = new EmbedBuilder()
      .setTitle(`${st.config.name} — ${pluginName}`)
      .setDescription(pluginMsg)
      .setColor(0x00FF00)
      .setTimestamp();
    sendEmbedToChannel(discordClient, st.config.channelId, embed);
    return;
  }

  // 5) fallback: generic server message -> embed
  st.totalEventsToday++;
  const embed = new EmbedBuilder()
    .setTitle(`${st.config.name} — Server Message`)
    .setDescription(t)
    .setColor(0xFFFF00)
    .setTimestamp();
  sendEmbedToChannel(discordClient, st.config.channelId, embed);
}

// End of modules/minecraft.js
