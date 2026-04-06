const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Shimizu Music - Current song loop karo"),

  async execute(interaction, client) {
    const guildQueue = client.queue.get(interaction.guildId);

    if (!guildQueue)
      return interaction.reply({
        content: "❌ Koi song nahi chal raha!",
        ephemeral: true,
      });

    guildQueue.loop = !guildQueue.loop;
    await interaction.reply({
      content: `🔁 Loop: **${guildQueue.loop ? "ON" : "OFF"}**`,
      ephemeral: false,
    });
  },
};
