require("dotenv").config();
const { Telegraf } = require("telegraf");
const path = require("path");
const { exec } = require("child_process");
const { saveData } = require("./util");

// Ensure bot API token is set
const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error("BOT_TOKEN is required in .env file");
}

// Initialize bot
const bot = new Telegraf(botToken);

// System variables
const authUser = process.env.AUTH_USER;
let isSleeping = false;
const dataFilepath = process.env.DATA_FILE || "./data.json";
let botData = loadData(dataFilepath) || {
  users: {},
  leaderboard: {},
  games: {},
  rouletteChance: 25,
};

// Listen for messages
bot.on("message", async (ctx) => {
  // Check if system is sleeping (avoid 429 errors)
  if (isSleeping) {
    console.log("System is sleeping, ignoring message");
    return;
  }

  try {
    // Extract message data
    const { username, id } = ctx.message.from;
    const messageText = ctx.message.text;

    // Check if user is in database, if not initialize
    if (!botData.users[id]) {
      botData.users[id] = {
        username,
        rouletteSurvived: 0,
        rouletteLosses: 0,
        gamesPlayed: 0,
      };
      saveData(botData, dataFilepath);
    }

    // Check if message is a command
    if (messageText.startsWith("/")) {
      const [command, ...args] = messageText.split(" ");
      switch (command) {
        // File command
        case "/file":
          const filePath = path.resolve(__dirname, dataFile);
          if (fs.existsSync(filePath)) {
            await ctx.replyWithDocument({
              source: filePath,
              filename: "data.json",
            });
          } else {
            await ctx.reply("Database file not found!");
          }
          return;

        // Code Command
        case "/code":
          const codePath = path.resolve(__dirname, "index.js");
          if (fs.existsSync(codePath)) {
            await ctx.replyWithDocument({
              source: codePath,
              filename: "index.js",
            });
          } else {
            await ctx.reply("Code file not found!");
          }
          return;

        // Update Command
        case "/update":
          if (username === authUser) {
            await ctx.reply("Updating bot... This may take a while.");
            exec(
              `cd /home/josh-bam/telegram-bot && git pull`,
              (error, stdout, stderr) => {
                if (error) {
                  console.error(`Error during git pull: ${error.message}`);
                  ctx.reply(`Update failed: ${error.message}`);
                  return;
                }
                if (stderr) {
                  console.warn(`Git pull stderr: ${stderr}`);
                }
                ctx.reply(`Git pull completed:\n${stdout}`);

                // Reboot the system
                exec(
                  `sudo reboot`,
                  (rebootError, rebootStdout, rebootStderr) => {
                    if (rebootError) {
                      console.error(
                        `Error during reboot: ${rebootError.message}`
                      );
                      ctx.reply(`Reboot failed: ${rebootError.message}`);
                      return;
                    }
                    if (rebootStderr) {
                      console.warn(`Reboot stderr: ${rebootStderr}`);
                    }
                    ctx.reply(`Reboot initiated.`);
                  }
                );
              }
            );
          } else {
            await ctx.reply("You are not authorized to perform updates.");
          }
          return;

        case "/roulette":
          const args = messageText.split(" ");
          const targetUsername = args[1];
          const roll = Math.floor(Math.random() * botData.rouletteChance) + 1;

          // Check if the user lost
          if (roll === 2) {
            botData.users[id].rouletteLosses += 1;
            saveData(dataFilepath, botData);
            await ctx.reply(
              `${targetUsername} has lost the Russian Roulette and is now kicked!`
            );
            // Check and restrict user (simulate timeout logic)
            const chatId = ctx.chat.id;
            const user = await bot.telegram.getChatMember(chatId, id);
            if (user.status === "member" || user.status === "restricted") {
              await bot.telegram.restrictChatMember(chatId, user.user.id, {
                permissions: {
                  can_send_messages: false,
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
            saveData(dataFilepath, botData);
            await ctx.reply(
              `${targetUsername} survives this round of Russian Roulette!`
            );
          }
          return;

        // Leaderboard Command
        case "/leaderboard":
          const leaderboard = Object.entries(botData.users)
            .sort((a, b) => b[1].rouletteSurvived - a[1].rouletteSurvived)
            .map(([id, user]) => {
              return `${user.username}: ${user.rouletteSurvived} wins`;
            });
          await ctx.reply(leaderboard.join("\n"));
          return;
      }
    } else {
      // Check if the sender is the victim
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
