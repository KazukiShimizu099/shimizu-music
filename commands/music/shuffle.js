const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shimizu Music - Shuffle the queue"),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    }

    if (!player.queue.tracks || player.queue.tracks.length < 2) {
      return interaction.reply({
        content: "❌ Not enough songs in queue to shuffle!",
        ephemeral: true,
      });
    }

    player.queue.shuffle();

    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: `🔀 Queue shuffled! **${player.queue.tracks.length}** songs shuffled.`,
        });
      } else {
        await interaction.reply({
          content: `🔀 Queue shuffled! **${player.queue.tracks.length}** songs shuffled.`,
        });
      }
    } catch (e) {
      interaction.channel.send(`🔀 Queue shuffled!`);
    }
  },
};
