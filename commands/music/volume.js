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

  async execute(interaction, client, args) {
    // 1. Get Volume (Handles Slash and Prefix both)
    let volume;
    if (interaction.options) {
      // For Slash Command
      volume = interaction.options.getInteger("amount");
    } else {
      // For Prefix Command (.v 100)
      volume = parseInt(args[0]);
    }

    // 2. Validation
    if (!volume || isNaN(volume) || volume < 1 || volume > 200) {
      const msg = "❌ Please provide a valid volume (1-200)\nExample: `.v 150` ya `/volume amount:150`";
      return interaction.reply ? interaction.reply({ content: msg, ephemeral: true }) : interaction.channel.send(msg);
    }

    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      const msg = "❌ No song is currently playing!";
      return interaction.reply ? interaction.reply({ content: msg, ephemeral: true }) : interaction.channel.send(msg);
    }

    try {
      // 3. Bass reduction logic (Prevents 200% distortion)
      const bassReducer = [
        { band: 0, gain: -0.15 },
        { band: 1, gain: -0.12 },
        { band: 2, gain: -0.08 }
      ];

      if (volume > 100) {
        await player.setFilters({ equalizer: bassReducer });
      } else {
        await player.clearFilters();
      }

      // 4. Set Volume
      await player.setVolume(volume);

      const response = `🔊 Volume set to **${volume}%** ${volume > 100 ? "(Bass reduced for clarity)" : ""}`;
      return interaction.reply ? interaction.reply({ content: response }) : interaction.channel.send(response);

    } catch (error) {
      console.error(error);
      const errMsg = "❌ Error applying volume/filters.";
      return interaction.reply ? interaction.reply({ content: errMsg, ephemeral: true }) : interaction.channel.send(errMsg);
    }
  },
};