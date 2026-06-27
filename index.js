const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");

const PREFIX = ".";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();

const musicPath = path.join(__dirname, "commands", "music");
if (fs.existsSync(musicPath)) {
  const commandFiles = fs.readdirSync(musicPath).filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/music/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

const nodes = [
  {
    name: "Node-1",
    url: "lavalinkv4.serenetia.com:443",
    auth: "https://seretia.link/discord",
    secure: true
  },
  {
    name: "Node-2",
    url: "lavalink.jirayu.net:443",
    auth: "youshallnotpass",
    secure: true
  }
];

client.kazagumo = new Kazagumo({
  defaultSearchEngine: "youtube",
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  }
}, new Connectors.DiscordJS(client), nodes);

client.kazagumo.on("playerStart", (player, track) => {
  const channel = client.channels.cache.get(player.textId);
  if (channel) channel.send(`🎶 Now playing: **${track.title}**`).catch(() => {});
});

client.kazagumo.on("playerEmpty", player => {
  const channel = client.channels.cache.get(player.textId);
  if (channel) channel.send("⏹️ Queue finished. Disconnecting from VC.");
  player.destroy();
});

client.on("voiceStateUpdate", (oldState, newState) => {
  const player = client.kazagumo.players.get(oldState.guild.id);
  if (!player) return;

  if (oldState.channelId && !newState.channelId && oldState.member.id === client.user.id) {
    return player.destroy();
  }

  if (oldState.channelId && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user.id)) {
    const channel = client.channels.cache.get(player.textId);
    if (channel) channel.send("🚶 Everyone left. Disconnecting.");
    player.destroy();
  }
});

client.on("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  try {
    const commandData = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
    await client.application.commands.set(commandData);
    console.log("✅ Commands force-deployed globally.");
  } catch (error) {
    console.error("Command deployment failed:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    const msg = "❌ Command execution failed.";
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: msg });
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

// Hybrid Prefix Engine
client.on("messageCreate", async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const aliases = { p: "play", s: "skip", st: "stop", q: "queue", pa: "pause", r: "resume", v: "volume" };
  const resolvedName = aliases[cmdName] || cmdName;
  const command = client.commands.get(resolvedName);

  if (!command) return;

  const fakeInteraction = {
    isChatInputCommand: () => true,
    commandName: resolvedName,
    guildId: message.guild.id,
    channelId: message.channel.id,
    member: message.member,
    user: message.author,
    guild: message.guild,
    channel: message.channel,
    deferred: false,
    replied: false,
    options: {
      getString: () => args.join(" ") || null,
      getInteger: () => parseInt(args[0]) || null,
    },
    deferReply: async () => { fakeInteraction.deferred = true; },
    reply: async (data) => { fakeInteraction.replied = true; return message.channel.send(data); },
    editReply: async (data) => message.channel.send(data),
  };

  try {
    await command.execute(fakeInteraction, client);
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.TOKEN);