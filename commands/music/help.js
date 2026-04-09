const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shimizu Music - How to use guide"),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "Shimizu Music — Help Guide",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        [
          "## ✨ Welcome to Shimizu Music!",
          "**Default Prefix:** `.` | **Slash:** `/`",
          "Every `.command` works as `/command` and vice versa.",
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
            "**4.** Use buttons below player to control",
          ].join("\n"),
        },
        {
          name: "🎵 Music Commands",
          value: [
            "`.p` `.play` — Play a song or URL",
            "`.s` `.skip` — Skip current song",
            "`.st` `.stop` — Stop music & disconnect",
            "`.pa` `.pause` — Pause current song",
            "`.r` `.resume` — Resume paused song",
            "`.np` `.nowplaying` — Current song info",
            "`.q` `.queue` — View queue",
            "`.l` `.loop` — Toggle loop (Track > Queue > Off)",
            "`.shuffle` — Shuffle the queue",
            "`.v` `.volume` `<1-100>` — Set volume",
          ].join("\n"),
        },
        {
          name: "🎛️ Audio Filters",
          value: [
            "`.f` `.filter` `<type>` — Apply audio filter",
            "> 🎸 `bassboost` — Heavy bass boost",
            "> 🌙 `nightcore` — Fast + high pitch",
            "> 🎵 `8D Audio` — 8D surround effect",
            "> 🌊 `vaporwave` — Slow + dreamy",
            "> ❌ `none` — Remove all filters",
          ].join("\n"),
        },
        {
          name: "🎶 Lyrics",
          value: [
            "`.ly` `.lyrics` — Get lyrics of current song",
            "> Real-time synced lyrics when available",
            "> Powered by LRCLIB + Genius",
          ].join("\n"),
        },
        {
          name: "📋 Playlist System",
          value: [
            "`/playlist create name:X` — Create playlist",
            "`/playlist add name:X` — Add current song",
            "`/playlist play name:X` — Play playlist",
            "`/playlist list` — View all playlists",
            "`/playlist show name:X` — View songs",
            "`/playlist remove name:X index:N` — Remove song",
            "`/playlist delete name:X` — Delete playlist",
            "> 💾 Playlists saved globally per user",
          ].join("\n"),
        },
        {
          name: "🎮 Player Buttons",
          value: [
            "⏸ **Pause/Resume** — Toggle pause",
            "⏭ **Skip** — Skip to next song",
            "⏹ **Stop** — Stop & disconnect",
            "🔁 **Loop** — Toggle loop mode",
            "🔀 **Shuffle** — Shuffle queue",
            "> Buttons appear automatically on every song",
          ].join("\n"),
        },
        {
          name: "⚙️ Settings",
          value: [
            "`/setprefix prefix:X` — Change server prefix *(Admin only)*",
            "`.vote` `/vote` — Vote for Shimizu Music on Top.gg",
            "> Default prefix is `.`",
          ].join("\n"),
        },
        {
          name: "🤖 Auto Features",
          value: [
            "> 🎵 Live progress bar — updates every 2 seconds",
            "> 🔄 Autoplay — plays related song when queue ends",
            "> 👋 Auto-leave — when everyone leaves VC (5s)",
            "> ⏱️ Auto-leave — after queue ends (2 min)",
            "> 📢 VC Status — updates with current song name",
          ].join("\n"),
        },
        {
          name: "📌 Quick Examples",
          value: [
            "`.p Believer Imagine Dragons` — Play song",
            "`.p https://youtube.com/watch?v=xxx` — Play URL",
            "`.v 80` — Set volume to 80%",
            "`.f bassboost` — Bass boost",
            "`.ly` — Get lyrics",
            "`/playlist create name:myfav` — Create playlist",
            "`/setprefix prefix:!` — Change prefix",
          ].join("\n"),
        },
      )
      .setImage("https://cdn.pfps.gg/banners/3373-guts-v-s-griffith.gif")
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
