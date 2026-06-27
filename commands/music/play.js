const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Shimizu Music - Play a song")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Enter a song name or URL").setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();
    let query = interaction.options.getString("query");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply("❌ Please join a voice channel first!");
    }

    const isUrl = query.startsWith("http://") || query.startsWith("https://");

    // Fallback to strict native routing if not a direct URL
    if (!isUrl && !query.startsWith("scsearch:") && !query.startsWith("ytsearch:")) {
      query = `scsearch:${query}`;
    }

    let result;
    try {
      console.log(`[Shimizu Debug] Initiating lookup for query: ${query}`);
      result = await client.kazagumo.search(query, { requester: interaction.user });
      console.log(`[Shimizu Debug] Raw Kazagumo Response Type: ${result?.type || 'UNKNOWN'}, Tracks Count: ${result?.tracks?.length || 0}`);
    } catch (e) {
      console.error("[Shimizu Debug] Search Execution Failed:", e);
      return interaction.editReply("❌ An error occurred while searching for the song!");
    }

    // Critical validation check to block KazagumoError crashes
    if (!result || !result.tracks || result.tracks.length === 0) {
      return interaction.editReply("❌ No tracks found! Lavalink couldn't fetch metadata for this engine.");
    }

    let player;
    try {
      player = await client.kazagumo.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        deaf: true,
        volume: 80,
      });
    } catch (e) {
      console.error(e);
      return interaction.editReply("❌ Failed to join the voice channel!");
    }

    // Safely parse and queue the tracks
    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) player.queue.add(track);
      await interaction.editReply(`✅ Added playlist **${result.playlistName}** (${result.tracks.length} songs) to queue!`);
    } else {
      player.queue.add(result.tracks[0]);
      await interaction.editReply(`✅ Added to queue: **${result.tracks[0].title}**`);
    }

    // Run player execution only if tracks exist and player is idle
    if (!player.playing && !player.paused && player.queue.length > 0) {
      try {
        await player.play();
      } catch (playError) {
        console.error("[Shimizu Debug] Kazagumo Play Error:", playError.message);
        return interaction.channel.send("❌ Internal Lavalink error encountered during stream playback initiation.");
      }
    }
  },
};