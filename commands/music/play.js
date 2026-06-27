const { SlashCommandBuilder, MessageFlags } = require("discord.js");

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

    let searchQueries = [];
    if (!isUrl) {
      // Precise cross-engine lookups
      searchQueries.push(`spsearch:${query}`); // Spotify Search (High Accuracy)
      searchQueries.push(`scsearch:${query}`); // SoundCloud Fallback
    } else {
      searchQueries.push(query);
    }

    let result = null;
    for (const searchQuery of searchQueries) {
      try {
        result = await client.kazagumo.search(searchQuery, { requester: interaction.user });
        if (result && result.tracks && result.tracks.length > 0) {
          break; 
        }
      } catch (e) {
        console.error(`Search failed for: ${searchQuery}`, e.message);
      }
    }

    if (!result || !result.tracks || !result.tracks.length) {
      return interaction.editReply("❌ No results found across active networks! Try a different name.");
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

    const tracks = result.type === "PLAYLIST" ? result.tracks : [result.tracks[0]];
    for (const track of tracks) player.queue.add(track);

    if (!player.playing && !player.paused) await player.play();

    if (tracks.length > 1) {
      await interaction.editReply(`✅ Added **${tracks.length} songs** to queue!`);
    } else {
      await interaction.editReply(`✅ Added to queue: **${tracks[0].title}**`);
    }
  },
};