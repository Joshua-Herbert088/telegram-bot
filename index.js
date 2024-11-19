const { Telegraf } = require("telegraf");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.on("message", async (ctx) => {
  if (ctx.message.from.username === "VISCHCKQTOR") {
    await ctx.reply("@VISCHCKQTOR the game");
  }
});

console.log("Bot is launching...");
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
