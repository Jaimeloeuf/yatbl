/**
 * Simple echo bot that replies to your message exactly what you sent.
 */

require("dotenv").config();

const { PollingBot, shortHands } = require("../dist");
const bot = new PollingBot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands.replyMessage);

bot.addHandler(function (update) {
  this.replyMessage(update.message.text, {
    reply_to_message_id: update.message.message_id,
  });
});

bot.startPolling(0);

// Used to stop the bot after 8 seconds!
setTimeout(() => bot.stopPolling(), 8000);
