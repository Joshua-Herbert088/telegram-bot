const { Telegraf } = require("telegraf");
require("dotenv").config();

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error("BOT_TOKEN is required");
}

const bot = new Telegraf(botToken);

bot.on("message", async (ctx) => {
  if (ctx.message.from.username === "VISCHCKQTOR") {
    await ctx.reply("@VISCHCKQTOR the game");
  } else if (typeof ctx.message.text === "string") {
    if (ctx.message.text.includes("the game")) {
      await ctx.reply("@VISCHCKQTOR has lost the game");
    }
  }
});

console.log("Bot is launching...");
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
