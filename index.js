require("dotenv").config();
const { Telegraf } = require("telegraf");

// Ensure the bot token is provided
const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error("BOT_TOKEN is required in the .env file");
}

// Initialize the bot
const bot = new Telegraf(botToken);

// Listen for all messages
bot.on("message", async (ctx) => {
  try {
    const { username } = ctx.message.from;
    const messageText = ctx.message.text;

    // Check if the username is VISCHCKQTOR
    if (username === "VISCHCKQTOR") {
      await ctx.reply("@VISCHCKQTOR the game");
    }
    // Check if the message is a string and includes "the game"
    else if (
      typeof messageText === "string" &&
      messageText.toLowerCase().includes("the game")
    ) {
      await ctx.reply("@VISCHCKQTOR has lost the game");
    }
  } catch (error) {
    console.error("Error handling message:", error);
    // Optionally, send a generic error message to the user
    await ctx.reply("Oops, something went wrong!");
  }
});

// Log bot start and handle termination signals
console.log("Bot is launching...");
bot.launch().then(() => console.log("Bot successfully launched!"));

process.once("SIGINT", () => {
  console.log("Stopping bot (SIGINT)...");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("Stopping bot (SIGTERM)...");
  bot.stop("SIGTERM");
});
