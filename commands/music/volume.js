const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Shimizu Music - Set volume")
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Volume between 1-200")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(200),
    ),

  async execute(message, client, args) {
    const isInteraction = !!message.options;
    const volume = isInteraction
      ? message.options.getInteger("amount")
      : parseInt(args?.[0]);

    if (!volume || isNaN(volume) || volume < 1 || volume > 200) {
      const msg = "❌ Provide valid volume (1-200). Example: `.v 150`";
      return isInteraction
        ? message.reply({ content: msg, ephemeral: true })
        : message.channel.send(msg);
    }

    const player = client.kazagumo.players.get(message.guildId);

    if (!player) {
      const msg = "❌ Nothing is playing!";
      return isInteraction
        ? message.reply({ content: msg, ephemeral: true })
        : message.channel.send(msg);
    }

    try {
      // 1. Equalizer setup
      const bassReducer = [
        { band: 0, gain: -0.15 },
        { band: 1, gain: -0.12 },
        { band: 2, gain: -0.08 },
      ];

      // 2. Fix: Access shoukaku player for filters
      if (volume > 100) {
        // Kazagumo uses shoukaku property for filters
        await player.shoukaku.setFilters({
          equalizer: bassReducer,
        });
      } else {
        await player.shoukaku.clearFilters();
      }

      // 3. Set Volume
      await player.setVolume(volume);

      const response = `🔊 Volume set to **${volume}%** ${volume > 100 ? "(Bass reduced to prevent distortion)" : ""}`;
      return isInteraction
        ? message.reply({ content: response })
        : message.channel.send(response);
    } catch (err) {
      console.error("LOGS:", err);
      const errMsg = "❌ Lavalink filter application failed.";
      return isInteraction
        ? message.reply({ content: errMsg, ephemeral: true })
        : message.channel.send(errMsg);
    }
  },
};
