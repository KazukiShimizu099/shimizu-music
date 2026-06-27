  const fs = require("fs");
  const path = require("path");
  const { Client, GatewayIntentBits, Collection } = require("discord.js");
  const { Kazagumo } = require("kazagumo");
  const ShoukakuConnector = require("shoukaku").Connectors.DiscordJS;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  client.commands = new Collection();

  // Command Handler Logic
  const musicPath = path.join(__dirname, "commands", "music");
  if (fs.existsSync(musicPath)) {
    const commandFiles = fs.readdirSync(musicPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`./commands/music/${file}`);
      client.commands.set(command.data.name, command);
    }
  }

  const nodes = [
    {
      name: "Node-1",
      url: "lavalinkv4.serenetia.com:443",
      auth: "https://seretia.link/discord",
      secure: true
    }
  ];

  client.kazagumo = new Kazagumo({
    defaultSearchEngine: "youtube",
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    }
  }, new ShoukakuConnector(client), nodes);

  // Auto-Play Next & Notifications
  client.kazagumo.on("playerStart", (player, track) => {
    const channel = client.channels.cache.get(player.textId);
    if (channel) channel.send(`🎶 Now playing: **${track.title}**`).catch(() => {});
  });

  // Auto-Disconnect on Queue Empty
  client.kazagumo.on("playerEmpty", player => {
    const channel = client.channels.cache.get(player.textId);
    if (channel) channel.send("⏹️ Queue ended. Disconnecting from voice channel.");
    player.destroy();
  });

  // Auto-Disconnect on Empty VC
  client.on("voiceStateUpdate", (oldState, newState) => {
    const player = client.kazagumo.players.get(oldState.guild.id);
    if (!player) return;

    // Bot got kicked or disconnected manually
    if (oldState.channelId && !newState.channelId && oldState.member.id === client.user.id) {
      return player.destroy();
    }

    // Everyone else left the VC
    if (oldState.channelId && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user.id)) {
      const channel = client.channels.cache.get(player.textId);
      if (channel) channel.send("🚶 Everyone left the voice channel. Disconnecting.");
      player.destroy();
    }
  });

  client.on("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const commandData = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
    await client.application.commands.set(commandData);
    console.log("✅ Commands deployed globally.");
  });

  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      const reply = { content: "❌ Command execution failed.", ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });

  client.login(process.env.TOKEN);