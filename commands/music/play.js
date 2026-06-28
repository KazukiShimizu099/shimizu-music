const { SlashCommandBuilder } = require("discord.js");
const ytSearch = require("yt-search");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or add to queue")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Song name or URL")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    if (typeof interaction.deferReply === "function" && !interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const query = interaction.options.getString("query");
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      const msg = "❌ You must be in a voice channel to play music.";
      return interaction.editReply ? await interaction.editReply(msg) : await interaction.reply(msg);
    }

    let player = client.kazagumo.players.get(interaction.guildId);
    if (!player) {
      try {
        player = await client.kazagumo.createPlayer({
          guildId: interaction.guildId,
          textId: interaction.channelId,
          voiceId: voiceChannel.id,
          deaf: true,
          volume: 80
        });
      } catch (error) {
        console.error("Player creation error:", error);
        return interaction.editReply("❌ Failed to connect to voice channel.");
      }
    }

    const isUrl = query.startsWith("http://") || query.startsWith("https://");
    let finalQuery = query;

    // Strict YouTube Bypass: Finds exact URL before sending to Lavalink
    if (!isUrl) {
      try {
        const searchResult = await ytSearch(query);
        if (searchResult && searchResult.videos.length > 0) {
          finalQuery = searchResult.videos[0].url;
        } else {
          return interaction.editReply("❌ No exact match found on YouTube.");
        }
      } catch (err) {
        console.error("Local search failed:", err);
        return interaction.editReply("❌ Shimizu search failed. Please provide a direct URL.");
      }
    }

    const result = await client.kazagumo.search(finalQuery, { requester: interaction.user });

    if (!result || !result.tracks.length) {
      return interaction.editReply("❌ Shimizu Servers failed to process the track. Node is rate-limited - Sale ka Gareeb server.");
    }

    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) player.queue.add(track);
      await interaction.editReply(`✅ Added playlist to queue: **${result.playlistName}** (${result.tracks.length} tracks)`);
    } else {
      player.queue.add(result.tracks[0]);
      await interaction.editReply(`✅ Added to queue: **${result.tracks[0].title}**`);
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }
  }
};