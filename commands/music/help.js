const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shimizu Music - All commands list"),

  async execute(interaction, client) {
    const mainEmbed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "Shimizu Music - Command Center",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        [
          "## ✨ Shimizu Music — Full Command List",
          "**Default Prefix:** `.` | **Slash:** `/`",
          "Every `.command` also works as `/command` and vice versa.",
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
            "`.loop` `.l` `/loop` — Toggle song loop on/off",
            "`.shuffle` — Shuffle the queue",
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
            "> Powered by LRCLIB — free & no API key needed",
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
            "🔁 **Loop** — Toggle loop mode",
            "🔀 **Shuffle** — Shuffle queue",
            "> Buttons appear on every `/play` response",
          ].join("\n"),
        },
        {
          name: "⚙️ Server Settings",
          value: [
            "`/setprefix prefix:X` — Change server prefix *(Admin only)*",
            "> Default prefix is `.`",
            "> Example: `/setprefix prefix:!`",
            "> Example: `/setprefix prefix:$`",
          ].join("\n"),
        },
        {
          name: "🔧 Maintenance",
          value: [
            "Bot shows maintenance message when under maintenance",
            "> Contact bot owner if bot is unavailable",
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
            "`/playlist add name:myfav` — Add song to playlist",
            "`/playlist play name:myfav` — Play playlist",
            "`/setprefix prefix:!` — Change prefix to !",
          ].join("\n"),
        },
      )
      .setImage(
        "https://imgs.search.brave.com/1EF1VQWuHHs4aDNFYF3ky3Wi6yb9ukcETixsOHHSvF4/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2ExLzNk/L2ZjL2ExM2RmYzAz/ZTNmYThlZjIxZDcw/OTkyZGQxYTgzNDg4/LmpwZw",
      )
      .setFooter({
        text: "꒰ Shimizu Music 🌸 ꒱ • Use / or . prefix for all commands",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    try {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [mainEmbed] });
      } else {
        await interaction.reply({ embeds: [mainEmbed] });
      }
    } catch (e) {
      interaction.channel.send({ embeds: [mainEmbed] });
    }
  },
};
