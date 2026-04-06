const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Shimizu Music - Pause the current song"),

  async execute(interaction, client) {
    const guildQueue = client.queue.get(interaction.guildId);

    if (!guildQueue)
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    if (!interaction.member.voice.channel)
      return interaction.reply({
        content: "❌ Please join a voice channel first!",
        ephemeral: true,
      });
    if (guildQueue.player.paused)
      return interaction.reply({
        content: "❌ The song is already paused!",
        ephemeral: true,
      });

    guildQueue.player.setPaused(true);
    await interaction.reply({
      content: "⏸️ The song has been paused!",
      ephemeral: false,
    });
  },
};
