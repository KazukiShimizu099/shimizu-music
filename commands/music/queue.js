const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Shimizu Music - View current queue"),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    }

    const current = player.queue.current;
    const tracks = player.queue.tracks || [];

    if (!current) {
      return interaction.reply({
        content: "❌ Queue is empty!",
        ephemeral: true,
      });
    }

    const queueList =
      tracks.length > 0
        ? tracks
            .slice(0, 10)
            .map((t, i) => `**${i + 1}.** ${t.title} - ${t.author}`)
            .join("\n")
        : "*No songs in queue*";

    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "📋 Queue - Shimizu Music",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        [
          `**🎵 Now Playing:**`,
          `${current.title} - ${current.author}`,
          ``,
          `**📋 Up Next:**`,
          queueList,
        ].join("\n"),
      )
      .addFields({
        name: "📊 Stats",
        value: [
          `**Total Songs:** ${tracks.length + 1}`,
          `**Loop:** ${player.loop === "track" ? "ON" : "OFF"}`,
          `**Volume:** ${player.volume}%`,
        ].join("\n"),
        inline: true,
      })
      .setFooter({
        text:
          tracks.length > 10
            ? `Showing 10/${tracks.length} songs | Shimizu Music 🎶`
            : "Shimizu Music 🎶",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    try {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    } catch (e) {
      interaction.channel.send({ embeds: [embed] });
    }
  },
};
