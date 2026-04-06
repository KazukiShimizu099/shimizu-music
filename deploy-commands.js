const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const commands = [];
const commandsPath = path.join(__dirname, "commands/music");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded: ${command.data.name}`);
    }
  } catch (e) {
    console.error(`❌ Error loading ${file}:`, e.message);
  }
}

console.log(`Total commands: ${commands.length}`);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function deploy() {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Global commands registered!")
    
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID,
        ),
        { body: commands },
      );
      console.log("✅ Guild commands registered instantly!");
    }
  } catch (e) {
    console.error("❌ Deploy error:", e);
  }
}

deploy();
