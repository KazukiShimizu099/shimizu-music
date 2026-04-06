const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Shimizu Music - Current song info with live duration"),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    }

    const track = player.queue.current;
    const duration = track.length;

    const youtubeThumbnail =
      track.uri && track.uri.includes("youtube")
        ? `https://img.youtube.com/vi/${track.uri.split("v=")[1]?.split("&")[0]}/maxresdefault.jpg`
        : track.thumbnail || null;

    function msToTime(ms) {
      if (!ms) return "0:00";
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    function buildProgressBar(position, total) {
      const barLength = 20;
      const progress = Math.min(
        Math.floor((position / total) * barLength),
        barLength,
      );
      return "▓".repeat(progress) + "░".repeat(barLength - progress);
    }

    function buildEmbed(position) {
      const progressBar = buildProgressBar(position, duration);
      return new EmbedBuilder()
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
            `**🔁 Loop:** ${player.loop === "track" ? "Track 🔂" : player.loop === "queue" ? "Queue 🔁" : "Off"}`,
            `**🔊 Volume:** ${player.volume}%`,
            `**📋 Queue:** ${player.queue.tracks?.length || 0} songs remaining`,
            ``,
            `\`${msToTime(position)}\` ${progressBar} \`${msToTime(duration)}\``,
          ].join("\n"),
        )
        .setThumbnail(youtubeThumbnail)
        .setFooter({
          text: "꒰ Shimizu Music 🌸 ꒱ • Live updating",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
    }

    // First reply
    const pos = player.shoukaku?.position || 0;
    const msg = await interaction.reply({
      embeds: [buildEmbed(pos)],
      fetchReply: true,
    });

    // Real-time update har 5 second
    const interval = setInterval(async () => {
      try {
        const currentPlayer = client.kazagumo.players.get(interaction.guildId);
        if (!currentPlayer || !currentPlayer.queue.current) {
          clearInterval(interval);
          return;
        }

        const currentPos = currentPlayer.shoukaku?.position || 0;
        await msg.edit({ embeds: [buildEmbed(currentPos)] });

        // Song khatam hone pe stop
        if (currentPos >= duration - 5000) {
          clearInterval(interval);
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 5000);

    // 10 minute baad auto stop
    setTimeout(() => clearInterval(interval), 600000);
  },
};
