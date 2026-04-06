const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Shimizu Music - Set volume")
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Volume between 1-100")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    ),

  async execute(interaction, client) {
    let volume;

    if (interaction.options?.getInteger) {
      volume = interaction.options.getInteger("amount");
    } else {
      volume = parseInt(interaction.options.getString("amount"));
    }

    if (!volume || isNaN(volume) || volume < 1 || volume > 100) {
      return interaction.reply({
        content: "❌ Please provide a valid volume (1-100)\nExample: `.v 80`",
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
