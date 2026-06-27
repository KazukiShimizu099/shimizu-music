const { Client, GatewayIntentBits } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const ShoukakuConnector = require("shoukaku").Connectors.DiscordJS;

const PREFIX = "."; 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildVoiceStates, 
  ],
});

// Highly reliable active public nodes array
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
    defaultSearchEngine: "soundcloud", // FIXED: Shifted default fallback to SoundCloud
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new ShoukakuConnector(client),
  nodes
);

client.kazagumo.on("playerStart", (player, track) => {
  console.log(`[Shimizu Debug] Streaming started successfully: ${track.title}`);
});

client.kazagumo.on("playerError", (player, error) => {
  console.error("[Shimizu Debug] Critical Node Streaming Exception:", error);
});

client.on("ready", async () => {
  console.log(`✅ ${client.user.tag} online! Dual Mode Active [Prefix: ${PREFIX}]`);
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
  } catch (err) {
    console.error(err);
  }
});

async function handlePlay(context, query, voiceChannel, isSlash = false) {
  const target = isSlash ? context : await context.reply("🔍 Searching for your track on fallback index...");

  if (!voiceChannel) {
    const msg = "❌ Please join a voice channel first!";
    return isSlash ? context.editReply(msg) : target.edit(msg);
  }

  const isUrl = query.startsWith("http://") || query.startsWith("https://");

  // FIXED: Explicitly forcing text queries through clean scsearch stream provider
  if (!isUrl && !query.startsWith("ytsearch:") && !query.startsWith("scsearch:")) {
    query = `scsearch:${query}`; 
  }

  try {
    const userObj = isSlash ? context.user : context.author;
    let result = await client.kazagumo.search(query, { requester: userObj });

    if (!result || !result.tracks || result.tracks.length === 0) {
      const msg = "❌ Zero tracks decoded. Try another query.";
      return isSlash ? context.editReply(msg) : target.edit(msg);
    }

    let player = await client.kazagumo.createPlayer({
      guildId: context.guildId,
      textId: context.channelId,
      voiceId: voiceChannel.id,
      deaf: true,
      volume: 85,
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

    // Force strict dispatcher playback state acceleration
    if (!player.playing && !player.paused) {
      console.log(`[Shimizu Debug] Directing player to execute playback for: ${player.queue[0].title}`);
      await player.play();
    }
  } catch (e) {
    console.error("[Runtime Execution Error]:", e);
    const msg = "❌ Stream breakdown during player execution routing.";
    return isSlash ? context.editReply(msg) : target.edit(msg);
  }
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "play") {
    await interaction.deferReply();
    await handlePlay(interaction, interaction.options.getString("query"), interaction.member?.voice?.channel, true);
  }
  if (interaction.commandName === "stop") {
    await interaction.deferReply();
    const player = client.kazagumo?.players?.get(interaction.guildId);
    if (!player) return interaction.editReply("❌ No active music session.");
    player.queue.clear();
    await player.destroy();
    return interaction.editReply("⏹️ Player stopped.");
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "p" || command === "play") {
    const query = args.join(" ");
    if (!query) return message.reply(`❌ Usage: \`${PREFIX}p song_name\``);
    await handlePlay(message, query, message.member?.voice?.channel, false);
  }
  if (command === "stop" || command === "leave") {
    const player = client.kazagumo?.players?.get(message.guildId);
    if (!player) return message.reply("❌ No active music session.");
    player.queue.clear();
    await player.destroy();
    return message.reply("⏹️ Player stopped.");
  }
});

client.login(process.env.TOKEN);