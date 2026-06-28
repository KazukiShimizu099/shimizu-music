const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Genius = require("genius-lyrics");
const GeniusClient = new Genius.Client();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Shimizu Music - Current song ke lyrics dekho"),

  async execute(interaction, client) {
    if (typeof interaction.deferReply === "function" && !interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.editReply("❌ No song is currently playing!");
    }

    const track = player.queue.current;
    // CRITICAL: Clean title for better API matching
    const title = track.title
      .replace(/\(.*?\)|\[.*?\]/g, "")
      .replace(/ft\..*$/i, "")
      .replace(/feat\..*$/i, "")
      .replace(/official video/i, "")
      .replace(/lyric video/i, "")
      .trim();
    const artist = track.author || "";

    let lyrics = null;
    let source = "";
    let synced = false;

    // CRITICAL FIX: LRCLIB strictly requires a User-Agent header to not block the request.
    const headers = {
      "User-Agent": "ShimizuMusicBot/1.0.0 (https://github.com/KazukiShimizu099/shimizu-music)"
    };

    // Source 1: LRCLIB (Synced)
    try {
      const res = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          if (data[0].syncedLyrics) {
            lyrics = data[0].syncedLyrics;
            synced = true;
            source = "LRCLIB (Synced)";
          } else if (data[0].plainLyrics) {
            lyrics = data[0].plainLyrics;
            source = "LRCLIB";
          }
        }
      }
    } catch (e) {
      console.error("LRCLIB error:", e.message);
    }

    // Source 2: Genius Fallback
    if (!lyrics) {
      try {
        const searches = await GeniusClient.songs.search(`${title} ${artist}`);
        if (searches && searches.length > 0) {
          const song = searches[0];
          lyrics = await song.lyrics();
          source = "Genius";
        }
      } catch (e) {
        console.error("Genius error:", e.message);
      }
    }

    // Source 3: LRCLIB Broad Search (Title Only)
    if (!lyrics) {
      try {
        const res = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            lyrics = data[0].plainLyrics || data[0].syncedLyrics;
            synced = !!data[0].syncedLyrics;
            source = "LRCLIB (Fallback)";
          }
        }
      } catch (e) {
        console.error("LRCLIB fallback error:", e.message);
      }
    }

    if (!lyrics) {
      return interaction.editReply(`❌ Lyrics not found for **${track.title}**\nTry searching manually on [Genius](https://genius.com/search?q=${encodeURIComponent(title)})`);
    }

    // Synced Engine Execution
    if (synced) {
      const lines = lyrics.split("\n").map((line) => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (!match) return null;
        return { time: parseInt(match[1]) * 60 + parseFloat(match[2]), text: match[3].trim() };
      }).filter(Boolean);

      if (lines.length === 0) {
        return interaction.editReply("❌ Could not parse synced lyrics!");
      }

      function getCurrentLine(position) {
        const posSeconds = position / 1000 + 1.5; 
        let current = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].time <= posSeconds) current = i;
        }
        return current;
      }

      function buildSyncedEmbed(currentIndex) {
        const start = Math.max(0, currentIndex - 2);
        const end = Math.min(lines.length, currentIndex + 3);
        const display = lines.slice(start, end).map((line, i) => {
          const actualIndex = start + i;
          if (actualIndex === currentIndex) return `### ▶ ${line.text || "♪"}`;
          if (actualIndex === currentIndex - 1) return `> ${line.text || "♪"}`;
          return `${line.text || "♪"}`;
        }).join("\n");

        return new EmbedBuilder()
          .setColor("#FF6B9D")
          .setTitle(`🎵 Live Lyrics — ${track.title}`)
          .setDescription(display || "♪ Instrumental ♪")
          .setFooter({ text: `${track.author} | Source: ${source} | Shimizu Music 🎶` })
          .setTimestamp();
      }

      const msg = await interaction.editReply({ embeds: [buildSyncedEmbed(0)] });
      let lastIndex = -1;

      // CRITICAL FIX: Shifted interval to 2500ms to completely block Discord API rate limits (429)
      const interval = setInterval(async () => {
        try {
          const currentPlayer = client.kazagumo.players.get(interaction.guildId);
          if (!currentPlayer || !currentPlayer.queue.current) {
            return clearInterval(interval);
          }
          const newPos = currentPlayer.shoukaku?.position || 0;
          const newIndex = getCurrentLine(newPos);
          
          if (newIndex !== lastIndex) {
            lastIndex = newIndex;
            await msg.edit({ embeds: [buildSyncedEmbed(newIndex)] }).catch(() => {});
          }
        } catch (e) {
          clearInterval(interval);
        }
      }, 2500);

      setTimeout(() => clearInterval(interval), 600000);
      return;
    }

    // Plain Lyrics Fallback
    const cleanLyrics = lyrics.replace(/\[.*?\]/g, "").trim();
    const trimmed = cleanLyrics.length > 3900 ? cleanLyrics.substring(0, 3900) + "\n\n... *(lyrics truncated)*" : cleanLyrics;

    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({ name: `🎵 Lyrics — ${track.title}`, iconURL: client.user.displayAvatarURL() })
      .setDescription(trimmed)
      .setFooter({ text: `Artist: ${track.author} | Source: ${source} | Shimizu Music 🎶` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};