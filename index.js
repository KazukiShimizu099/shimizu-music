const { Client, GatewayIntentBits } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const ShoukakuConnector = require("shoukaku").Connectors.DiscordJS;

const PREFIX = "."; 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // CRITICAL: Prefix read karne ke liye ON hona chahiye
    GatewayIntentBits.GuildVoiceStates, // CRITICAL: Voice join karne ke liye ON hona chahiye
  ],
});

const nodes = [
  {
    name: "Node-1",
    url: "lavalinkv4.serenetia.com:443",
    auth: "https://seretia.link/discord",
    secure: true,
  },
  {
    name: "Node-2",
    url: "lavalink.jirayu.net:443",
    auth: "youshallnotpass",
    secure: true,
  }
];

client.kazagumo = new Kazagumo(
  {
    defaultSearchEngine: "youtube",
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new ShoukakuConnector(client),
  nodes
);

// Track Logger
client.kazagumo.on("playerStart", (player, track) => {
  console.log(`[Shimizu Debug] Streaming started: ${track.title}`);
});

client.on("ready", async () => {
  console.log(`✅ ${client.user.tag} is online! Dual Mode: Slash (/) & Prefix [ ${PREFIX} ]`);

  // Instant Guild Slash Command Deployment to bypass global 1-hour cache delay
  try {
    client.guilds.cache.forEach(async (guild) => {
      await guild.commands.set([
        {
          name: "play",
          description: "Shimizu Music - Play a song",
          options: [
            {
              name: "query",
              type: 3,
              description: "Enter song name / URL",
              required: true
            }
          ]
        },
        {
          name: "stop",
          description: "Stop the music and leave voice channel"
        }
      ]);
    });
    console.log("[Shimizu Register] Slash configuration force-injected to guilds.");
  } catch (err) {
    console.error("[Shimizu Register Error]:", err);
  }
});

// ==========================================
// MASTER AUDIO EXECUTION CONTROLLER
// ==========================================
async function handlePlay(context, query, voiceChannel, isSlash = false) {
  const target = isSlash ? context : await context.reply("🔍 Searching for your track...");

  if (!voiceChannel) {
    const msg = "❌ Please join a voice channel first!";
    return isSlash ? context.editReply(msg) : target.edit(msg);
  }

  const isUrl = query.startsWith("http://") || query.startsWith("https://");
  if (!isUrl && !query.startsWith("ytsearch:") && !query.startsWith("scsearch:")) {
    query = `ytsearch:${query}`;
  }

  try {
    const userObj = isSlash ? context.user : context.author;
    let result = await client.kazagumo.search(query, { requester: userObj });

    if (!result || !result.tracks || result.tracks.length === 0) {
      const msg = "❌ Zero tracking indices found for this query.";
      return isSlash ? context.editReply(msg) : target.edit(msg);
    }

    let player = await client.kazagumo.createPlayer({
      guildId: context.guildId,
      textId: context.channelId,
      voiceId: voiceChannel.id,
      deaf: true,
      volume: 80,
    });

    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) player.queue.add(track);
      const msg = `✅ Loaded playlist **${result.playlistName}** (${result.tracks.length} tracks)`;
      isSlash ? await context.editReply(msg) : await target.edit(msg);
    } else {
      player.queue.add(result.tracks[0]);
      const msg = `✅ Queued: **${result.tracks[0].title}**`;
      isSlash ? await context.editReply(msg) : await target.edit(msg);
    }

    if (!player.playing && !player.paused && player.queue.length > 0) {
      await player.play();
    }
  } catch (e) {
    console.error("[Runtime Execution Error]:", e);
    const msg = "❌ Stream breakdown during player execution routing.";
    return isSlash ? context.editReply(msg) : target.edit(msg);
  }
}

// ==========================================
// LISTENER 1: SLASH COMMAND HANDLER (/)
// ==========================================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  console.log(`[Slash Interact] /${interaction.commandName}`);

  if (interaction.commandName === "play") {
    await interaction.deferReply();
    const query = interaction.options.getString("query");
    const voiceChannel = interaction.member?.voice?.channel;
    await handlePlay(interaction, query, voiceChannel, true);
  }

  if (interaction.commandName === "stop") {
    await interaction.deferReply();
    const player = client.kazagumo?.players?.get(interaction.guildId);
    if (!player) return interaction.editReply("❌ No active music session found.");

    player.queue.clear();
    await player.destroy();
    return interaction.editReply("⏹️ Player stopped and left the channel.");
  }
});

// ==========================================
// LISTENER 2: PREFIX HANDLER (.)
// ==========================================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "p" || command === "play") {
    console.log(`[Prefix Interact] ${PREFIX}${command}`);
    const query = args.join(" ");
    if (!query) return message.reply(`❌ Usage: \`${PREFIX}p song_name\``);

    const voiceChannel = message.member?.voice?.channel;
    await handlePlay(message, query, voiceChannel, false);
  }

  if (command === "stop" || command === "leave") {
    console.log(`[Prefix Interact] ${PREFIX}${command}`);
    const player = client.kazagumo?.players?.get(message.guildId);
    if (!player) return message.reply("❌ No active music session found.");

    player.queue.clear();
    await player.destroy();
    return message.reply("⏹️ Player stopped and left the channel.");
  }
});

client.login(process.env.TOKEN);