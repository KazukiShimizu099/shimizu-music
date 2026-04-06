const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const os = require("os");

const OWNER_ID = "TUMHARA_DISCORD_USER_ID";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shimizu Music - Bot statistics"),

  async execute(interaction, client) {
    if (interaction.user.id !== 1382614880137379921) {
      return interaction.reply({
        content: "❌ This command is only for the bot owner!",
        ephemeral: true,
      });
    }

    const totalServers = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0,
    );
    const activePlayers = client.kazagumo.players.size;
    const ping = client.ws.ping;

    const vcTime = client.vcTime || 0;
    const vcHours = Math.floor(vcTime / 3600);
    const vcMinutes = Math.floor((vcTime % 3600) / 60);
    const vcSeconds = Math.floor(vcTime % 60);

    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);

    const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const cpuLoad = os.loadavg()[0].toFixed(2);

    const nodeVersion = process.version;
    const discordVersion = require("discord.js").version;

    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "Shimizu Music — Owner Statistics",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription("> 🔒 Owner only — Real-time bot statistics")
      .addFields(
        {
          name: "🌐 Bot Info",
          value: [
            `**Servers:** ${totalServers}`,
            `**Total Users:** ${totalUsers.toLocaleString()}`,
            `**Active Players:** ${activePlayers}`,
            `**Ping:** ${ping}ms`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "⏱️ Time Stats",
          value: [
            `**Uptime:** ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
            `**VC Time:** ${vcHours}h ${vcMinutes}m ${vcSeconds}s`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "💻 System",
          value: [
            `**Memory:** ${memUsage}MB / ${totalMem}MB`,
            `**CPU Load:** ${cpuLoad}%`,
            `**Node.js:** ${nodeVersion}`,
            `**Discord.js:** v${discordVersion}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🎵 Lavalink Nodes",
          value:
            client.kazagumo.shoukaku.nodes.size > 0
              ? [...client.kazagumo.shoukaku.nodes.values()]
                  .map(
                    (node) =>
                      `**${node.name}:** ${node.state === 1 ? "🟢 Online" : "🔴 Offline"} | Players: ${node.stats?.playingPlayers || 0}`,
                  )
                  .join("\n")
              : "No nodes connected",
          inline: false,
        },
      )
      .setFooter({ text: "Shimizu Music 🎶 | Made by KazukiShimizu" })
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
