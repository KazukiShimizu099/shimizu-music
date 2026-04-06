const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Shimizu Music - Current song info"),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    }

    const track = player.queue.current;
    const position = player.shoukaku.position;
    const duration = track.length;

    // Progress bar
    const barLength = 20;
    const progress = Math.floor((position / duration) * barLength);
    const progressBar = "▓".repeat(progress) + "░".repeat(barLength - progress);

    const youtubeThumbnail =
      track.uri && track.uri.includes("youtube")
        ? `https://img.youtube.com/vi/${track.uri.split("v=")[1]?.split("&")[0]}/maxresdefault.jpg`
        : track.thumbnail || null;

    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "🎵 Now Playing - Shimizu Music",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        [
          `## [${track.title}](${track.uri})`,
          ``,
          `**🎤 Artist:** ${track.author || "Unknown"}`,
          `**⏱️ Duration:** \`${msToTime(position)} / ${msToTime(duration)}\``,
          `**🔁 Loop:** ${player.loop === "track" ? "ON" : "OFF"}`,
          `**🔊 Volume:** ${player.volume}%`,
          `**📋 Queue:** ${player.queue.size} songs remaining`,
          ``,
          `\`🔴\` \`${progressBar}\` \`${msToTime(duration)}\``,
        ].join("\n"),
      )
      .setThumbnail(youtubeThumbnail)
      .setFooter({
        text: "꒰ Shimizu Music 🌸 ꒱",
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

function msToTime(ms) {
  if (!ms) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
