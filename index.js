require("dotenv").config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");
const fs = require("fs");
const path = require("path");
const KazagumoSpotify = require("kazagumo-spotify");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const nodes = [
  { name: "Node1", url: "lavalink.jirayu.net:13592", auth: "youshallnotpass", secure: false },
  { name: "Node2", url: "lavalinkv4.serenetia.com:443", auth: "https://dsc.gg/ajidevserver", secure: true },
  { name: "Node3", url: "lavalink.serenetia.com:443", auth: "https://dsc.gg/ajidevserver", secure: true }
];

client.kazagumo = new Kazagumo({
  defaultSearchEngine: "spotify", // Youtube se spotify change kiya
  plugins: [
    new KazagumoSpotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      playlistPageLimit: 1, // Performance ke liye 1 page limit (100 tracks)
      albumPageLimit: 1,
      searchMarket: 'IN',
    })
  ],
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  }
}, new Connectors.DiscordJS(client), nodes);

client.commands = new Collection();
client.vcTime = 0;

client.kazagumo.shoukaku.on("error", (name, error) => console.error(`Node Error (${name}):`, error.message));

function msToTime(ms) {
  if (!ms) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function buildProgressBar(position, total) {
  const barLength = 20;
  const progress = Math.min(Math.floor((position / total) * barLength), barLength);
  return "▓".repeat(progress) + "░".repeat(barLength - progress);
}

client.kazagumo.on("playerStart", (player, track) => {
  const channel = client.channels.cache.get(player.textId);
  client.user.setActivity(`🎵 ${track.title}`, { type: 2 });

  // STRICT FIX: Live Voice Channel Status Update via Discord REST API
  try {
    client.rest.put(`/channels/${player.voiceId}/voice-status`, {
      body: { status: `🎵 ${track.title}`.substring(0, 499) }
    }).catch(() => {});
  } catch (err) {}

  if (!channel) return;
  
  // Declared ONLY ONCE
  const duration = track.length; 
  const youtubeThumbnail = track.uri && track.uri.includes("youtube")
    ? `https://img.youtube.com/vi/${track.uri.split("v=")[1]?.split("&")[0]}/maxresdefault.jpg`
    : track.thumbnail || null;
  const animatedBg = "https://cdn.pfps.gg/banners/3752-anime.gif";

  function buildEmbed(position) {
    const progressBar = buildProgressBar(position, duration);
    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({ name: "✨ Shimizu Music - Now Playing", iconURL: client.user.displayAvatarURL() })
      .setDescription([
        `## 🎵 ${track.title}`,
        ``,
        `**🎤 Artist:** ${track.author || "Unknown"}`,
        `**⏱️ Duration:** \`${msToTime(position)} / ${msToTime(duration)}\``,
        `**📋 Queue:** \`${player.queue.tracks?.length || 0} songs remaining\``,
        `**🔊 Volume:** ${player.volume}%`,
        `> 👤 ${track.requester ? `<@${track.requester.id}>` : "Unknown"}`,
        ``,
        `\`${msToTime(position)}\` ${progressBar} \`${msToTime(duration)}\``,
      ].join("\n"))
      .setImage(animatedBg)
      .setThumbnail(youtubeThumbnail)
      .setFooter({ text: "꒰ Shimizu Music 🌸 ꒱", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("pause_resume").setLabel("⏸ Pause").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("skip").setLabel("⏭ Skip").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("stop").setLabel("⏹ Stop").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("loop").setLabel("🔁 Loop").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("shuffle").setLabel("🔀 Shuffle").setStyle(ButtonStyle.Secondary)
    );
    return { embeds: [embed], components: [row] };
  }

  channel.send(buildEmbed(0)).then((msg) => {
    const interval = setInterval(async () => {
      try {
        const currentPlayer = client.kazagumo.players.get(player.guildId);
        if (!currentPlayer || !currentPlayer.queue.current || currentPlayer.queue.current.uri !== track.uri) {
          return clearInterval(interval);
        }
        const pos = currentPlayer.shoukaku?.position || 0;
        await msg.edit(buildEmbed(pos)).catch(() => {});
        if (pos >= duration - 2000) clearInterval(interval);
      } catch (e) {
        clearInterval(interval);
      }
    }, 3000);
  }).catch(console.error);
});

// RESTORED: Autoplay System
client.kazagumo.on("playerEmpty", async (player) => {
  try {
    client.rest.put(`/channels/${player.voiceId}/voice-status`, {
      body: { status: "" }
    }).catch(() => {});
  } catch (err) {}
  try {
    const lastTrack = player.queue.current;
    if (lastTrack && lastTrack.uri && lastTrack.uri.includes("youtube")) {
      const videoId = lastTrack.uri.split("v=")[1]?.split("&")[0];
      if (videoId) {
        const result = await client.kazagumo.search(`https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`, { requester: client.user });
        if (result && result.tracks.length > 1) {
          const randomIndex = Math.floor(Math.random() * Math.min(result.tracks.length - 1, 5)) + 1;
          const randomTrack = result.tracks[randomIndex];
          if (randomTrack) {
            player.queue.add(randomTrack);
            await player.play();
            const channel = client.channels.cache.get(player.textId);
            if (channel) channel.send(`🎵 Autoplay: **${randomTrack.title}**`).catch(() => {});
            return;
          }
        }
      }
    }
  } catch (e) {
    console.error("Autoplay error:", e.message);
  }
  
  setTimeout(() => {
    const currentPlayer = client.kazagumo.players.get(player.guildId);
    if (currentPlayer && !currentPlayer.playing && !currentPlayer.paused) {
      const channel = client.channels.cache.get(player.textId);
      if (channel) channel.send("✅ Queue finished! Disconnecting.").catch(() => {});
      try { currentPlayer.destroy(); } catch (err) {}
    }
  }, 120000);
});

// Crash Protected Voice Updates
client.on("voiceStateUpdate", (oldState, newState) => {
  const player = client.kazagumo.players.get(oldState.guild.id);
  if (!player) return;
  try {
    const vc = oldState.guild.channels.cache.get(player.voiceId);
    if (!vc) return;
    const humans = vc.members.filter((m) => !m.user.bot);
    if (humans.size === 0) {
      setTimeout(() => {
        const current = client.kazagumo.players.get(oldState.guild.id);
        if (current) {
          const channel = client.channels.cache.get(current.textId);
          if (channel) channel.send("👋 Everyone left! Disconnecting.").catch(() => {});
          current.destroy();
        }
      }, 5000);
    }
  } catch (err) {}
});

// Command Loading
const commandsPath = path.join(__dirname, "commands/music");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) client.commands.set(command.data.name, command);
  }
}

// Interaction & Buttons
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      const msg = "❌ Command execution failed.";
      interaction.replied || interaction.deferred ? await interaction.followUp({ content: msg, ephemeral: true }) : await interaction.reply({ content: msg, ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player) return interaction.reply({ content: "❌ No song is currently playing!", ephemeral: true });

    try {
      switch (interaction.customId) {
        case "pause_resume":
          await player.pause(!player.paused);
          await interaction.reply({ content: player.paused ? "⏸️ Paused!" : "▶️ Resumed!", ephemeral: true });
          break;
        case "skip":
          await player.skip();
          await interaction.reply({ content: "⏭️ Skipped!", ephemeral: true });
          break;
        case "stop":
          player.queue.clear();
          await player.skip();
          player.destroy();
          await interaction.reply({ content: "⏹️ Stopped!", ephemeral: true });
          break;
        case "loop":
          const mode = player.loop === "none" ? "track" : player.loop === "track" ? "queue" : "none";
          player.setLoop(mode);
          await interaction.reply({ content: `🔁 Loop: ${mode.toUpperCase()}`, ephemeral: true });
          break;
        case "shuffle":
          player.queue.shuffle();
          await interaction.reply({ content: "🔀 Queue shuffled!", ephemeral: true });
          break;
      }
    } catch (error) {}
  }
});

// Fake Interaction for Prefix Commands
// Fake Interaction for Prefix Commands (REPLACE YOUR EXISTING messageCreate BLOCK WITH THIS)
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(".")) return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // STRICT FIX: Restored all missing aliases (ly, np, f, stats, etc.)
  const aliases = { 
    p: "play", s: "skip", st: "stop", pa: "pause", r: "resume", 
    q: "queue", l: "loop", v: "volume", ly: "lyrics", lyrics: "lyrics",
    np: "nowplaying", f: "filter", h: "help", stats: "stats" 
  };
  
  const resolvedName = aliases[commandName] || commandName;
  const command = client.commands.get(resolvedName);
  
  if (!command) return;

  // STRICT FIX: Optimized payload handling so live lyrics can fetch the message object and edit it
  const fakeInteraction = {
    guildId: message.guild.id, 
    channelId: message.channel.id, 
    channel: message.channel, 
    member: message.member, 
    user: message.author, 
    guild: message.guild, 
    deferred: false, 
    replied: false,
    options: { 
      getString: (name) => name === "query" ? args.join(" ") : args[0] || null, 
      getInteger: () => parseInt(args[0]) || null 
    },
    deferReply: async () => { fakeInteraction.deferred = true; },
    reply: async (data) => { 
      fakeInteraction.replied = true; 
      const payload = typeof data === "string" ? { content: data } : data;
      return message.channel.send(payload); 
    },
    editReply: async (data) => { 
      const payload = typeof data === "string" ? { content: data } : data;
      return message.channel.send(payload); 
    },
    followUp: async (data) => { 
      const payload = typeof data === "string" ? { content: data } : data;
      return message.channel.send(payload); 
    },
    isChatInputCommand: () => false, 
    isButton: () => false,
  };

  try { 
    await command.execute(fakeInteraction, client); 
  } catch (e) { 
    console.error("Hybrid Command Execution Error:", e); 
    message.channel.send("❌ An error occurred while executing the command.");
  }
});

process.on("unhandledRejection", error => console.error("[System] Unhandled Rejection:", error.message));
process.on("uncaughtException", error => console.error("[System] Uncaught Exception:", error.message));

client.once("ready", () => console.log(`✅ ${client.user.tag} is online!`));
client.login(process.env.TOKEN);