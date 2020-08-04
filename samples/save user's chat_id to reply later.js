/**
 * Simple echo bot that replies to your message exactly what you sent.
 */

require("dotenv").config();

const Bot = require("../src/bot");
const shortHands = require("../src/shorthands/defaultShortHands");

const bot = new Bot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands);

bot.addHandler(function (update) {
  setTimeout(() => {
    bot.tapi("sendMessage", {
      chat_id: update.message.chat.id, // Can save this value in DB and use later!
      text: "Sending this 5 seconds later!",
    });
  }, 5000);
});

bot.startPolling(0);

setTimeout(() => bot.stopPolling(), 10000);
