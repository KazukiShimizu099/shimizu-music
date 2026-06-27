const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Shimizu Music - Play a song")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Enter a song name or URL").setRequired(true)
    ),

  async execute(interaction, client) {
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    let query = interaction.options.getString("query");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply("❌ Please join a voice channel first!");
    }

    const isUrl = query.startsWith("http://") || query.startsWith("https://");

    // Switching default raw prefix to a clean public stream identifier
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

    if (!result || !result.tracks || result.tracks.length === 0) {
      return interaction.editReply("❌ No tracks found! This engine cannot decode the metadata.");
    }

    let player;
    try {
      player = await client.kazagumo.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        deaf: true,
        volume: 90, // Raised volume floor
      });
    } catch (e) {
      console.error(e);
      return interaction.editReply("❌ Failed to join the voice channel!");
    }

    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) player.queue.add(track);
      await interaction.editReply(`✅ Added playlist **${result.playlistName}** (${result.tracks.length} songs) to queue!`);
    } else {
      player.queue.add(result.tracks[0]);
      await interaction.editReply(`✅ Added to queue: **${result.tracks[0].title}**`);
    }

    // Force strict voice channel dispatcher execution
    if (!player.playing && !player.paused && player.queue.length > 0) {
      try {
        console.log("[Shimizu Debug] Triggering player dispatcher execution...");
        await player.play();
      } catch (playError) {
        console.error("[Shimizu Debug] Play Exception:", playError.message);
      }
    }
  },
};