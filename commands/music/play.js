const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or add to queue")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Song name or URL")
        .setRequired(true),
    ),

  async execute(interaction, client) {
    if (typeof interaction.deferReply === "function") {
      await interaction.deferReply();
    }

    let query = interaction.options.getString("query");
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      const msg = "❌ You must be in a voice channel to play music.";
      return interaction.editReply
        ? await interaction.editReply(msg)
        : await interaction.reply(msg);
    }

    let player = client.kazagumo.players.get(interaction.guildId);
    if (!player) {
      try {
        player = await client.kazagumo.createPlayer({
          guildId: interaction.guildId,
          textId: interaction.channelId,
          voiceId: voiceChannel.id,
          deaf: true,
          volume: 80,
        });
      } catch (error) {
        console.error("Player creation error:", error);
        const msg = "❌ Failed to connect to voice channel.";
        return interaction.editReply
          ? await interaction.editReply(msg)
          : await interaction.reply(msg);
      }
    }

    const isUrl = query.startsWith("http://") || query.startsWith("https://");

    // CRITICAL FIX: Shifted to YouTube Music (ytmsearch) for 100% accuracy and block bypass
    if (
      !isUrl &&
      !query.startsWith("ytsearch:") &&
      !query.startsWith("scsearch:") &&
      !query.startsWith("ytmsearch:")
    ) {
      query = `ytmsearch:${query}`;
    }

    const result = await client.kazagumo.search(query, {
      requester: interaction.user,
    });

    if (!result || !result.tracks.length) {
      const msg = "❌ No results found. Try passing a direct URL.";
      return interaction.editReply
        ? await interaction.editReply(msg)
        : await interaction.reply(msg);
    }

    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) player.queue.add(track);
      const msg = `✅ Added playlist to queue: **${result.playlistName}** (${result.tracks.length} tracks)`;
      interaction.editReply
        ? await interaction.editReply(msg)
        : await interaction.reply(msg);
    } else {
      player.queue.add(result.tracks[0]);
      const msg = `✅ Added to queue: **${result.tracks[0].title}**`;
      interaction.editReply
        ? await interaction.editReply(msg)
        : await interaction.reply(msg);
    }

    // CRITICAL FIX: Removed delayed array length check. Forces immediate execution.
    if (!player.playing && !player.paused) {
      player.play();
    }
  },
};
