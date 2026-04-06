const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

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
    name: "Node1",
    url: "lavalink.jirayu.net:13592",
    auth: "youshallnotpass",
    secure: false,
  },
  {
    name: "Node2",
    url: "lavalink.jirayu.net:443",
    auth: "youshallnotpass",
    secure: true,
  },
  {
    name: "Node3",
    url: "lavalinkv4.serenetia.com:443",
    auth: "https://dsc.gg/ajidevserver",
    secure: true,
  },
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
kazagumo.shoukaku.on("error", (name, error) => {
  console.error(`Lavalink Node Error (${name}):`, error.message);
});
client.commands = new Collection();

kazagumo.on("playerStart", (player, track) => {
  const channel = client.channels.cache.get(player.textId);
  if (channel)
    channel.send(`🎵 Now playing: **${track.title}** by **${track.author}**`);

  // Bot status update
  client.user.setActivity(`🎵 ${track.title} - ${track.author}`, { type: 2 });
});

kazagumo.on("playerEnd", (player) => {
  client.user.setActivity("🎵 Shimizu Music", { type: 2 });
});

kazagumo.on("playerEmpty", (player) => {
  client.user.setActivity("🎵 Shimizu Music | .help", { type: 2 });
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

kazagumo.on("playerEmpty", (player) => {
  setTimeout(() => {
    const currentPlayer = client.kazagumo.players.get(player.guildId);
    if (currentPlayer && !currentPlayer.playing && !currentPlayer.paused) {
      const channel = client.channels.cache.get(player.textId);
      if (channel)
        channel.send("✅ Queue ended! Shimizu Music has disconnected.");
      currentPlayer.destroy();
    }
  }, 120000);
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
          await interaction.reply({ content: "🔁 Loop: ON", ephemeral: true });
        } else {
          player.setLoop("none");
          await interaction.reply({ content: "🔁 Loop: OFF", ephemeral: true });
        }
        break;
      case "shuffle":
        player.queue.shuffle();
        await interaction.reply({
          content: "🔀 Queue has been shuffled!",
          ephemeral: true,
        });
        break;
    }
  }
});
const MAINTENANCE_MODE = false;
const MAINTENANCE_MESSAGE =
  "🔧 Shimizu Music is currently under maintenance. Please wait a while and try again!";
client.once("ready", () => {
  console.log(`✅ ${client.user.tag} is online! - Shimizu Music`);
  client.user.setActivity("🎵 Shimizu Music", { type: 2 });
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
  if (MAINTENANCE_MODE) {
    return message.reply(MAINTENANCE_MESSAGE);
  }
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
