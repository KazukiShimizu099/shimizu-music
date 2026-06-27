const { Client, GatewayIntentBits } = require("discord.js");
const { Kazagumo, Connectors } = require("kazagumo");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // CRITICAL: Voice streaming ke liye zaroori hai
  ],
});

// Highly active public clusters for bypass
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
  new Connectors.DiscordJS(client),
  nodes
);

// Debug Loggers
client.kazagumo.on("playerStart", (player, track) => {
  console.log(`[Shimizu Debug] Player started streaming track: ${track.title}`);
});

client.kazagumo.on("playerError", (player, error) => {
  console.error("[Shimizu Debug] Kazagumo Core Player Error:", error);
});

client.on("ready", () => {
  console.log(`✅ ${client.user.tag} is online and operational!`);
});

// Command Handler Execution Block
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Custom command mapping wrapper check
  const command = client.commands?.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error("[Shimizu Handler Error]:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: "❌ Error executing command!" });
    } else {
      await interaction.reply({ content: "❌ Error executing command!", ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);