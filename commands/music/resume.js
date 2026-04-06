const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Shimizu Music - Resume the paused song"),

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
    if (!guildQueue.player.paused)
      return interaction.reply({
        content: "❌ The song is already playing!",
        ephemeral: true,
      });

    guildQueue.player.setPaused(false);
    await interaction.reply({
      content: "▶️ The song has been resumed!",
      ephemeral: false,
    });
  },
};
