require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");

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

// Load data from JSON file
const dataFile = "./data.json";
let botData = { users: {}, leaderboard: {}, games: {} };

// Function to load and save data
const loadData = () => {
  if (fs.existsSync(dataFile)) {
    botData = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  }
};
const saveData = () => {
  fs.writeFileSync(dataFile, JSON.stringify(botData, null, 2));
};

// Load data at startup
loadData();

// Listen for all messages
bot.on("message", async (ctx) => {
  if (isSleeping) {
    console.log("Message discarded while sleeping.");
    return; // Discard new messages during the sleep period
  }

  try {
    const { username, id } = ctx.message.from;
    const messageText = ctx.message.text;

    // Ensure user exists in data
    if (!botData.users[id]) {
      botData.users[id] = {
        username,
        rouletteSurvived: 0,
        rouletteLosses: 0,
        gamesPlayed: 0,
      };
      saveData();
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

    // Russian Roulette Command
    if (messageText && messageText.startsWith("/roulette")) {
      const args = messageText.split(" ");
      const targetUsername = args[1] || username;

      const odds = 100;
      const roll = Math.floor(Math.random() * odds) + 1;

      // Check if the user lost
      if (roll === 1) {
        botData.users[id].rouletteLosses += 1;
        saveData();
        await ctx.reply(
          `${targetUsername} has lost the Russian Roulette and is now kicked!`
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
            until_date: Math.floor(Date.now() / 1000) + 300, // Timeout for 5 minutes
          });
          await ctx.reply(
            `${targetUsername} lost the Russian Roulette and has been timed out for 1 minute!`
          );
        } else {
          await ctx.reply(
            `${targetUsername} is an admin or cannot be timed out!`
          );
        }
      } else {
        botData.users[id].rouletteSurvived += 1;
        saveData();
        await ctx.reply(
          `${targetUsername} survives this round of Russian Roulette!`
        );
      }
    }

    // Trivia Game
    if (messageText && messageText.startsWith("/trivia")) {
      const question = "What is the capital of France?";
      const correctAnswer = "Paris";
      await ctx.reply(`Trivia Question: ${question}`);

      // Listener for the correct answer
      bot.on("text", async (ctx) => {
        if (ctx.message.text.toLowerCase() === correctAnswer.toLowerCase()) {
          botData.users[id].gamesPlayed += 1;
          saveData();
          await ctx.reply(`Correct answer! ${username} wins!`);
        }
      });
    }

    // Leaderboard Command
    if (messageText && messageText.startsWith("/leaderboard")) {
      const leaderboard = Object.entries(botData.users)
        .sort(([, a], [, b]) => b.rouletteSurvived - a.rouletteSurvived)
        .slice(0, 5)
        .map(
          ([id, user], index) =>
            `${index + 1}. ${user.username} - ${user.rouletteSurvived} survived`
        );

      await ctx.reply(`Leaderboard:\n${leaderboard.join("\n")}`);
    }
  } catch (error) {
    if (error.response && error.response.error_code === 429) {
      const retryAfter = error.response.parameters.retry_after || 60; // Default to 60 seconds if Retry-After is missing
      console.warn(`Rate limit hit! Sleeping for ${retryAfter} seconds...`);
      isSleeping = true; // Set the sleeping flag
      await sleep(retryAfter * 1000);
      isSleeping = false; // Reset the sleeping flag
      console.log("Resuming message processing...");
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
