/**
 * Simple echo bot that replies to your message exactly what you sent.
 */

require("dotenv").config();

const Bot = require("../src/bot");
const shortHands = require("../src/shorthands/defaultShortHands");

const bot = new Bot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands);

bot.addHandler(function (update) {
  this.replyMessage(this.message.text, {
    reply_to_message_id: update.message.message_id,
  });
});

bot.startPolling(0);

// Used to stop the bot after 8 seconds!
setTimeout(() => bot.stopPolling(), 8000);
