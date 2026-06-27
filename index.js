const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const MAINTENANCE_MODE = false;
const MAINTENANCE_MESSAGE =
  "🔧 Shimizu Music is currently under maintenance. Please wait a while and try again!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const nodes = [
  {
    name: "Shimizu-Private-Node",
    host: "private-lavalink-node-production.up.railway.app",
    port: 443,
    password: "youshallnotpass",
    secure: true
  }
];

const kazagumo = new Kazagumo(
  {
    defaultSearchEngine: "youtube",
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new Connectors.DiscordJS(client),
  nodes,
);

client.kazagumo = kazagumo;
client.commands = new Collection();
client.vcTime = 0;

kazagumo.shoukaku.on("error", (name, error) => {
  console.error(`Lavalink Node Error (${name}):`, error.message);
});

function msToTime(ms) {
  if (!ms) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function buildProgressBar(position, total) {
  const barLength = 20;
  const progress = Math.min(
    Math.floor((position / total) * barLength),
    barLength,
  );
  return "▓".repeat(progress) + "░".repeat(barLength - progress);
}

kazagumo.on("playerStart", (player, track) => {
  const channel = client.channels.cache.get(player.textId);

  client.user.setActivity(`🎵 ${track.title} - ${track.author}`, { type: 2 });

  client.rest
    .put(`/channels/${player.voiceId}/voice-status`, {
      body: { status: `🎵 ${track.title} — ${track.author}` },
    })
    .catch((e) => console.error("VC Status Error:", e.message));

  if (!channel) return;

  const duration = track.length;
  const youtubeThumbnail =
    track.uri && track.uri.includes("youtube")
      ? `https://img.youtube.com/vi/${track.uri.split("v=")[1]?.split("&")[0]}/maxresdefault.jpg`
      : track.thumbnail || null;

  const animatedBg = "https://cdn.pfps.gg/banners/3752-anime.gif";

  function buildEmbed(position) {
    const progressBar = buildProgressBar(position, duration);
    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "✨ Shimizu Music — Now Playing",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        [
          `## 🎵 ${track.title}`,
          ``,
          `**🎤 Artist:** ${track.author || "Unknown"}`,
          `**⏱️ Duration:** \`${msToTime(position)} / ${msToTime(duration)}\``,
          `**📋 Queue:** \`${player.queue.tracks?.length || 0} songs remaining\``,
          `**🔁 Loop:** ${player.loop === "track" ? "Track 🔂" : player.loop === "queue" ? "Queue 🔁" : "Off"}`,
          `**🔊 Volume:** ${player.volume}%`,
          `> 👤 ${track.requester ? `<@${track.requester.id}>` : "Unknown"}`,
          ``,
          `\`${msToTime(position)}\` ${progressBar} \`${msToTime(duration)}\``,
        ].join("\n"),
      )
      .setImage(animatedBg)
      .setThumbnail(youtubeThumbnail)
      .setFooter({
        text: "꒰ Shimizu Music 🌸 ꒱ • Live updating",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pause_resume")
        .setLabel("⏸ Pause")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("skip")
        .setLabel("⏭ Skip")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("stop")
        .setLabel("⏹ Stop")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("loop")
        .setLabel("🔁 Loop")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("shuffle")
        .setLabel("🔀 Shuffle")
        .setStyle(ButtonStyle.Secondary),
    );

    return { embeds: [embed], components: [row] };
  }

  channel
    .send(buildEmbed(0))
    .then((msg) => {
      const interval = setInterval(async () => {
        try {
          const currentPlayer = client.kazagumo.players.get(player.guildId);
          if (!currentPlayer || !currentPlayer.queue.current) {
            clearInterval(interval);
            return;
          }
          if (currentPlayer.queue.current.uri !== track.uri) {
            clearInterval(interval);
            return;
          }
          const pos = currentPlayer.shoukaku?.position || 0;
          await msg.edit(buildEmbed(pos));
          if (pos >= duration - 2000) clearInterval(interval);
        } catch (e) {
          clearInterval(interval);
        }
      }, 2000);

      setTimeout(() => clearInterval(interval), 600000);
    })
    .catch(console.error);
});

kazagumo.on("playerEnd", (player) => {
  client.user.setActivity("🎵 Shimizu Music", { type: 2 });
});

kazagumo.on("playerEmpty", async (player) => {
  // Autoplay - related song fetch karo
  try {
    const lastTrack = player.queue.current;
    if (lastTrack && lastTrack.uri && lastTrack.uri.includes("youtube")) {
      const videoId = lastTrack.uri.split("v=")[1]?.split("&")[0];
      if (videoId) {
        const result = await client.kazagumo.search(
          `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`,
          { requester: client.user },
        );
        if (result && result.tracks.length > 1) {
          const randomIndex =
            Math.floor(Math.random() * Math.min(result.tracks.length - 1, 5)) +
            1;
          const randomTrack = result.tracks[randomIndex];
          if (randomTrack) {
            player.queue.add(randomTrack);
            await player.play();
            const channel = client.channels.cache.get(player.textId);
            if (channel)
              channel.send(
                `🎵 Autoplay: **${randomTrack.title}** by **${randomTrack.author}**`,
              );
            return;
          }
        }
      }
    }
  } catch (e) {
    console.error("Autoplay error:", e.message);
  }

  // Autoplay fail hua toh normal disconnect
  client.user.setActivity("🎵 Shimizu Music | .help", { type: 2 });
  client.rest
    .put(`/channels/${player.voiceId}/voice-status`, { body: { status: "" } })
    .catch((e) => console.error("VC Status Clear Error:", e.message));

  setTimeout(() => {
    const currentPlayer = client.kazagumo.players.get(player.guildId);
    if (currentPlayer && !currentPlayer.playing && !currentPlayer.paused) {
      const channel = client.channels.cache.get(player.textId);
      if (channel)
        channel.send("✅ Queue finished! Shimizu Music has disconnected.");
      currentPlayer.destroy();
    }
  }, 120000);
});

// Alone in VC - leave in 5s
client.on("voiceStateUpdate", (oldState, newState) => {
  const player = client.kazagumo.players.get(
    oldState.guild.id || newState.guild.id,
  );
  if (!player) return;

  const voiceChannel = oldState.guild.channels.cache.get(player.voiceId);
  if (!voiceChannel) return;

  // Sirf bot hai VC mein
  const members = voiceChannel.members.filter((m) => !m.user.bot);
  if (members.size === 0) {
    setTimeout(() => {
      const currentPlayer = client.kazagumo.players.get(
        oldState.guild.id || newState.guild.id,
      );
      if (!currentPlayer) return;

      const vc = oldState.guild.channels.cache.get(currentPlayer.voiceId);
      if (!vc) return;

      const humans = vc.members.filter((m) => !m.user.bot);
      if (humans.size === 0) {
        const channel = client.channels.cache.get(currentPlayer.textId);
        if (channel)
          channel.send("👋 Everyone left! Shimizu Music has disconnected.");
        currentPlayer.destroy();
      }
    }, 5000);
  }
});

const commandsPath = path.join(__dirname, "commands/music");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

client.on("interactionCreate", async (interaction) => {
  if (MAINTENANCE_MODE) {
    if (interaction.isChatInputCommand() || interaction.isButton()) {
      return interaction.reply({
        content: MAINTENANCE_MESSAGE,
        ephemeral: true,
      });
    }
  }

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ An error occurred while executing the command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ An error occurred while executing the command!",
          ephemeral: true,
        });
      }
    }
  }

  if (interaction.isButton()) {
    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player)
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });

    switch (interaction.customId) {
      case "pause_resume":
        if (player.paused) {
          await player.pause(false);
          await interaction.reply({ content: "▶️ Resumed!", ephemeral: true });
        } else {
          await player.pause(true);
          await interaction.reply({ content: "⏸️ Paused!", ephemeral: true });
        }
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
        if (player.loop === "none") {
          player.setLoop("track");
          await interaction.reply({
            content: "🔁 Loop: Track ON",
            ephemeral: true,
          });
        } else if (player.loop === "track") {
          player.setLoop("queue");
          await interaction.reply({
            content: "🔁 Loop: Queue ON",
            ephemeral: true,
          });
        } else {
          player.setLoop("none");
          await interaction.reply({ content: "🔁 Loop: OFF", ephemeral: true });
        }
        break;
      case "shuffle":
        player.queue.shuffle();
        await interaction.reply({
          content: "🔀 Queue shuffled!",
          ephemeral: true,
        });
        break;
    }
  }
});

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} is online! - Shimizu Music`);
  console.log(`📊 Servers: ${client.guilds.cache.size}`);
  client.user.setActivity("🎵 Shimizu Music", { type: 2 });

  // VC Time tracker
  setInterval(() => {
    const activePlayers = client.kazagumo.players.size;
    if (activePlayers > 0) {
      client.vcTime += activePlayers;
    }
  }, 1000);
});

const CONFIG_FILE = path.join(__dirname, "serverconfig.json");
function getPrefix(guildId) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    return config[guildId]?.prefix || ".";
  } catch (e) {
    return ".";
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (MAINTENANCE_MODE) return message.reply(MAINTENANCE_MESSAGE);

  const prefix = getPrefix(message.guild?.id);
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const aliases = {
    p: "play",
    s: "skip",
    st: "stop",
    pa: "pause",
    r: "resume",
    q: "queue",
    l: "loop",
    v: "volume",
    np: "nowplaying",
    f: "filter",
    h: "help",
    help: "help",
    ly: "lyrics",
    lyrics: "lyrics",
    setprefix: "setprefix",
    stats: "stats",
  };

  const resolvedName = aliases[commandName] || commandName;
  const command = client.commands.get(resolvedName);
  if (!command) return;

  const fakeInteraction = {
    guildId: message.guild.id,
    channelId: message.channel.id,
    channel: message.channel,
    member: message.member,
    user: message.author,
    guild: message.guild,
    content: message.content,
    replied: false,
    deferred: false,
    options: {
      getString: (name) => {
        if (name === "query") return args.join(" ");
        if (name === "prefix") return args[0] || null;
        if (name === "name") return args[0] || null;
        if (name === "type") return args[0] || null;
        if (name === "amount") return args[0] || null;
        if (name === "mode") return args[0] || null;
        return args[0] || null;
      },
      getInteger: (name) => {
        if (name === "amount") return parseInt(args[0]) || null;
        if (name === "index") return parseInt(args[0]) || null;
        return null;
      },
      getSubcommand: () => null,
    },
    deferReply: async () => {
      fakeInteraction.deferred = true;
    },
    editReply: async (data) => {
      return message.channel.send(data);
    },
    reply: async (data) => {
      fakeInteraction.replied = true;
      if (typeof data === "string") return message.channel.send(data);
      if (data.content) return message.channel.send(data.content);
      if (data.embeds) return message.channel.send({ embeds: data.embeds });
      return message.channel.send(data);
    },
    followUp: async (data) => {
      if (typeof data === "string") return message.channel.send(data);
      if (data.content) return message.channel.send(data.content);
      if (data.embeds) return message.channel.send({ embeds: data.embeds });
      return message.channel.send(data);
    },
    isChatInputCommand: () => false,
    isButton: () => false,
  };

  try {
    await command.execute(fakeInteraction, client);
  } catch (error) {
    console.error(error);
    message.channel.send("❌ An error occurred while executing the command!");
  }
});

const http = require("http");
http
  .createServer((req, res) => res.end("Shimizu Music is alive!"))
  .listen(3000);

client.login(process.env.DISCORD_TOKEN);
