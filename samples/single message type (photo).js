/**
 * Bot that only responds to a single type of incoming message
 */

require("dotenv").config();

const Bot = require("../src/bot");
const shortHands = require("../src/shorthands/defaultShortHands");

const bot = new Bot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands);

bot.addHandler(function (update) {
  // Only execute when user sends a photo
  if (this.message.photo) {
    this.replyMessage("Nice picture!");

    this.tapi("sendPhoto", {
      chat_id: update.message.chat.id,
      caption: "But my picture is cooler!",
      reply_to_message_id: update.message.message_id,
    });
  }
});

bot.startPolling(0);

// Used to stop the bot after 8 seconds!
setTimeout(() => bot.stopPolling(), 8000);
