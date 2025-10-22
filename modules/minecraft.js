// modules/minecraft.js
const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const SERVERS = [
  {
    id: 's1',
    name: 'Server 1',
    host: 'BananaUcok.aternos.me',
    port: 14262,
    initialUsername: 'BotServer1',
    channelId: 'CHANNEL_S1', // ganti ID channel Discord
    capacity: 100,
    version: '1.20.1'
  },
  {
    id: 's2',
    name: 'Server 2',
    host: 'nightz.my.id',
    port: 25583,
    initialUsername: 'Chizen404', // wajib
    channelId: 'CHANNEL_S2', // ganti ID channel Discord
    capacity: 100,
    version: '1.21.10'
  }
];

const MAX_SIM_PER_SERVER = 20;
const SIM_SPAWN_DELAY_MS = 400;
const SIM_KICK_DELAY_MS = 300;
const CHANNEL_MIN_INTERVAL_MS = 1200;
const BUFFER_IDLE_MS = 2500;
const BUFFER_FORCE_MS = 5000;

// random bot names
const randomNames = [
  'delta','Botty','NotchX','Kicker','Banned','Player','Crashy','Signal','ByeBot','LostMC',
  'Reboot','Jumpin','Zapper','MinerX','Crafty','Blocky','Pixelz','Mobster','EnderX','Nether',
  'SkyBot','RedMC','BlueMC','GhostX','LavaMC','AquaBot','Frosty','StormX','BlazeX','IronMC',
  'GoldMC','Diamond','Emerald','SwiftX','LuckyX','MegaMC','MicroX','TinyBot','AlphaX','BetaMC'
];

// ===== internal state =====
const state = {};
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', { recursive: true });

// ===== helpers =====
function appendLocalLog(serverId, line) {
  const file = path.join('logs', `server-${serverId}.log`);
  const ts = new Date().toISOString();
  try { fs.appendFileSync(file, `[${ts}] ${line}\n`); } catch {}
}

function getRandomName() {
  return randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 9000 + 1000);
}

function makePrefix(serverId) {
  return serverId === 's1' ? '[S1]' : '[S2]';
}

// ===== discord channel send helper =====
const discordChannelsCache = new Map();
const lastChannelSendAt = new Map();

async function getCachedChannel(client, id) {
  if (discordChannelsCache.has(id)) return discordChannelsCache.get(id);
  try {
    const ch = await client.channels.fetch(id).catch(()=>null);
    if (ch) discordChannelsCache.set(id,ch);
    return ch;
  } catch { return null; }
}

async function safeSendChannel(client, channelId, payload) {
  try {
    const now = Date.now();
    const last = lastChannelSendAt.get(channelId)||0;
    if (now - last < CHANNEL_MIN_INTERVAL_MS)
      await new Promise(res=>setTimeout(res, CHANNEL_MIN_INTERVAL_MS-(now-last)));
    const ch = await getCachedChannel(client, channelId);
    if (!ch) return;
    if (typeof payload === 'string') await ch.send(payload).catch(()=>{});
    else await ch.send(payload).catch(()=>{});
    lastChannelSendAt.set(channelId, Date.now());
  } catch {}
}

// ===== buffering system =====
const chatBuffers = {};
function ensureBuffer(sid) { if (!chatBuffers[sid]) chatBuffers[sid]={items:[], flushTimer:null, forceTimer:null}; }
function bufferPush(sid, text) {
  ensureBuffer(sid);
  const b = chatBuffers[sid];
  b.items.push(text);
  if (b.flushTimer) clearTimeout(b.flushTimer);
  b.flushTimer = setTimeout(()=>flushBuffer(sid), BUFFER_IDLE_MS);
  if (!b.forceTimer) {
    b.forceTimer = setTimeout(()=>{ flushBuffer(sid); b.forceTimer=null; }, BUFFER_FORCE_MS);
  }
}
async function flushBuffer(sid) {
  const b = chatBuffers[sid];
  if (!b || b.items.length===0) return;
  const st = state[sid];
  if (!st) { b.items=[]; return; }
  const out = b.items.splice(0).join('\n');
  if (b.flushTimer) { clearTimeout(b.flushTimer); b.flushTimer=null; }
  await safeSendChannel(st._discordClient, st.config.channelId, `${makePrefix(sid)}\n${out}`);
}

// ===== bot count =====
function totalBotsOnServer(st) {
  let relay = st.bot ? 1 : 0;
  let sims = 0;
  for (const b of st.simBots.values()) if (b && b.player && b.entity) sims++;
  if (st.simBots.size > sims) sims = st.simBots.size;
  return relay + sims;
}

// ===== reconnect helper =====
function scheduleReconnect(serverId, discordClient, serverConfig, delay=30000) {
  const st = state[serverId];
  if (!st) return;
  if (st.reconnectTimer) clearTimeout(st.reconnectTimer);
  appendLocalLog(serverId, `[RECONNECT] Will retry in ${delay/1000}s`);
  st.reconnectTimer = setTimeout(()=>createAndConnectBot(discordClient, serverConfig), delay);
}

// ===== init =====
module.exports = {
  init: (discordClient)=>{
    SERVERS.forEach(s=>{
      state[s.id] = {
        config: s,
        bot: null,
        simBots: new Map(),
        online: false,
        players: new Set(),
        queuedMessages: [],
        reconnectTimer:null,
        _discordClient:discordClient,
        allowJoin:true
      };
    });

    // discord listener
    discordClient.on('messageCreate', async (msg)=>{
      try {
        if (msg.author?.bot) return;
        const content = (msg.content||'').trim();
        if (!content) return;

        // !on / !off
        const onMatch = content.match(/^!on\s+(S[12])$/i);
        const offMatch = content.match(/^!off\s+(S[12])$/i);
        const joinMatch = content.match(/^!join\s+(S[12])\s+(\d{1,2})$/i);
        const kickMatch = content.match(/^!kick\s+(S[12])\s+(\d{1,2})$/i);

        if(onMatch){
          const sid = onMatch[1].toLowerCase()==='s1'?'s1':'s2';
          const st = state[sid]; st.allowJoin=true;
          await safeSendChannel(msg.client,msg.channel.id,`✅ ${st.config.name} boleh ada bot join kembali`);
          ensureMinimumBots(sid); return;
        }
        if(offMatch){
          const sid = offMatch[1].toLowerCase()==='s1'?'s1':'s2';
          const st = state[sid]; st.allowJoin=false;
          // kick all sim bots
          st.simBots.forEach(bot=>bot.quit()); st.simBots.clear();
          await safeSendChannel(msg.client,msg.channel.id,`⛔ ${st.config.name} tidak boleh ada bot join`);
          return;
        }
        if(joinMatch){
          const sid = joinMatch[1].toLowerCase()==='s1'?'s1':'s2';
          const count = parseInt(joinMatch[2],10);
          return handleJoinCommand(discordClient,sid,count,msg.channel,msg.author.username);
        }
        if(kickMatch){
          const sid = kickMatch[1].toLowerCase()==='s1'?'s1':'s2';
          const count = parseInt(kickMatch[2],10);
          return handleKickCommand(discordClient,sid,count,msg.channel,msg.author.username);
        }

        // relay discord -> minecraft anon
        if(msg.channel.id===state.s1.config.channelId) return handleDiscordToMinecraft(discordClient,'s1',content);
        if(msg.channel.id===state.s2.config.channelId) return handleDiscordToMinecraft(discordClient,'s2',content);

      }catch(e){console.error('minecraft:discordListener',e);}
    });

    SERVERS.forEach(s=>createAndConnectBot(discordClient,s));
    setTimeout(()=>{ try{ ensureInitialMinimums(); }catch{} },5000);
  }
};

// ===== stub functions =====
async function handleJoinCommand(discordClient,sid,count,channel,author){ /* spawn sim bots */ }
async function handleKickCommand(discordClient,sid,count,channel,author){ /* kick sim bots */ }
async function createAndConnectBot(discordClient,serverConfig){ /* connect relay bot */ }
async function handleDiscordToMinecraft(discordClient,target,text){ /* relay anon */ }
function ensureMinimumBots(sid){ /* check minimal bot presence */ }
function ensureInitialMinimums(){ /* init bot minimal */ }
