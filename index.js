require("dotenv").config();
const { Telegraf } = require("telegraf");

// Ensure the bot token is provided
const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error("BOT_TOKEN is required in the .env file");
}

// Initialize the bot
const bot = new Telegraf(botToken);

// Utility function to pause execution for a given number of milliseconds
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Flag to control message processing
let isSleeping = false;

// Russian Roulette handler
const russianRoulette = async (ctx, targetUsername) => {
  const roll = Math.floor(Math.random() * 1000); // Generate a random number between 0 and 999
  console.log(`Russian Roulette roll for ${targetUsername}: ${roll}`);
  if (roll === 0) {
    // Lose condition
    try {
      const chatId = ctx.chat.id;
      const user = await bot.telegram.getChatMember(
        chatId,
        ctx.message.reply_to_message.from.id
      );
      if (user.status === "member" || user.status === "restricted") {
        await bot.telegram.restrictChatMember(chatId, user.user.id, {
          permissions: {
            can_send_messages: false, // No messages allowed
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
          },
          until_date: Math.floor(Date.now() / 1000) + 60, // Timeout for 1 minute
        });
        await ctx.reply(
          `${targetUsername} lost the Russian Roulette and has been timed out for 1 minute!`
        );
      } else {
        await ctx.reply(
          `${targetUsername} is an admin or cannot be timed out!`
        );
      }
    } catch (err) {
      console.error("Error applying timeout:", err);
      await ctx.reply(`Failed to timeout ${targetUsername}.`);
    }
  } else {
    await ctx.reply(
      `${targetUsername} survived the Russian Roulette this time!`
    );
  }
};

// Listen for all messages
bot.on("message", async (ctx) => {
  if (isSleeping) {
    console.log("Message discarded while sleeping.");
    return; // Discard new messages during the sleep period
  }

  try {
    const { username } = ctx.message.from;
    const messageText = ctx.message.text;

    // Russian Roulette command
    if (messageText && messageText.startsWith("/roulette")) {
      const targetUsername = messageText.split(" ")[1];
      if (!targetUsername || !ctx.message.reply_to_message) {
        await ctx.reply(
          "Usage: /roulette @username (Reply to the user's message to target them)"
        );
        return;
      }
      await russianRoulette(ctx, targetUsername);
      return;
    }

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
    if (error.response && error.response.error_code === 429) {
      const retryAfter = error.response.parameters.retry_after || 60; // Default to 60 seconds if Retry-After is missing
      console.warn(`Rate limit hit! Sleeping for ${retryAfter} seconds...`);
      isSleeping = true; // Set the sleeping flag
      await sleep(retryAfter * 1000);
      isSleeping = false; // Reset the sleeping flag
      console.log("Resuming message processing...");
      await ctx.reply("STOP MET SPAMMEN OF IK GA U KICKEN");
    } else {
      console.error("Error handling message:", error);
      // Optionally, send a generic error message to the user
      await ctx.reply("Oops, something went wrong!");
    }
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
