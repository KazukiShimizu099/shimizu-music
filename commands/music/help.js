const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shimizu Music - How to use guide"),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "Shimizu Music — How to Use",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        [
          "## ✨ Welcome to Shimizu Music!",
          "Here's everything you need to get started.",
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
        ].join("\n"),
      )
      .addFields(
        {
          name: "🚀 Getting Started",
          value: [
            "**1.** Join a Voice Channel",
            "**2.** Type `.play <song name>` or `/play`",
            "**3.** Bot will join and start playing!",
            "**4.** Use buttons to control playback",
          ].join("\n"),
        },
        {
          name: "🎵 Playing Music",
          value: [
            "`.p <song name>` — Search and play a song",
            "`.p <youtube url>` — Play directly from URL",
            "`.p <playlist url>` — Load entire playlist",
            "",
            "**Example:**",
            "`.p Shape of You Ed Sheeran`",
            "`.p https://youtube.com/watch?v=xxx`",
          ].join("\n"),
        },
        {
          name: "🎮 Controlling Playback",
          value: [
            "Use the **buttons** below each song, or type:",
            "`.s` — Skip song",
            "`.pa` — Pause",
            "`.r` — Resume",
            "`.st` — Stop & disconnect",
            "`.v 80` — Set volume to 80%",
            "`.l` — Toggle loop",
            "`.q` — View queue",
          ].join("\n"),
        },
        {
          name: "🎛️ Audio Filters",
          value: [
            "Type `.f <filter>` to apply a filter:",
            "`.f bassboost` — 🎸 Heavy bass",
            "`.f nightcore` — 🌙 Fast + high pitch",
            "`.f 8D Audio` — 🎵 8D surround",
            "`.f vaporwave` — 🌊 Slow + dreamy",
            "`.f none` — ❌ Remove filter",
          ].join("\n"),
        },
        {
          name: "📋 Playlists",
          value: [
            "Create and save your own playlists:",
            "`/playlist create name:myfav` — Create",
            "`/playlist add name:myfav` — Add current song",
            "`/playlist play name:myfav` — Play it",
            "`/playlist list` — See all playlists",
            "`/playlist show name:myfav` — View songs",
          ].join("\n"),
        },
        {
          name: "🎶 Lyrics",
          value: [
            "Get lyrics of currently playing song:",
            "`.ly` or `/lyrics`",
            "> Synced real-time lyrics when available!",
          ].join("\n"),
        },
        {
          name: "⚙️ Server Settings",
          value: [
            "Change bot prefix for your server:",
            "`/setprefix prefix:!` — Change to `!`",
            "`/setprefix prefix:$` — Change to `$`",
            "> Only server admins can change prefix",
            "> Default prefix is `.`",
          ].join("\n"),
        },
        {
          name: "💡 Tips",
          value: [
            "> Every `.command` also works as `/command`",
            "> Bot auto-leaves after 2 min of inactivity",
            "> Bot leaves instantly if VC is empty",
            "> Progress bar updates live every 2 seconds",
            "> VC status shows current song name",
          ].join("\n"),
        },
      )
      .setImage("https://cdn.pfps.gg/banners/8401-white-tree.gif")
      .setFooter({
        text: "꒰ Shimizu Music 🌸 ꒱ • Made with ❤️ by KazukiShimizu",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    try {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    } catch (e) {
      interaction.channel.send({ embeds: [embed] });
    }
  },
};
