const { SlashCommandBuilder } = require("discord.js");

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
    let result;

    // Advanced Fallback Search System
    if (isUrl) {
      result = await client.kazagumo.search(query, { requester: interaction.user });
    } else {
      // 1. Try Default YouTube Search
      result = await client.kazagumo.search(`ytsearch:${query}`, { requester: interaction.user });
      
      // 2. Fallback to YouTube Music if blocked
      if (!result || !result.tracks.length) {
        console.log("[Fallback] YouTube failed, trying YouTube Music...");
        result = await client.kazagumo.search(`ytmsearch:${query}`, { requester: interaction.user });
      }
      
      // 3. Fallback to SoundCloud if both YouTube engines are blocked
      if (!result || !result.tracks.length) {
        console.log("[Fallback] YouTube Music failed, trying SoundCloud...");
        result = await client.kazagumo.search(`scsearch:${query}`, { requester: interaction.user });
      }
    }

    if (!result || !result.tracks.length) {
      return interaction.editReply("❌ No results found. All search engines are currently rate-limited. Try using a direct URL.");
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
