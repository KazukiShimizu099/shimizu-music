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
    await interaction.deferReply();
    const query = interaction.options.getString("query");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply("❌ You must be in a voice channel to play music.");
    }

    let player = client.kazagumo.players.get(interaction.guildId);
    if (!player) {
      player = await client.kazagumo.createPlayer({
        guildId: interaction.guild.id,
        textId: interaction.channel.id,
        voiceId: voiceChannel.id,
        deaf: true,
        volume: 80
      });
    }

    const result = await client.kazagumo.search(query, { requester: interaction.user });

    if (!result.tracks.length) {
      return interaction.editReply("❌ No results found. Try a different query.");
    }

    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) player.queue.add(track);
      await interaction.editReply(`✅ Added playlist to queue: **${result.playlistName}** (${result.tracks.length} tracks)`);
    } else {
      player.queue.add(result.tracks[0]);
      await interaction.editReply(`✅ Added to queue: **${result.tracks[0].title}**`);
    }

    if (!player.playing && !player.paused) {
      player.play();
    }
  }
};