const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Shimizu Music - Set volume")
    .addIntegerOption(
      (opt) =>
        opt
          .setName("amount")
          .setDescription("Volume between 1-200") // Updated description
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(200), // Max value set to 200
    ),

  async execute(interaction, client) {
    let volume;

    if (interaction.options?.getInteger) {
      volume = interaction.options.getInteger("amount");
    } else {
      volume = parseInt(interaction.options.getString("amount"));
    }

    // Validation range updated to 200
    if (!volume || isNaN(volume) || volume < 1 || volume > 200) {
      return interaction.reply({
        content: "❌ Please provide a valid volume (1-200)\nExample: `.v 150`",
        ephemeral: true,
      });
    }

    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    }

    await player.setVolume(volume);

    await interaction.reply({ content: `🔊 Volume set to **${volume}%**` });
  },
};
