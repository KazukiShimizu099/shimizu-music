const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Shimizu Music - Resume paused song"),

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
    if (!player.paused)
      return interaction.reply({
        content: "❌ Song is already playing!",
        ephemeral: true,
      });

    await player.pause(false);

    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: "▶️ Song resumed!" });
      } else {
        await interaction.reply({ content: "▶️ Song resumed!" });
      }
    } catch (e) {
      interaction.channel.send("▶️ Song resumed!");
    }
  },
};
