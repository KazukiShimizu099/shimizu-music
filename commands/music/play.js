const { SlashCommandBuilder } = require("discord.js");
const { Kazagumo } = require("kazagumo");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Plays a song from Spotify or other supported sources")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("The song name or link")
        .setRequired(true)),

  async execute(interaction, client) {
    await interaction.deferReply();

    const query = interaction.options.getString("query");
    const { channel } = interaction.member.voice;

    if (!channel) {
      return interaction.editReply("❌ You need to be in a voice channel!");
    }

    try {
      // Kazagumo automatically uses the defaultSearchEngine (set to 'spotify' in index.js) 
      // to resolve the query or URL.
      const result = await client.kazagumo.search(query, { requester: interaction.user });

      if (!result.tracks.length) {
        return interaction.editReply("❌ No results found.");
      }

      const player = await client.kazagumo.createPlayer({
        guildId: interaction.guild.id,
        textId: interaction.channel.id,
        voiceId: channel.id,
        volume: 100,
        deaf: true,
      });

      if (result.type === "PLAYLIST") {
        for (const track of result.tracks) {
          player.queue.add(track);
        }
        await interaction.editReply(`✅ Added playlist: **${result.playlistName}** (${result.tracks.length} tracks)`);
      } else {
        const track = result.tracks[0];
        player.queue.add(track);
        await interaction.editReply(`✅ Added: **${track.title}**`);
      }

      if (!player.playing && !player.paused) {
        player.play();
      }

    } catch (err) {
      console.error("Play command error:", err);
      await interaction.editReply("❌ An error occurred while trying to play the music.");
    }
  },
};