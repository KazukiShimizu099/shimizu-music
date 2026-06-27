const { Client, GatewayIntentBits } = require("discord.js");
const { Kazagumo } = require("kazagumo");
// Direct package paths handle karenge taaki version undefined exceptions na aayein
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
  new ShoukakuConnector(client), // Fixed constructor assignment
  nodes
);

// Baki ka poora event handling code nichhe same rahega...

// Debug Loggers
client.kazagumo.on("playerStart", (player, track) => {
  console.log(`[Shimizu Debug] Player started streaming track: ${track.title}`);
});

client.kazagumo.on("playerError", (player, error) => {
  console.error("[Shimizu Debug] Kazagumo Core Player Error:", error);
});

client.on("ready", async () => {
  console.log(`✅ ${client.user.tag} is online and operational!`);

  try {
    console.log("[Shimizu Register] Started refreshing application (/) commands.");

    // Yeh line aapke server par automatic commands push kar degi
    await client.application.commands.set([
      {
        name: "play",
        description: "Shimizu Music - Play a song",
        options: [
          {
            name: "query",
            type: 3, // 3 represents STRING type in Discord API
            description: "Enter a song name or URL",
            required: true
          }
        ]
      },
      {
        name: "stop",
        description: "Stop the music and leave the voice channel"
      }
    ]);

    console.log("[Shimizu Register] Successfully reloaded application (/) commands globally.");
  } catch (error) {
    console.error("[Shimizu Register Error]:", error);
  }
});

// Command Handler Execution Block
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Debugging line to see if Discord is sending the command to the bot
  console.log(`[Shimizu Handler] Received slash command: /${interaction.commandName}`);

  // Checking direct commands collection
  const command = client.commands?.get(interaction.commandName);

  if (!command) {
    console.log(`[Shimizu Handler] Command /${interaction.commandName} not found in client.commands collection.`);
    return interaction.reply({ content: "❌ Command not synchronized globally.", ephemeral: true });
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error("[Shimizu Handler Critical Error]:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: "❌ Internal execution breakdown." });
    } else {
      await interaction.reply({ content: "❌ Internal execution breakdown.", ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);