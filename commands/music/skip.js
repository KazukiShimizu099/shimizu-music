const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Shimizu Music - Skip the current song"),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player)
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    if (!interaction.member.voice.channel)
      return interaction.reply({
        content: "❌ Please join a voice channel first!",
        ephemeral: true,
      });

    await player.skip();
    await interaction.reply({
      content: "⏭️ Song has been skipped!",
      ephemeral: false,
    });
  },
};
