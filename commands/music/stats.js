const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const os = require("os");

const OWNER_ID = "1382614880137379921";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shimizu Music - Bot statistics"),

  async execute(interaction, client) {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "❌ This command is only for the bot owner!",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

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

    // Lavalink nodes status
    const nodesStatus =
      [...client.kazagumo.shoukaku.nodes.values()]
        .map((node) => {
          const state = node.state === 1 ? "🟢 Online" : "🔴 Offline";
          const players = node.stats?.playingPlayers || 0;
          const memory = node.stats?.memory
            ? `${Math.round(node.stats.memory.used / 1024 / 1024)}MB`
            : "N/A";
          return `**${node.name}:** ${state} | Players: ${players} | RAM: ${memory}`;
        })
        .join("\n") || "No nodes connected";

    const embed = new EmbedBuilder()
      .setColor("#FF6B9D")
      .setAuthor({
        name: "Shimizu Music — Owner Dashboard",
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription("> 🔒 Restricted to bot owner only")
      .addFields(
        {
          name: "🌐 Bot Overview",
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
          value: nodesStatus,
          inline: false,
        },
      )
      .setFooter({
        text: "Shimizu Music 🎶 | Made by KazukiShimizu",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
