const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the music and leave the voice channel"),

  async execute(interaction, client) {
    // Handling both Slash Commands and Legacy Messages safely
    const isInteraction = typeof interaction.reply === "function" && interaction.commandId;
    const guildId = interaction.guild?.id || interaction.guildId;

    if (isInteraction && !interaction.deferred) {
      await interaction.deferReply();
    }

    const player = client.kazagumo?.players?.get(guildId);

    if (!player) {
      const msg = "❌ There is no active music playing in this server!";
      return isInteraction ? interaction.editReply(msg) : interaction.reply(msg);
    }

    try {
      // Clear queue and completely terminate the live websocket stream channel
      player.queue.clear();
      await player.destroy();

      const successMsg = "⏹️ Stopped the player, cleared the queue, and left the voice channel.";
      return isInteraction ? interaction.editReply(successMsg) : interaction.reply(successMsg);
    } catch (error) {
      console.error("[Shimizu Debug] Critical exception inside Stop pipeline:", error);
      const errorMsg = "❌ Internal error occurred while halting the stream connection.";
      return isInteraction ? interaction.editReply(errorMsg) : interaction.reply(errorMsg);
    }
  },
};