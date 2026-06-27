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
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    let query = interaction.options.getString("query");
    if (!query) {
      return interaction.editReply("❌ Provide a song name or URL.");
    }

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.editReply("❌ You must join a voice channel first.");
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
        console.error(error);
        return interaction.editReply("❌ Failed to join voice channel.");
      }
    }

    const isUrl = query.startsWith("http://") || query.startsWith("https://");
    if (!isUrl && !query.startsWith("ytsearch:") && !query.startsWith("scsearch:")) {
      query = `ytsearch:${query}`;
    }

    const result = await client.kazagumo.search(query, { requester: interaction.user });

    if (!result || !result.tracks.length) {
      return interaction.editReply("❌ No results found. Try a different query.");
    }

    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) {
        player.queue.add(track);
      }
      await interaction.editReply(`✅ Added playlist to queue: **${result.playlistName}** (${result.tracks.length} tracks)`);
    } else {
      player.queue.add(result.tracks[0]);
      await interaction.editReply(`✅ Added to queue: **${result.tracks[0].title}**`);
    }

    if (!player.playing && !player.paused && player.queue.length > 0) {
      player.play();
    }
  }
};