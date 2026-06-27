const { Client, GatewayIntentBits } = require("discord.js");
const { Kazagumo, Connectors } = require("kazagumo");
const Spotify = require("kazagumo-spotify"); // If you are using spotify plugin, else keep default

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // CRITICAL: This must be present for voice connection
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
]

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

// Global Debug Triggers to monitor exact track drops
client.kazagumo.on("playerStart", (player, track) => {
  console.log(`[Shimizu Debug] Player started streaming track: ${track.title}`);
});

client.kazagumo.on("playerError", (player, error) => {
  console.error("[Shimizu Debug] Kazagumo Core Player Error:", error);
});

client.kazagumo.on("playerResolveError", (player, track, error) => {
  console.error("[Shimizu Debug] Track Resolution Failed:", error);
});

client.on("ready", () => {
  console.log(`✅ ${client.user.tag} is online and operational!`);
});

// Your standard interaction/message handling execution block remains below
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.TOKEN);