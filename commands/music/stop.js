const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Shimizu Music - Stop the music and disconnect the bot"),

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

    guildQueue.tracks = [];
    guildQueue.player.stopTrack();
    try {
      guildQueue.player.connection.disconnect();
    } catch (e) {}
    client.queue.delete(interaction.guildId);

    await interaction.reply({
      content: "⏹️ Music has been stopped! Shimizu Music has disconnected.",
      ephemeral: false,
    });
  },
};
