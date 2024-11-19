const { Telegraf } = require("telegraf");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.on("message", async (ctx) => {
  if (ctx.message.from.username === "VISCHCKQTOR") {
    await ctx.reply("@VISCHCKQTOR the game");
  } else {
    if (ctx.message.text.contains("the game")) {
      await ctx.reply("@VISCHCKQTOR has lost the game");
    }
  }
});

console.log("Bot is launching...");
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
