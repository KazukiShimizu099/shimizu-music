module.exports = {
  name: "stop",
  description: "Stop the music and leave the voice channel",
  async execute(message, args, client) {
    // Check if the interaction/message context has guildId securely
    const guildId = message.guild?.id || message.guildId;
    if (!guildId) return;

    // Direct access via safe optional chaining or Kazagumo player cache map
    const player = client.kazagumo?.players?.get(guildId) || client.kazagumo?.player?.get(guildId);

    if (!player) {
      if (typeof message.reply === "function") {
        return message.reply("❌ There is no music playing in this server!");
      }
      return;
    }

    try {
      player.destroy();
      if (typeof message.reply === "function") {
        return message.reply("⏹️ Stopped the player and left the voice channel.");
      }
    } catch (error) {
      console.error("[Shimizu Debug] Stop command error:", error);
    }
  },
};