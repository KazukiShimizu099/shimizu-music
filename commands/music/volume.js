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

  async execute(interaction, client) {
    let volume = interaction.options.getInteger("amount");

    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    }

    // 1. Bass reduction logic define karo
    const bassReducer = [
      { band: 0, gain: -0.15 }, // Lower Bass
      { band: 1, gain: -0.12 }, // Mid Bass
      { band: 2, gain: -0.08 }  // Upper Bass
    ];

    // 2. Volume check karke filters apply karo
    if (volume > 100) {
      await player.setFilters({
        equalizer: bassReducer
      });
    } else {
      await player.clearFilters();
    }

    // 3. Final volume set karo
    await player.setVolume(volume);

    await interaction.reply({ 
      content: `🔊 Volume set to **${volume}%** ${volume > 100 ? "(Bass reduced to prevent distortion)" : ""}` 
    });
  },
};