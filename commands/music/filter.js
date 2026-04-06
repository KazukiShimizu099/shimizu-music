const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("filter")
    .setDescription("Shimizu Music - Apply audio filter")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("Filter type")
        .setRequired(true)
        .addChoices(
          {
            name: "🎸 Bass Boost Your Music Using Kazuki AI",
            value: "bassboost",
          },
          {
            name: "🌙 Nightcore (Speed Up) Your Music Using Kazuki AI",
            value: "nightcore",
          },
          { name: "🎵 8D Audio Your Music Using Kazuki AI", value: "eightd" },
          {
            name: "🌊 Vaporwave (Slowed) Your Music Using Kazuki AI",
            value: "vaporwave",
          },
          { name: "❌ Remove Filter", value: "none" },
        ),
    ),

  async execute(interaction, client) {
    let filterType;

    if (interaction.options?.getString) {
      filterType = interaction.options.getString("type");
    } else {
      filterType = interaction.options.getString("type");
    }

    if (!filterType) {
      return interaction.reply({
        content:
          "❌ Please provide a filter type!\nOptions: `bassboost`, `nightcore`, `8D`, `vaporwave`, `none`",
        ephemeral: true,
      });
    }

    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    }

    const filters = {
      bassboost: {
        equalizer: [
          { band: 0, gain: 0.8 },
          { band: 1, gain: 0.75 },
          { band: 2, gain: 0.7 },
          { band: 3, gain: 0.65 },
          { band: 4, gain: 0.6 },
          { band: 5, gain: 0.55 },
          { band: 6, gain: 0.5 },
          { band: 7, gain: 0.4 },
          { band: 8, gain: 0.3 },
          { band: 9, gain: 0.2 },
        ],
      },
      nightcore: {
        timescale: { speed: 1.3, pitch: 1.3, rate: 1.0 },
      },
      eightd: {
        rotation: { rotationHz: 0.2 },
      },
      vaporwave: {
        timescale: { speed: 0.8, pitch: 0.8, rate: 1.0 },
        equalizer: [
          { band: 1, gain: 0.3 },
          { band: 0, gain: 0.3 },
        ],
      },
      none: {},
    };

    const filterNames = {
      bassboost: "🎸 Bass Boost Your Music Using Kazuki AI",
      nightcore: "🌙 Nightcore (Speed Up) Your Music Using Kazuki AI",
      eightd: "🎵 8D Audio Your Music Using Kazuki AI",
      vaporwave: "🌊 Vaporwave (Slowed) Your Music Using Kazuki AI",
      none: "❌ Filter Removed",
    };

    try {
      await player.shoukaku.setFilters(filters[filterType] || {});
      await interaction.reply({
        content: `✅ Filter applied: **${filterNames[filterType]}**`,
        ephemeral: false,
      });
    } catch (e) {
      console.error("Filter error:", e);
      await interaction.reply({
        content:
          "❌ An error occurred while applying the filter! The node may not support filters.",
        ephemeral: true,
      });
    }
  },
};
