const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const PLAYLIST_FILE = path.join(__dirname, "../../playlist.json");

function loadPlaylists() {
  try {
    const data = fs.readFileSync(PLAYLIST_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function savePlaylists(data) {
  fs.writeFileSync(PLAYLIST_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Shimizu Music - Manage playlists")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new playlist")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add the current song to a playlist")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("play")
        .setDescription("Play a playlist")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("View all playlists"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("show")
        .setDescription("View songs in a playlist")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a playlist")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a song from a playlist")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("index")
            .setDescription("Song number (check using playlist show)")
            .setRequired(true)
            .setMinValue(1),
        ),
    ),

  async execute(interaction, client) {
    const sub = interaction.options?.getSubcommand
      ? interaction.options.getSubcommand()
      : null;

    // Prefix command support
    if (!sub) {
      return interaction.reply({
        content:
          "❌ Please use `/playlist` slash command for playlist features.",
        ephemeral: true,
      });
    }

    const playlists = loadPlaylists();
    const userId = interaction.user.id;

    // Initialize user playlists
    if (!playlists[userId]) playlists[userId] = {};

    switch (sub) {
      case "create": {
        const name = interaction.options.getString("name").toLowerCase();

        if (playlists[userId][name]) {
          return interaction.reply({
            content: `❌ Playlist **${name}** already exists!`,
            ephemeral: true,
          });
        }

        playlists[userId][name] = { songs: [], createdAt: Date.now() };
        savePlaylists(playlists);

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("✅ Playlist Created - Shimizu Music")
          .setDescription(
            `Playlist **${name}** successfully created!\nUse \`/playlist add name:${name}\` to add songs.`,
          )
          .setFooter({ text: "Shimizu Music 🎶" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case "add": {
        const name = interaction.options.getString("name").toLowerCase();
        const player = client.kazagumo.players.get(interaction.guildId);

        if (!player || !player.queue.current) {
          return interaction.reply({
            content: "❌ No song is currently playing!",
            ephemeral: true,
          });
        }

        if (!playlists[userId][name]) {
          return interaction.reply({
            content: `❌ Playlist **${name}** does not exist! Create it first with \`/playlist create\``,
            ephemeral: true,
          });
        }

        const track = player.queue.current;
        const songData = {
          title: track.title,
          uri: track.uri,
          author: track.author,
          length: track.length,
        };

        // Duplicate check
        const isDuplicate = playlists[userId][name].songs.some(
          (s) => s.uri === songData.uri,
        );
        if (isDuplicate) {
          return interaction.reply({
            content: `❌ **${track.title}** is already in playlist **${name}**!`,
            ephemeral: true,
          });
        }

        playlists[userId][name].songs.push(songData);
        savePlaylists(playlists);

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("✅ Song Added - Shimizu Music")
          .setDescription(`**${track.title}** added to playlist **${name}**!`)
          .addFields(
            {
              name: "👤 Artist",
              value: track.author || "Unknown",
              inline: true,
            },
            {
              name: "📋 Total Songs",
              value: `${playlists[userId][name].songs.length}`,
              inline: true,
            },
          )
          .setFooter({ text: "Shimizu Music 🎶" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case "play": {
        const name = interaction.options.getString("name").toLowerCase();
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
          return interaction.reply({
            content: "❌ Please join a voice channel first!",
            ephemeral: true,
          });
        }

        if (!playlists[userId][name]) {
          return interaction.reply({
            content: `❌ Playlist **${name}** does not exist!`,
            ephemeral: true,
          });
        }

        const songs = playlists[userId][name].songs;
        if (songs.length === 0) {
          return interaction.reply({
            content: `❌ Playlist **${name}** is empty! Add songs with \`/playlist add\``,
            ephemeral: true,
          });
        }

        await interaction.deferReply();

        let player;
        try {
          player = await client.kazagumo.createPlayer({
            guildId: interaction.guildId,
            textId: interaction.channelId,
            voiceId: voiceChannel.id,
            deaf: true,
            volume: 100,
          });
        } catch (e) {
          return interaction.editReply("❌ Failed to join the voice channel!");
        }

        let addedCount = 0;
        for (const song of songs) {
          try {
            const result = await client.kazagumo.search(song.uri, {
              requester: interaction.user,
            });
            if (result && result.tracks.length > 0) {
              player.queue.add(result.tracks[0]);
              addedCount++;
            }
          } catch (e) {
            console.error("Playlist song load error:", e);
          }
        }

        if (!player.playing && !player.paused) await player.play();

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("▶️ Playing Playlist - Shimizu Music")
          .setDescription(`Now playing playlist **${name}**!`)
          .addFields(
            {
              name: "🎵 Songs Loaded",
              value: `${addedCount}/${songs.length}`,
              inline: true,
            },
            {
              name: "👤 Requested by",
              value: interaction.user.toString(),
              inline: true,
            },
          )
          .setFooter({ text: "Shimizu Music 🎶" })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      case "list": {
        const userPlaylists = playlists[userId];
        const playlistNames = Object.keys(userPlaylists);

        if (playlistNames.length === 0) {
          return interaction.reply({
            content:
              "❌ You have no playlists! Create one with `/playlist create`",
            ephemeral: true,
          });
        }

        const listText = playlistNames
          .map(
            (name, i) =>
              `**${i + 1}.** ${name} - ${userPlaylists[name].songs.length} songs`,
          )
          .join("\n");

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("📋 Your Playlists - Shimizu Music")
          .setDescription(listText)
          .setFooter({
            text: `Total: ${playlistNames.length} playlists | Shimizu Music 🎶`,
          })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case "show": {
        const name = interaction.options.getString("name").toLowerCase();

        if (!playlists[userId][name]) {
          return interaction.reply({
            content: `❌ Playlist **${name}** does not exist!`,
            ephemeral: true,
          });
        }

        const songs = playlists[userId][name].songs;
        if (songs.length === 0) {
          return interaction.reply({
            content: `❌ Playlist **${name}** is empty!`,
            ephemeral: true,
          });
        }

        const songList = songs
          .slice(0, 15)
          .map((s, i) => `**${i + 1}.** [${s.title}](${s.uri}) - ${s.author}`)
          .join("\n");

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle(`📋 Playlist: ${name} - Shimizu Music`)
          .setDescription(songList)
          .addFields({
            name: "📊 Total Songs",
            value: `${songs.length} songs`,
            inline: true,
          })
          .setFooter({
            text:
              songs.length > 15
                ? `Showing 15/${songs.length} songs | Shimizu Music 🎶`
                : "Shimizu Music 🎶",
          })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case "delete": {
        const name = interaction.options.getString("name").toLowerCase();

        if (!playlists[userId][name]) {
          return interaction.reply({
            content: `❌ Playlist **${name}** does not exist!`,
            ephemeral: true,
          });
        }

        delete playlists[userId][name];
        savePlaylists(playlists);

        return interaction.reply({
          content: `✅ Playlist **${name}** has been deleted!`,
          ephemeral: false,
        });
      }

      case "remove": {
        const name = interaction.options.getString("name").toLowerCase();
        const index = interaction.options.getInteger("index") - 1;

        if (!playlists[userId][name]) {
          return interaction.reply({
            content: `❌ Playlist **${name}** does not exist!`,
            ephemeral: true,
          });
        }

        const songs = playlists[userId][name].songs;
        if (index < 0 || index >= songs.length) {
          return interaction.reply({
            content: `❌ Invalid song number! Use \`/playlist show\` to view song numbers.`,
            ephemeral: true,
          });
        }

        const removed = songs.splice(index, 1)[0];
        savePlaylists(playlists);

        return interaction.reply({
          content: `✅ **${removed.title}** removed from playlist **${name}**!`,
          ephemeral: false,
        });
      }
    }
  },
};
