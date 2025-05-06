require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');

// Mini-Webserver für Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("✅ Bot is alive!"));
app.listen(PORT, () => console.log(`🌐 Webserver running on port ${PORT}`));

// OpenAI Setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Discord Client Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

console.log("Starting bot...");

client.once('ready', () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
  const channel = member.guild.systemChannel;
  if (channel) {
    channel.send(`👋 Welcome <@${member.id}>! Ask anything or check the boss channels.`);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // Bossfight-Erkennung
  if (content.includes("rockwell")) return message.reply("Keep an Eye out on <#1277266856981565460>");
  if (content.includes("tek cave")) return message.reply("Keep an Eye out on <#1298389632672862318>");
  if (content.includes("broodmother") || content.includes("brood"))
    return message.reply("Keep an Eye out on <#1298389237179224074>");
  if (content.includes("megapithecus") || content.includes("ape"))
    return message.reply("Keep an Eye out on <#1298389115158532107>");
  if (content.includes("dragon")) return message.reply("Keep an Eye out on <#1298388939702272030>");
  if (content.includes("manticore")) return message.reply("Keep an Eye out on <#1298389509070786600>");

  // Frageerkennung für GPT
  const isQuestion =
    content.includes("?") ||
    ["how", "what", "where", "who", "why", "when", "does", "can", "is", "do"].some(q => content.startsWith(q));

  if (!isQuestion) return;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an ARK Survival Evolved helper bot. You know everything about breeding, taming, boss fights, and item values. Use knowledge similar to dododex.com to answer user questions."
        },
        { role: "user", content: message.content }
      ]
    });

    const reply = completion.choices[0].message.content;
    await message.reply(reply);

  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message || "Unknown error";
    console.error("🔴 OpenAI API Error:", errorMessage);
    await message.reply("❌ OpenAI Error: " + errorMessage);
  }
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error("❌ Login failed:", err);
});
