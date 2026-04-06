const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Shimizu Music - Current song ke synced lyrics dekho"),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.editReply("❌ No song is currently playing!");
    }

    const track = player.queue.current;
    const title = track.title.replace(/\(.*?\)|\[.*?\]/g, "").trim();
    const artist = track.author || "";

    let lyrics = null;
    let synced = false;

    try {
      const res = await fetch(
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`,
      );
      const data = await res.json();

      if (data && data.length > 0) {
        // Synced lyrics try karo pehle
        if (data[0].syncedLyrics) {
          lyrics = data[0].syncedLyrics;
          synced = true;
        } else {
          lyrics = data[0].plainLyrics;
        }
      }
    } catch (e) {
      console.error("Lyrics fetch error:", e);
    }

    if (!lyrics) {
      return interaction.editReply(
        `❌ Lyrics not found for **${track.title}**`,
      );
    }

    if (!synced) {
      // Plain lyrics - normal embed
      const trimmed =
        lyrics.length > 3900
          ? lyrics.substring(0, 3900) + "\n\n... *(lyrics truncated)*"
          : lyrics;

      const embed = new EmbedBuilder()
        .setColor("#FF6B9D")
        .setTitle(`🎵 Lyrics — ${track.title}`)
        .setDescription(trimmed)
        .setFooter({ text: `Artist: ${track.author} | Shimizu Music 🎶` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Synced lyrics - real-time update
    const lines = lyrics
      .split("\n")
      .map((line) => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (!match) return null;
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        const text = match[3].trim();
        return { time: minutes * 60 + seconds, text };
      })
      .filter(Boolean);

    if (lines.length === 0) {
      return interaction.editReply("❌ Could not parse synced lyrics!");
    }

    function getCurrentLine(position) {
      const posSeconds = position / 1000;
      let current = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].time <= posSeconds) current = i;
      }
      return current;
    }

    function buildLyricsEmbed(currentIndex) {
      const start = Math.max(0, currentIndex - 3);
      const end = Math.min(lines.length, currentIndex + 6);

      const display = lines
        .slice(start, end)
        .map((line, i) => {
          const actualIndex = start + i;
          if (actualIndex === currentIndex) {
            return `**▶ ${line.text || "♪"}**`;
          }
          return `${line.text || "♪"}`;
        })
        .join("\n");

      return new EmbedBuilder()
        .setColor("#FF6B9D")
        .setTitle(`🎵 Live Lyrics — ${track.title}`)
        .setDescription(display || "♪ Instrumental ♪")
        .setFooter({
          text: `Artist: ${track.author} | Shimizu Music 🎶 | Synced Lyrics`,
        })
        .setTimestamp();
    }

    // First message
    const position = player.shoukaku?.position || 0;
    const currentIndex = getCurrentLine(position);
    const msg = await interaction.editReply({
      embeds: [buildLyricsEmbed(currentIndex)],
    });

    // Real-time update - har 3 second mein
    let lastIndex = currentIndex;
    const interval = setInterval(async () => {
      try {
        const currentPlayer = client.kazagumo.players.get(interaction.guildId);
        if (!currentPlayer || !currentPlayer.queue.current) {
          clearInterval(interval);
          return;
        }

        const pos = currentPlayer.shoukaku?.position || 0;
        const newIndex = getCurrentLine(pos);

        if (newIndex !== lastIndex) {
          lastIndex = newIndex;
          await msg.edit({ embeds: [buildLyricsEmbed(newIndex)] });
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 3000);

    // 10 minute baad automatically stop
    setTimeout(() => clearInterval(interval), 600000);
  },
};
