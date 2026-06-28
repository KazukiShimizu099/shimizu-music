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

    if (isUrl) {
      result = await client.kazagumo.search(query, { requester: interaction.user });
    } else {
      // 1. Primary: YouTube Search
      result = await client.kazagumo.search(`ytsearch:${query}`, { requester: interaction.user });
      
      // 2. Fallback: YouTube Music
      if (!result || !result.tracks.length) {
        result = await client.kazagumo.search(`ytmsearch:${query}`, { requester: interaction.user });
      }

      // 3. Fallback: Spotify Search (Bypasses YouTube IP Blocks if node supports LavaSrc)
      if (!result || !result.tracks.length) {
        result = await client.kazagumo.search(`spsearch:${query}`, { requester: interaction.user });
      }
      
      // STRICT FIX: Removed scsearch (SoundCloud) to prevent garbage podcast results.
    }

    if (!result || !result.tracks.length) {
      return interaction.editReply("❌ YouTube is currently rate-limiting the public nodes. Please paste a direct YouTube or Spotify URL link instead of a song name.");
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