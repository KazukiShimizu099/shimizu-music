const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Shimizu Music - Toggle loop")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Loop mode")
        .setRequired(false)
        .addChoices(
          { name: "🔂 Track - Current song loop", value: "track" },
          { name: "🔁 Queue - Full queue loop", value: "queue" },
          { name: "❌ Off - No loop", value: "none" },
        ),
    ),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({
        content: "❌ No song is currently playing!",
        ephemeral: true,
      });
    }

    let mode = interaction.options?.getString
      ? interaction.options.getString("mode")
      : null;

    if (!mode) {
      // Toggle karo
      if (player.loop === "none") mode = "track";
      else if (player.loop === "track") mode = "queue";
      else mode = "none";
    }

    player.setLoop(mode);

    const messages = {
      track: "🔂 Loop: **Track** - Current song looping!",
      queue: "🔁 Loop: **Queue** - Full queue looping!",
      none: "❌ Loop: **Off**",
    };

    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: messages[mode] });
      } else {
        await interaction.reply({ content: messages[mode] });
      }
    } catch (e) {
      interaction.channel.send(messages[mode]);
    }
  },
};
