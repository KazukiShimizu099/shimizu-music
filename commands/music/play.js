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

    if (tracks.length > 1) {
      await interaction.editReply(
        `✅ Added **${tracks.length} songs** from playlist to queue!`,
      );
    } else {
      await interaction.editReply(`✅ Added to queue: **${tracks[0].title}**`);
    }
  },
};
