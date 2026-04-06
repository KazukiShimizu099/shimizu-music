const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "../../serverconfig.json");

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (e) {
    return {};
  }
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setprefix")
    .setDescription("Shimizu Music - Change the server prefix")
    .addStringOption((opt) =>
      opt
        .setName("prefix")
        .setDescription("Enter a new prefix (example: ! or $ or .)")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(3),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    let newPrefix;

    // Slash command
    if (interaction.options?.getString) {
      newPrefix = interaction.options.getString("prefix");
    } else {
      // Prefix command - args se lo
      const args = interaction.content
        ?.slice(interaction.content.indexOf("setprefix") + 9)
        .trim()
        .split(/ +/);
      newPrefix = args?.[0];
    }

    if (!newPrefix) {
      const reply = {
        content:
          "❌ Please provide a prefix!\nExample: `/setprefix prefix:!` or `.setprefix !`",
        ephemeral: true,
      };
      if (interaction.reply) return interaction.reply(reply);
      return;
    }

    const guildId = interaction.guildId;
    const config = loadConfig();
    config[guildId] = { prefix: newPrefix };
    saveConfig(config);

    await interaction.reply({
      content: `✅ Server prefix has been changed to \`${newPrefix}\`\nExample: \`${newPrefix}play Shape of You\``,
      ephemeral: false,
    });
  },
};
