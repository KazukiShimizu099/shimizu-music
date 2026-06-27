const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { Kazagumo, Connectors } = require("kazagumo"); // Destructured exactly to read Connectors

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Prefix message commands tracking ke liye
    GatewayIntentBits.GuildVoiceStates, // Voice pipelines ke liye
  ],
});

client.commands = new Collection();

// Tumhare initial standard public nodes
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

// Instantiating Kazagumo exactly how your stack expects it
client.kazagumo = new Kazagumo(
  {
    defaultSearchEngine: "youtube",
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new Connectors.DiscordJS(client), // Fixed and defined properly now
  nodes
);

// Standard Ready Triggers
client.on("ready", () => {
  console.log(`✅ ${client.user.tag} is online using folder command-handler structural logic!`);
});

// Your Custom Dynamic Command Handler Execution Block
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: "❌ Error executing command!" });
    } else {
      await interaction.reply({ content: "❌ Error executing command!", ephemeral: true });
    }
  }
});

// Prefix text handler trigger placeholder if needed by your handler
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(".")) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, client, args);
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.TOKEN);