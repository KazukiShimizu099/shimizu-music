const { Client, GatewayIntentBits } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const ShoukakuConnector = require("shoukaku").Connectors.DiscordJS;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
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

client.on("ready", async () => {
  console.log(`✅ ${client.user.tag} is online and operational!`);

  try {
    console.log("[Shimizu Register] Purging global commands and forcing instant guild sync...");

    // Clearing stale global context arrays
    await client.application.commands.set([]);

    // Loop across all active guilds to clear routing delays
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
          description: "Stop the music and clear streaming pipelines"
        }
      ]);
    });

    console.log("[Shimizu Register] Absolute instant guild schemas deployed.");
  } catch (err) {
    console.error("[Shimizu Register Error]:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  console.log(`[Shimizu Intercept] Triggering: /${interaction.commandName}`);

  const guildId = interaction.guildId;
  const voiceChannel = interaction.member?.voice?.channel;

  if (interaction.commandName === "play") {
    await interaction.deferReply();
    let query = interaction.options.getString("query");

    if (!voiceChannel) {
      return interaction.editReply("❌ Please join a voice channel first!");
    }

    const isUrl = query.startsWith("http://") || query.startsWith("https://");
    if (!isUrl && !query.startsWith("ytsearch:") && !query.startsWith("scsearch:")) {
      query = `ytsearch:${query}`;
    }

    try {
      let result = await client.kazagumo.search(query, { requester: interaction.user });
      if (!result || !result.tracks || result.tracks.length === 0) {
        return interaction.editReply("❌ Zero tracking indices found for this query.");
      }

      let player = await client.kazagumo.createPlayer({
        guildId: guildId,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        deaf: true,
        volume: 80,
      });

      if (result.type === "PLAYLIST") {
        for (const track of result.tracks) player.queue.add(track);
        await interaction.editReply(`✅ Loaded playlist **${result.playlistName}** (${result.tracks.length} tracks)`);
      } else {
        player.queue.add(result.tracks[0]);
        await interaction.editReply(`✅ Queued: **${result.tracks[0].title}**`);
      }

      if (!player.playing && !player.paused && player.queue.length > 0) {
        await player.play();
      }
    } catch (e) {
      console.error("[Runtime Play Execution Error]:", e);
      return interaction.editReply("❌ Stream breakdown during player execution routing.");
    }
  }

  if (interaction.commandName === "stop") {
    await interaction.deferReply();
    const player = client.kazagumo?.players?.get(guildId);
    if (!player) {
      return interaction.editReply("❌ No active player found matching this guild session.");
    }
    try {
      player.queue.clear();
      await player.destroy();
      return interaction.editReply("⏹️ Player context completely cleared from voice channel.");
    } catch (e) {
      console.error("[Runtime Stop Execution Error]:", e);
      return interaction.editReply("❌ System exception during pipeline destruction.");
    }
  }
});

client.login(process.env.TOKEN);