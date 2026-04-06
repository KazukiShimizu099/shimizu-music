const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Shimizu Music - Pause current song"),

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
    if (player.paused)
      return interaction.reply({
        content: "❌ Song is already paused!",
        ephemeral: true,
      });

    await player.pause(true);

    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: "⏸️ Song paused!" });
      } else {
        await interaction.reply({ content: "⏸️ Song paused!" });
      }
    } catch (e) {
      interaction.channel.send("⏸️ Song paused!");
    }
  },
};
