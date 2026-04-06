const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Shimizu Music - Play a song")
    .addStringOption((opt) =>
      opt
        .setName("query")
        .setDescription("Enter a song name or URL")
        .setRequired(true),
    ),

  async execute(interaction, client) {
    await interaction.deferReply();
    const query = interaction.options.getString("query");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply("❌ Please join a voice channel first!");
    }

    let result;
    try {
      result = await client.kazagumo.search(query, {
        requester: interaction.user,
      });
    } catch (e) {
      return interaction.editReply(
        "❌ An error occurred while searching for the song!",
      );
    }

    if (!result || !result.tracks.length) {
      return interaction.editReply(
        "❌ No results found! Try a different query.",
      );
    }

    let player;
    try {
      player = await client.kazagumo.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        deaf: true,
        volume: 100,
      });
    } catch (e) {
      console.error(e);
      return interaction.editReply("❌ Failed to join the voice channel!");
    }

    const tracks =
      result.type === "PLAYLIST" ? result.tracks : [result.tracks[0]];
    for (const track of tracks) player.queue.add(track);

    if (!player.playing && !player.paused) await player.play();

    const track = tracks[0];

    const youtubeThumbnail =
      track.uri && track.uri.includes("youtube")
        ? `https://img.youtube.com/vi/${track.uri.split("v=")[1]?.split("&")[0]}/maxresdefault.jpg`
        : track.thumbnail || null;

    // Animated GIF background - anime music player theme
    const animatedBg = "https://cdn.pfps.gg/banners/3752-anime.gif";

    // Progress bar (static - Discord limitation)
    const progressBar = "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
    const duration = track.length ? msToTime(track.length) : "LIVE";

    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "✨ Shimizu Music — Now Playing",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        [
          `## 🎵 ${track.title}`,
          ``,
          `**🎤 Artist:** ${track.author || "Unknown"}`,
          `**⏱️ Duration:** \`${duration}\``,
          `**📋 Queue:** \`${player.queue.size} songs remaining\``,
          ``,
          `\`🔴\` ${progressBar} \`${duration}\``,
          ``,
          `> 👤 Requested by ${interaction.member.toString()}`,
        ].join("\n"),
      )
      .setImage(animatedBg)
      .setThumbnail(youtubeThumbnail)
      .setFooter({
        text: "꒰ Shimizu Music 🌸 ꒱ • Playing now",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pause_resume")
        .setLabel("⏸ Pause")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("skip")
        .setLabel("⏭ Skip")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("stop")
        .setLabel("⏹ Stop")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("loop")
        .setLabel("🔁 Loop")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("shuffle")
        .setLabel("🔀 Shuffle")
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.editReply({ embeds: [embed], components: [row1] });
  },
};

function msToTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
