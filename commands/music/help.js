const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shimizu Music - All commands list"),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "Shimizu Music - Command Center",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        [
          "## ✨ Shimizu Music — Full Command List",
          "**Default Prefix:** `.` | **Slash:** `/`",
          "Every `.command` works as `/command` and vice versa.",
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
        ].join("\n"),
      )
      .addFields(
        {
          name: "🎵 Music Playback",
          value: [
            "`.play` `.p` `/play` `<song/url>` — Play a song or URL",
            "`.skip` `.s` `/skip` — Skip current song",
            "`.stop` `.st` `/stop` — Stop music & disconnect bot",
            "`.pause` `.pa` `/pause` — Pause current song",
            "`.resume` `.r` `/resume` — Resume paused song",
            "`.nowplaying` `.np` `/nowplaying` — Show current song info",
            "`.queue` `.q` `/queue` — Show current queue",
            "`.loop` `.l` `/loop` — Toggle loop (Track > Queue > Off)",
            "`.shuffle` `/shuffle` — Shuffle the queue",
            "`.volume` `.v` `/volume` `<1-100>` — Set volume",
          ].join("\n"),
        },
        {
          name: "🎛️ Audio Filters",
          value: [
            "`.filter` `.f` `/filter` `<type>` — Apply audio filter",
            "> 🎸 `bassboost` — Heavy bass boost",
            "> 🌙 `nightcore` — Sped up + high pitch",
            "> 🎵 `8D Audio` — 8D surround effect",
            "> 🌊 `vaporwave` — Slowed + dreamy",
            "> ❌ `none` — Remove all filters",
          ].join("\n"),
        },
        {
          name: "🎶 Lyrics",
          value: [
            "`.lyrics` `.ly` `/lyrics` — Get lyrics of current song",
            "> Powered by LRCLIB + Genius — Real-time synced when available",
          ].join("\n"),
        },
        {
          name: "📋 Playlist System",
          value: [
            "`/playlist create name:X` — Create a new playlist",
            "`/playlist add name:X` — Add current song to playlist",
            "`/playlist play name:X` — Play a saved playlist",
            "`/playlist list` — View all your playlists",
            "`/playlist show name:X` — View songs in a playlist",
            "`/playlist remove name:X index:N` — Remove a song",
            "`/playlist delete name:X` — Delete a playlist",
            "> 💾 Playlists are saved globally per user",
          ].join("\n"),
        },
        {
          name: "🎮 Player Buttons",
          value: [
            "⏸ **Pause/Resume** — Toggle pause",
            "⏭ **Skip** — Skip to next song",
            "⏹ **Stop** — Stop & disconnect",
            "🔁 **Loop** — Toggle loop mode (Track > Queue > Off)",
            "🔀 **Shuffle** — Shuffle queue",
            "> Buttons appear automatically on every song",
          ].join("\n"),
        },
        {
          name: "📊 Stats & Settings",
          value: [
            "`.stats` `/stats` — View bot statistics",
            "`/setprefix prefix:X` — Change server prefix *(Admin only)*",
            "> Default prefix is `.`",
            "> Example: `/setprefix prefix:!`",
          ].join("\n"),
        },
        {
          name: "🤖 Auto Features",
          value: [
            "> 🎵 Live progress bar updates every 2 seconds",
            "> 👋 Auto-leave when everyone leaves VC (5s)",
            "> ⏱️ Auto-leave after queue ends (2 min)",
            "> 📢 VC status updates with current song",
            "> 🔧 Maintenance mode when bot is unavailable",
          ].join("\n"),
        },
        {
          name: "📌 Quick Examples",
          value: [
            "`.p Believer Imagine Dragons` — Play song",
            "`.p https://youtube.com/watch?v=xxx` — Play URL",
            "`.v 80` — Set volume to 80%",
            "`.f bassboost` — Apply bass boost",
            "`.ly` — Get current song lyrics",
            "`/playlist create name:myfav` — Create playlist",
            "`/playlist play name:myfav` — Play playlist",
            "`/setprefix prefix:!` — Change prefix to !",
          ].join("\n"),
        },
      )
      .setImage("https://i.imgur.com/4M7IWwP.png")
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
