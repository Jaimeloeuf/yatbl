/**
 * Bot that only responds to a single type of incoming message
 */

require("dotenv").config();

const { PollingBot, shortHands } = require("../src");
const bot = new PollingBot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands.replyMessage);

bot.addHandler(function (update) {
  // Only execute when user sends a photo
  if (update.message.photo) {
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
